import { useState, useEffect } from 'react';
import { appointmentsAPI } from '../services/api';

const statusColors = {
    upcoming: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', label: 'UPCOMING' },
    completed: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', label: 'COMPLETED' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', label: 'CANCELLED' },
    'follow-up': { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', label: 'FOLLOW-UP' },
};

export default function ManagePage() {
    const [appointments, setAppointments] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        appointmentsAPI.getAll()
            .then(({ data }) => setAppointments(data))
            .catch(() => setError('Failed to load appointments.'))
            .finally(() => setLoading(false));
    }, []);

    const handleCancel = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            await appointmentsAPI.cancel(cancelTarget, { cancelReason });
            setAppointments(prev => prev.map(a => a._id === cancelTarget ? { ...a, status: 'cancelled' } : a));
            setCancelTarget(null);
            setCancelReason('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cancel appointment.');
        } finally {
            setCancelling(false);
        }
    };

    const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const fmtDate = (d) => {
        const date = new Date(d);
        return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    return (
        <div className="px-8 py-6 space-y-4">
            {/* Cancel modal */}
            {cancelTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4">
                        <div className="px-6 py-5" style={{ backgroundColor: '#1a2744' }}>
                            <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Action</p>
                            <h3 className="text-white text-lg font-black">CANCEL APPOINTMENT</h3>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Please provide a reason for cancellation (optional):</p>
                            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} maxLength={300}
                                placeholder="Reason for cancellation…"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 resize-none" />
                            <div className="flex gap-3">
                                <button onClick={() => { setCancelTarget(null); setCancelReason(''); }}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                                    Go Back
                                </button>
                                <button onClick={handleCancel} disabled={cancelling}
                                    className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors">
                                    {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header card */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                <div className="px-8 py-6 flex items-center gap-4" style={{ backgroundColor: '#1a2744' }}>
                    <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <div>
                        <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Your Schedule</p>
                        <h1 className="text-white text-2xl font-black tracking-wide">MANAGE APPOINTMENTS</h1>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="bg-white dark:bg-gray-800 px-6 py-3 flex gap-2 border-b border-gray-100 dark:border-gray-700 flex-wrap">
                    {['all', 'upcoming', 'completed', 'cancelled', 'follow-up'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                                filter === f
                                    ? 'text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            style={filter === f ? { backgroundColor: '#1a2744' } : {}}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">{error}</div>}

            {/* Appointments list */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                    <div className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">Loading appointments…</div>
                ) : filtered.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">No appointments found.</div>
                ) : (
                    filtered.map(a => {
                        const s = statusColors[a.status] || statusColors.upcoming;
                        const physicianName = a.physician ? `Dr. ${a.physician.firstName} ${a.physician.lastName}` : 'Unknown Physician';
                        const specialty = a.physician?.specialty || '';
                        return (
                            <div key={a._id} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: '#1a2744' }}>
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" />
                                            <path d="M16 2v4M8 2v4M3 10h18" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{physicianName}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                            {specialty} &bull; {fmtDate(a.date)} at {a.time}
                                        </p>
                                        {a.chiefComplaint && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-0.5">"{a.chiefComplaint}"</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
                                        {s.label}
                                    </span>
                                    {a.verifiedByNurse && (
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">✓</span>
                                    )}
                                    {a.status === 'upcoming' && (
                                        <button
                                            onClick={() => setCancelTarget(a._id)}
                                            className="px-3 py-1 rounded-full text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

