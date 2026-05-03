import { useState, useEffect } from 'react';
import { schedulesAPI } from '../../services/api';
import { appointmentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const statusColors = {
  upcoming: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'UPCOMING' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'COMPLETED' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'CANCELLED' },
  'follow-up': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'FOLLOW-UP' },
};

const DEFAULT_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// â”€â”€â”€ Schedule Uploader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ScheduleUploader({ onUploaded }) {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [customTime, setCustomTime] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const toggleSlot = (time) => {
    setSlots((prev) => prev.includes(time) ? prev.filter((s) => s !== time) : [...prev, time]);
  };

  const addCustom = () => {
    const t = customTime.trim();
    if (!t) return;
    if (slots.includes(t)) { setErrors({ custom: 'Time already added' }); return; }
    setSlots((prev) => [...prev, t]);
    setCustomTime('');
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!date) errs.date = 'Date is required';
    if (slots.length === 0) errs.slots = 'Select at least one time slot';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setSuccess('');
    try {
      await schedulesAPI.create({ date, slots: slots.map((t) => ({ time: t })), notes });
      setSuccess('Schedule uploaded!');
      setDate('');
      setSlots([]);
      setNotes('');
      onUploaded?.();
    } catch (err) {
      const data = err.response?.data;
      setErrors({ server: data?.errors ? data.errors.map((e) => e.msg).join(' â€¢ ') : (data?.message || 'Upload failed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-5 flex items-center gap-3" style={{ backgroundColor: '#1a2744' }}>
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#93c5fd" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <div>
          <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Upload</p>
          <h2 className="text-white text-lg font-black tracking-wide">MY SCHEDULE</h2>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 px-6 py-5 space-y-4">
        {errors.server && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">{errors.server}</div>}
        {success && <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm font-semibold">{success}</div>}

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Date</label>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: '' })); }}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors dark:bg-gray-700 dark:text-gray-100
              ${errors.date ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-blue-400'}`} />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Available Time Slots</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {DEFAULT_SLOTS.map((t) => (
              <button key={t} type="button" onClick={() => toggleSlot(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                  ${slots.includes(t) ? 'text-white border-transparent' : 'border-gray-300 text-gray-600 dark:text-gray-300 hover:border-gray-400'}`}
                style={slots.includes(t) ? { backgroundColor: '#1a2744' } : {}}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input type="text" value={customTime} onChange={(e) => setCustomTime(e.target.value)}
              placeholder="Custom: e.g. 5:00 PM"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
            <button type="button" onClick={addCustom}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ backgroundColor: '#1a2744' }}>
              Add
            </button>
          </div>
          {errors.custom && <p className="text-red-500 text-xs mt-1">{errors.custom}</p>}
          {errors.slots && <p className="text-red-500 text-xs mt-1">{errors.slots}</p>}
          {slots.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {slots.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#1a2744' }}>
                  {t}
                  <button type="button" onClick={() => setSlots((p) => p.filter((s) => s !== t))} className="opacity-70 hover:opacity-100">Ã—</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="e.g. OPD consultations only"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 resize-none" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#1a2744' }}>
          {loading ? 'Uploadingâ€¦' : 'Upload Schedule'}
        </button>
      </form>
    </div>
  );
}

// â”€â”€â”€ My Calendar (doctor's own schedule view) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MyCalendar({ refreshKey, onRefresh }) {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const fetchSchedules = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await schedulesAPI.getAll({ doctorId: user._id, month: currentMonth, year: currentYear });
      setSchedules(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSchedules(); }, [currentMonth, currentYear, refreshKey, user]);

  const scheduleByDay = {};
  schedules.forEach((sch) => {
    scheduleByDay[new Date(sch.date).getUTCDate()] = sch;
  });

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const dayColor = (day) => {
    const sch = scheduleByDay[day];
    if (!sch) return 'transparent';
    const avail = sch.slots.filter((s) => !s.isBooked).length;
    if (avail === 0) return '#fca5a5';
    if (avail < sch.slots.length * 0.5) return '#fde68a';
    return '#86efac';
  };

  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const selectedSch = selectedDay ? scheduleByDay[selectedDay] : null;

  const handleDelete = async (schedId) => {
    setDeleting(schedId);
    setDeleteError('');
    try {
      await schedulesAPI.delete(schedId);
      setSelectedDay(null);
      onRefresh();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Could not delete schedule.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="text-white py-3" style={{ backgroundColor: '#1a2744' }}>
        <div className="flex justify-between items-center px-6">
          <button onClick={prevMonth} className="text-2xl font-bold leading-none hover:opacity-80">{'<'}</button>
          <span className="text-lg font-black tracking-widest">{MONTH_NAMES[currentMonth - 1]} {currentYear}</span>
          <button onClick={nextMonth} className="text-2xl font-bold leading-none hover:opacity-80">{'>'}</button>
        </div>
        <p className="text-center text-xs tracking-widest mt-1 font-semibold text-blue-300">MY SCHEDULE</p>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 dark:bg-gray-800" style={{ gridAutoRows: '48px' }}>
        {cells.map((day, i) => {
          const sch = day ? scheduleByDay[day] : null;
          return (
            <div key={i}
              onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
              className={`border border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center text-sm font-black
                ${day && sch ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                ${day === selectedDay ? 'ring-2 ring-inset ring-blue-500' : ''}
                dark:text-gray-900`}
              style={{ backgroundColor: day ? dayColor(day) : 'transparent' }}>
              {day}
              {sch && (
                <span className="text-xs font-normal opacity-70">
                  {sch.slots.filter((s) => !s.isBooked).length}/{sch.slots.length}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        {[['#86efac', 'Available'], ['#fde68a', 'Half-booked'], ['#fca5a5', 'Full']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
              {MONTH_NAMES[currentMonth - 1]} {selectedDay}, {currentYear}
            </p>
            {selectedSch && (
              <button
                onClick={() => handleDelete(selectedSch._id)}
                disabled={!!deleting}
                className="px-3 py-1.5 rounded-full text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors">
                {deleting ? 'Deletingâ€¦' : 'Delete Day'}
              </button>
            )}
          </div>
          {deleteError && <p className="text-red-500 text-xs mb-2">{deleteError}</p>}
          {!selectedSch ? (
            <p className="text-sm text-gray-400">No schedule for this day. Upload one above.</p>
          ) : (
            <>
              {selectedSch.notes && <p className="text-xs text-gray-500 italic mb-2">Note: {selectedSch.notes}</p>}
              <div className="flex flex-wrap gap-1.5">
                {selectedSch.slots.map((sl) => (
                  <span key={sl._id}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border
                      ${sl.isBooked ? 'bg-red-50 text-red-500 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    {sl.time} {sl.isBooked ? '(booked)' : ''}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Appointment Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AppointmentCard({ appt, onComplete, onFollowup }) {
  const [expanded, setExpanded] = useState(false);
  const s = statusColors[appt.status] || statusColors.upcoming;
  const patientName = `${appt.patient?.firstName || ''} ${appt.patient?.lastName || ''}`.trim();

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
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{patientName || 'Unknown Patient'}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(appt.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} at {appt.time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>
          {appt.verifiedByNurse && (
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">âœ“ VERIFIED</span>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-5 pt-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-1">Chief Complaint</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{appt.chiefComplaint}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-1">Department</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{appt.department || 'â€”'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-1">Patient Contact</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{appt.patient?.demographics?.contactNo || 'â€”'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-1">PhilHealth</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{appt.patient?.demographics?.philhealthNo || 'â€”'}</p>
            </div>
          </div>
          {appt.status === 'upcoming' && (
            <div className="flex gap-2">
              <button onClick={() => onComplete(appt._id)}
                className="px-4 py-2 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
                Mark Complete
              </button>
              <button onClick={() => onFollowup(appt._id)}
                className="px-4 py-2 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors">
                Follow-up
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ DoctorView â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function DoctorView({ activePage }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [scheduleKey, setScheduleKey] = useState(0);
  const [tab, setTab] = useState('schedule');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await appointmentsAPI.getAll();
      setAppointments(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (activePage === 'appointments') setTab('appointments');
    else if (activePage === 'schedule') setTab('schedule');
  }, [activePage]);

  const handleComplete = async (id) => {
    try { await appointmentsAPI.complete(id); fetchAppointments(); } catch {}
  };
  const handleFollowup = async (id) => {
    try { await appointmentsAPI.followup(id); fetchAppointments(); } catch {}
  };

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const TABS = [
    { id: 'schedule', label: 'My Schedule' },
    { id: 'appointments', label: 'Appointments' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
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

      {/* â”€â”€ MY SCHEDULE TAB â”€â”€ */}
      {tab === 'schedule' && (
        <div className="flex flex-row gap-6">
          <div className="w-2/5 flex-shrink-0">
            <ScheduleUploader onUploaded={() => setScheduleKey((k) => k + 1)} />
          </div>
          <div className="flex-1">
            <MyCalendar refreshKey={scheduleKey} onRefresh={() => setScheduleKey((k) => k + 1)} />
          </div>
        </div>
      )}

      {/* â”€â”€ APPOINTMENTS TAB â”€â”€ */}
      {tab === 'appointments' && (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-5 flex items-center gap-3" style={{ backgroundColor: '#1a2744' }}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#93c5fd" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Booked</p>
              <h2 className="text-white text-lg font-black tracking-wide">MY APPOINTMENTS</h2>
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
              <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading appointmentsâ€¦</div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">No appointments found.</div>
            ) : (
              filtered.map((a) => (
                <AppointmentCard key={a._id} appt={a} onComplete={handleComplete} onFollowup={handleFollowup} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

