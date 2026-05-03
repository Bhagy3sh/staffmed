import { useState, useEffect } from 'react';
import { appointmentsAPI } from '../../services/api';
import { schedulesAPI, physiciansAPI } from '../../services/api';
import FaceRecognition from '../common/FaceRecognition';

const statusColors = {
  upcoming: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'UPCOMING' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'COMPLETED' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'CANCELLED' },
  'follow-up': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'FOLLOW-UP' },
};

function AppointmentRow({ appt, onVerify }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [verifying, setVerifying] = useState(false);
  const s = statusColors[appt.status] || statusColors.upcoming;
  const patientName = `${appt.patient?.firstName || ''} ${appt.patient?.lastName || ''}`.trim();
  const doctorName = `${appt.physician?.firstName || ''} ${appt.physician?.lastName || ''}`.trim();

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await appointmentsAPI.verify(appt._id, { nurseNotes: notes });
      onVerify();
    } catch {}
    finally { setVerifying(false); }
  };

  return (
    <div className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: '#1a2744' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" strokeWidth="2" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{patientName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Dr. {doctorName} &bull; {new Date(appt.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} at {appt.time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>
          {appt.verifiedByNurse
            ? <span className="px-2 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">✓ VERIFIED</span>
            : appt.status === 'upcoming' && <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">UNVERIFIED</span>
          }
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>
      {expanded && (
        <div className="px-6 pb-5 pt-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Chief Complaint</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{appt.chiefComplaint}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Department</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{appt.department || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Patient Email</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{appt.patient?.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Contact</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{appt.patient?.demographics?.contactNo || '—'}</p>
            </div>
          </div>
          {!appt.verifiedByNurse && appt.status === 'upcoming' && (
            <div className="space-y-2">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Nurse notes (optional)"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none resize-none dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500" />
              <button onClick={handleVerify} disabled={verifying}
                className="px-5 py-2 rounded-full text-xs font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: '#1a2744' }}>
                {verifying ? 'Verifying…' : '✓ Mark as Verified'}
              </button>
            </div>
          )}
          {appt.verifiedByNurse && appt.nurseNotes && (
            <div className="rounded-lg bg-teal-50 dark:bg-teal-900 border border-teal-200 dark:border-teal-700 px-4 py-3 text-sm text-teal-800 dark:text-teal-200">
              <span className="font-bold">Nurse Notes: </span>{appt.nurseNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NurseView({ activePage }) {
  const [tab, setTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [physicians, setPhysicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [schedMonth, setSchedMonth] = useState(new Date().getMonth() + 1);
  const [schedYear, setSchedYear] = useState(new Date().getFullYear());

  const fetchAppointments = async () => {
    try {
      const appRes = await appointmentsAPI.getAll();
      setAppointments(appRes.data);
    } catch {}
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params = {};
      if (doctorFilter) params.doctorId = doctorFilter;
      params.month = schedMonth;
      params.year = schedYear;
      const schRes = await schedulesAPI.getAll(params);
      setSchedules(schRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, schRes, phyRes] = await Promise.all([
        appointmentsAPI.getAll(),
        schedulesAPI.getAll({ month: schedMonth, year: schedYear }),
        physiciansAPI.getAll(),
      ]);
      setAppointments(appRes.data);
      setSchedules(schRes.data);
      setPhysicians(phyRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchSchedules(); }, [doctorFilter, schedMonth, schedYear]);

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const TABS = [
    { id: 'appointments', label: 'Appointments' },
    { id: 'schedules', label: "Doctor Schedules" },
    { id: 'verification', label: 'Verification' },
  ];

  return (
    <div className={`flex-1 overflow-y-auto px-8 py-6 space-y-4`}>
      {/* Tab nav */}
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

      {/* Appointments tab */}
      {tab === 'appointments' && (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-5 flex items-center gap-3" style={{ backgroundColor: '#1a2744' }}>
            <div>
              <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">All</p>
              <h2 className="text-white text-lg font-black">PATIENT APPOINTMENTS</h2>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-6 py-3 flex gap-2 border-b border-gray-100 dark:border-gray-700 flex-wrap">
            {['all', 'upcoming', 'completed', 'cancelled', 'follow-up'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors
                  ${filter === f ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200'}`}
                style={filter === f ? { backgroundColor: '#1a2744' } : {}}>
                {f}
              </button>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">No appointments found.</div>
            ) : (
              filtered.map((a) => <AppointmentRow key={a._id} appt={a} onVerify={fetchAppointments} />)
            )}
          </div>
        </div>
      )}

      {/* Schedules tab */}
      {tab === 'schedules' && (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-5" style={{ backgroundColor: '#1a2744' }}>
            <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Overview</p>
            <h2 className="text-white text-lg font-black">DOCTOR SCHEDULES</h2>
          </div>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 px-6 py-3 flex flex-wrap gap-3 border-b border-gray-100 dark:border-gray-700 items-center">
            <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:border-blue-400">
              <option value="">All Doctors</option>
              {physicians.map((p) => (
                <option key={p._id} value={p._id}>Dr. {p.firstName} {p.lastName} ({p.specialty})</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <select value={schedMonth} onChange={(e) => setSchedMonth(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:border-blue-400">
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <input type="number" value={schedYear} onChange={(e) => setSchedYear(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:border-blue-400" />
            </div>
            <span className="text-xs text-gray-400">{schedules.length} schedule(s) found</span>
          </div>
          <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading…</div>
            ) : schedules.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">No schedules uploaded yet.</div>
            ) : (
              schedules.map((sch) => {
                const doctorName = `Dr. ${sch.doctor?.firstName || ''} ${sch.doctor?.lastName || ''}`.trim();
                const available = sch.slots.filter((s) => !s.isBooked).length;
                return (
                  <div key={sch._id} className="px-6 py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{doctorName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{sch.doctor?.specialty} • {sch.doctor?.department}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(sch.date).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${available > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {available}/{sch.slots.length} available
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sch.slots.map((sl) => (
                        <span key={sl._id} className={`px-2 py-0.5 rounded-full text-xs font-semibold border
                          ${sl.isBooked ? 'bg-red-50 text-red-500 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          {sl.time}
                        </span>
                      ))}
                    </div>
                    {sch.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">Note: {sch.notes}</p>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Verification tab */}
      {tab === 'verification' && (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-5" style={{ backgroundColor: '#1a2744' }}>
            <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Identity</p>
            <h2 className="text-white text-lg font-black">PATIENT VERIFICATION</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6">
            <FaceRecognition role="nurse" />
          </div>
        </div>
      )}
    </div>
  );
}
