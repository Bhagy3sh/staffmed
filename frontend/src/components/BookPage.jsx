import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { physiciansAPI, schedulesAPI, appointmentsAPI } from '../services/api';

const cellBg = {
  available: '#86efac',
  limited: '#fde68a',
  full: '#fca5a5',
  unavailable: '#9ca3af',
  empty: 'transparent',
};

function getDayStatus(slots) {
  if (!slots || slots.length === 0) return 'unavailable';
  const booked = slots.filter((s) => s.isBooked).length;
  const total = slots.length;
  if (booked === total) return 'full';
  if (booked >= total * 0.75) return 'limited';
  return 'available';
}

export default function BookPage() {
  const navigate = useNavigate();
  const [physicians, setPhysicians] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  // Snapshot physician + schedule at the moment the slot picker opens
  // so switching physicians mid-flow can't corrupt the booking
  const [lockedPhysicianId, setLockedPhysicianId] = useState(null);
  const [lockedSchedule, setLockedSchedule] = useState(null);

  useEffect(() => {
    physiciansAPI.getAll().then(({ data }) => {
      setPhysicians(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const selectedPhysician = physicians[selectedIdx];

  useEffect(() => {
    if (!selectedPhysician) return;
    setSchedules([]);
    setSelectedDay(null);
    setSelectedSlot(null);
    setSlotPickerOpen(false);
    setLockedSchedule(null);
    setLockedPhysicianId(null);

    let stale = false;
    schedulesAPI.getAll({ doctorId: selectedPhysician._id, month: currentMonth, year: currentYear })
      .then(({ data }) => { if (!stale) setSchedules(data); })
      .catch(() => {});

    return () => { stale = true; };
  }, [selectedPhysician?._id, currentMonth, currentYear]);

  const filteredPhysicians = physicians.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.firstName?.toLowerCase().includes(q) ||
      p.lastName?.toLowerCase().includes(q) ||
      p.specialty?.toLowerCase().includes(q)
    );
  });

  // Build calendar for current month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const scheduleByDay = {};
  schedules.forEach((sch) => {
    const d = new Date(sch.date).getUTCDate();
    scheduleByDay[d] = sch;
  });

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const handleDayClick = (day) => {
    const sch = scheduleByDay[day];
    if (!sch || getDayStatus(sch.slots) === 'full' || getDayStatus(sch.slots) === 'unavailable') return;
    // Snapshot both the schedule and physician at click time — prevents
    // race conditions from corrupting booking if state changes before Confirm
    setLockedSchedule(sch);
    setLockedPhysicianId(selectedPhysician._id);
    setSelectedDay(day);
    setSelectedSlot(null);
    setSlotPickerOpen(true);
    setBookError('');
  };

  const handleBook = async () => {
    if (!chiefComplaint.trim() || chiefComplaint.trim().length < 5) {
      setBookError('Please describe your chief complaint (at least 5 characters).');
      return;
    }
    if (!selectedSlot) { setBookError('Please select a time slot.'); return; }
    if (!lockedPhysicianId || !lockedSchedule) { setBookError('Session error — please reselect a date and try again.'); return; }

    // Build date string directly — avoids UTC offset shifting the day back in local timezones
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

    setBooking(true);
    setBookError('');
    try {
      const { data } = await appointmentsAPI.book({
        physicianId: lockedPhysicianId,
        date: dateStr,
        time: selectedSlot,
        chiefComplaint: chiefComplaint.trim(),
      });
      setSlotPickerOpen(false);
      setChiefComplaint('');
      setSelectedSlot(null);
      setSelectedDay(null);
      navigate('/confirmation', {
        state: {
          booking: {
            physician: { name: `Dr. ${selectedPhysician.firstName} ${selectedPhysician.lastName}`, specialty: selectedPhysician.specialty },
            day: selectedDay,
            month: MONTH_NAMES[currentMonth - 1],
            year: currentYear,
            time: selectedSlot,
            appointmentId: data._id,
          },
        },
      });
    } catch (err) {
      setBookError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const dayStatusColor = (day) => {
    const sch = scheduleByDay[day];
    if (!sch) return cellBg.empty;
    const s = getDayStatus(sch.slots);
    return cellBg[s] || cellBg.empty;
  };

  const dayClickable = (day) => {
    const sch = scheduleByDay[day];
    if (!sch) return false;
    const s = getDayStatus(sch.slots);
    return s === 'available' || s === 'limited';
  };

  return (
    <div className="flex flex-row gap-6 px-8 py-5 h-full">
      {/* Left Panel — Physicians */}
      <div className="w-2/5 flex flex-col rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
        <div className="text-white text-center py-4 flex-shrink-0" style={{ backgroundColor: '#1a2744' }}>
          <h2 className="text-xl font-black tracking-widest">PHYSICIANS</h2>
        </div>

        <div className="border-b border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="border border-gray-400 dark:border-gray-600 rounded-full flex items-center gap-2 px-3 py-1">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or specialty…"
              className="flex-1 outline-none text-base bg-transparent dark:text-gray-100 dark:placeholder-gray-500" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="text-gray-500 dark:text-gray-400 text-xl leading-none">×</button>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
          {loading ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">Loading physicians…</div>
          ) : filteredPhysicians.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">No physicians found.</div>
          ) : (
            filteredPhysicians.map((p) => {
              const origIdx = physicians.indexOf(p);
              return (
                <div key={p._id} onClick={() => { setSelectedIdx(origIdx); setSelectedDay(null); setSelectedSlot(null); setSlotPickerOpen(false); }}
                  className={`px-4 py-5 border-b border-gray-300 dark:border-gray-600 cursor-pointer text-sm font-medium dark:text-gray-200
                    ${selectedIdx === origIdx ? 'bg-gray-200 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <p className="font-bold">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{p.specialty} — {p.department}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel — Calendar + slot picker */}
      <div className="w-3/5 flex flex-col gap-4">
        <div className="flex flex-col rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 flex-1">
          {/* Calendar header */}
          <div className="text-white py-3 flex-shrink-0" style={{ backgroundColor: '#1a2744' }}>
            <div className="flex justify-between items-center px-6">
              <button onClick={prevMonth} className="text-2xl font-bold leading-none hover:opacity-80">{'<'}</button>
              <span className="text-xl font-black tracking-widest">{MONTH_NAMES[currentMonth - 1]} {currentYear}</span>
              <button onClick={nextMonth} className="text-2xl font-bold leading-none hover:opacity-80">{'>'}</button>
            </div>
            <p className="text-center text-xs tracking-widest mt-1 font-semibold text-blue-300">
              {selectedPhysician ? `Dr. ${selectedPhysician.firstName?.toUpperCase()} ${selectedPhysician.lastName?.toUpperCase()}` : 'SELECT A PHYSICIAN'}
            </p>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex-1 grid grid-cols-7 dark:bg-gray-800" style={{ gridAutoRows: '1fr' }}>
            {cells.map((day, i) => (
              <div key={i} onClick={() => day && handleDayClick(day)}
                className={`border border-gray-200 dark:border-gray-600 flex items-center justify-center text-lg font-black
                  ${day && dayClickable(day) ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                  ${day === selectedDay ? 'ring-2 ring-inset ring-blue-500' : ''}
                  dark:text-gray-900`}
                style={{ backgroundColor: day ? dayStatusColor(day) : 'transparent' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
            {[['#86efac', 'Available'], ['#fde68a', 'Limited'], ['#fca5a5', 'Full'], ['#9ca3af', 'None']].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Slot picker + chief complaint */}
        {slotPickerOpen && selectedDay && lockedSchedule && (
          <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                Book for {MONTH_NAMES[currentMonth - 1]} {selectedDay}, {currentYear}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Select a time slot and describe your concern</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Time slots */}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Available Slots</p>
                <div className="flex flex-wrap gap-2">
                  {lockedSchedule.slots.filter((s) => !s.isBooked).map((sl) => (
                    <button key={sl._id} onClick={() => setSelectedSlot(sl.time)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                        ${selectedSlot === sl.time ? 'text-white border-transparent' : 'border-gray-300 text-gray-600 dark:text-gray-300 hover:border-gray-400'}`}
                      style={selectedSlot === sl.time ? { backgroundColor: '#1a2744' } : {}}>
                      {sl.time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chief complaint */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Chief Complaint <span className="text-red-400">*</span>
                </label>
                <textarea value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} rows={3}
                  placeholder="Describe your main concern or reason for the visit…"
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 resize-none" />
                <p className="text-xs text-gray-400 mt-1 text-right">{chiefComplaint.length}/500</p>
              </div>

              {bookError && <p className="text-red-500 text-xs font-medium">{bookError}</p>}

              <div className="flex gap-3">
                <button onClick={() => { setSlotPickerOpen(false); setSelectedDay(null); setSelectedSlot(null); setBookError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleBook} disabled={booking}
                  className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60 transition-opacity"
                  style={{ backgroundColor: '#1a2744' }}>
                  {booking ? 'Booking…' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


