import { useState, useEffect, useCallback } from 'react';
import { healthAPI } from '../../services/api';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'logs', label: 'Activity Logs' },
];

const StatusDot = ({ ok }) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
);

const StatCard = ({ label, value, sub, color = 'text-blue-700' }) => (
  <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-5 py-4 shadow-sm">
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
    <p className={`text-3xl font-black mt-1 ${color}`}>{value ?? '—'}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between px-5 py-3 text-sm">
    <span className="font-semibold text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-gray-800 dark:text-gray-200 font-medium">{value}</span>
  </div>
);

const statusColors = {
  upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  'follow-up': 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default function ITView() {
  const [tab, setTab] = useState('dashboard');
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await healthAPI.get();
      setHealth(data);
      setLastRefreshed(new Date());
    } catch (err) {
      setError('Failed to reach API — server may be down.');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const apiOk = health?.status === 'ok';
  const dbOk = health?.db === 'connected';

  const fmtTime = (d) => new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
      {/* Tab nav */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-wide transition-colors
                ${tab === t.id ? 'text-white' : 'bg-white/80 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-white'}`}
              style={tab === t.id ? { backgroundColor: '#1a2744' } : {}}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={fetchHealth} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm font-medium">
          ⚠ {error}
        </div>
      )}

      {/* ── DASHBOARD TAB ─────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <>
          {/* Service status */}
          <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#1a2744' }}>
              <div>
                <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Live</p>
                <h2 className="text-white text-lg font-black">SYSTEM STATUS</h2>
              </div>
              {lastRefreshed && (
                <span className="text-blue-300 text-xs">Last checked: {fmtTime(lastRefreshed)}</span>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'API Server', ok: apiOk, value: apiOk ? 'Operational' : 'Unreachable' },
                  { label: 'Database', ok: dbOk, value: dbOk ? 'Connected' : 'Disconnected' },
                  { label: 'Auth Service', ok: apiOk, value: apiOk ? 'Running' : 'Unknown' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className={`font-bold text-sm ${s.ok ? 'text-green-600' : 'text-red-500'}`}>
                      <StatusDot ok={s.ok} />{s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Registered Users" value={loading ? '…' : health?.counts?.users} color="text-blue-700" />
                <StatCard label="Total Appointments" value={loading ? '…' : health?.counts?.appointments} color="text-purple-700" />
                <StatCard label="Schedule Days" value={loading ? '…' : health?.counts?.schedules} color="text-teal-700" />
              </div>
            </div>
          </div>

          {/* Users by role */}
          {health?.byRole && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4" style={{ backgroundColor: '#1a2744' }}>
                  <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Breakdown</p>
                  <h2 className="text-white text-base font-black">USERS BY ROLE</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {['patient', 'doctor', 'nurse', 'admin', 'it'].map((role) => {
                    const count = health.byRole[role] || 0;
                    const total = health.counts.users || 1;
                    const pct = Math.round((count / total) * 100);
                    const colors = { patient: 'bg-blue-400', doctor: 'bg-purple-400', nurse: 'bg-teal-400', admin: 'bg-amber-400', it: 'bg-gray-400' };
                    return (
                      <div key={role} className="px-5 py-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-bold capitalize text-gray-700 dark:text-gray-200">{role}</span>
                          <span className="text-gray-500 dark:text-gray-400 font-medium">{count} <span className="text-xs">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors[role]}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Appointments by status */}
              <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4" style={{ backgroundColor: '#1a2744' }}>
                  <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Breakdown</p>
                  <h2 className="text-white text-base font-black">APPOINTMENTS BY STATUS</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {['upcoming', 'completed', 'follow-up', 'cancelled'].map((status) => {
                    const count = health.apptByStatus?.[status] || 0;
                    const total = health.counts.appointments || 1;
                    const pct = Math.round((count / total) * 100);
                    const bar = { upcoming: 'bg-blue-400', completed: 'bg-green-400', 'follow-up': 'bg-yellow-400', cancelled: 'bg-red-400' };
                    return (
                      <div key={status} className="px-5 py-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-bold capitalize text-gray-700 dark:text-gray-200">{status}</span>
                          <span className="text-gray-500 dark:text-gray-400 font-medium">{count} <span className="text-xs">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${bar[status]}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* System info */}
          <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4" style={{ backgroundColor: '#1a2744' }}>
              <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Info</p>
              <h2 className="text-white text-base font-black">SYSTEM INFORMATION</h2>
            </div>
            <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              <Row label="Platform" value="MERN Stack" />
              <Row label="Frontend" value="React 19 + Vite + Tailwind CSS v4" />
              <Row label="Backend" value="Node.js + Express 5" />
              <Row label="Database" value="MongoDB + Mongoose 9" />
              <Row label="Auth" value="JWT (7-day expiry) + Google OAuth" />
              <Row label="API Base" value="/api" />
              <Row label="Environment" value={import.meta.env.MODE} />
            </div>
          </div>
        </>
      )}

      {/* ── LOGS TAB ──────────────────────────────────────────── */}
      {tab === 'logs' && (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-5" style={{ backgroundColor: '#1a2744' }}>
            <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">System</p>
            <h2 className="text-white text-lg font-black">ACTIVITY LOGS</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading activity…</div>
            ) : !health?.recentAppts?.length ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">No recent activity found.</div>
            ) : (
              health.recentAppts.map((a, i) => {
                const patientName = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.trim();
                const doctorName = `Dr. ${a.physician?.firstName || ''} ${a.physician?.lastName || ''}`.trim();
                return (
                  <div key={a._id || i} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-0.5" style={{ backgroundColor: '#1a2744' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        Appointment booked
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold border ${statusColors[a.status] || ''}`}>
                          {a.status}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="font-medium">{patientName || 'Unknown patient'}</span> → {doctorName} on {fmtDate(a.date)} at {a.time}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic truncate">
                        "{a.chiefComplaint}"
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {a.createdAt ? fmtDate(a.createdAt) : ''}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

