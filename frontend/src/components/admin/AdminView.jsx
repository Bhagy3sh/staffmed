import { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { appointmentsAPI } from '../../services/api';

const roleColors = {
  patient: 'bg-blue-50 text-blue-700 border-blue-200',
  doctor: 'bg-purple-50 text-purple-700 border-purple-200',
  nurse: 'bg-teal-50 text-teal-700 border-teal-200',
  admin: 'bg-amber-50 text-amber-700 border-amber-200',
  it: 'bg-gray-100 text-gray-700 border-gray-200',
};

const apptStatusColors = {
  upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  'follow-up': 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

function StatCard({ label, value, color = 'text-blue-700' }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-5 py-4 shadow-sm">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function RoleSelect({ current, userId, onChanged }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ROLES = ['patient', 'doctor', 'nurse', 'admin', 'it'];

  const handleSelect = async (role) => {
    if (role === current) { setOpen(false); return; }
    setLoading(true);
    try {
      await usersAPI.changeRole(userId, role);
      onChanged();
    } catch {}
    finally { setLoading(false); setOpen(false); }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} disabled={loading}
        className={`px-3 py-1 rounded-full text-xs font-bold border capitalize flex items-center gap-1 ${roleColors[current] || ''} hover:opacity-80 transition-opacity`}>
        {loading ? 'â€¦' : current}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {ROLES.map((r) => (
            <button key={r} onClick={() => handleSelect(r)}
              className={`w-full text-left px-3 py-2 text-xs font-medium capitalize hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                ${r === current ? 'font-black text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
              {r === current ? 'âœ“ ' : ''}{r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminView({ activePage }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const { data } = await usersAPI.getAll(params);
      setUsers(data);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await appointmentsAPI.getAll();
      setAppointments(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
  }, [tab, roleFilter]);

  const handleToggle = async (user) => {
    setActionLoading((p) => ({ ...p, [user._id]: true }));
    try {
      if (user.isActive) await usersAPI.deactivate(user._id);
      else await usersAPI.activate(user._id);
      fetchUsers();
    } catch {}
    finally { setActionLoading((p) => ({ ...p, [user._id]: false })); }
  };

  const TABS = [
    { id: 'users', label: 'User Management' },
    { id: 'appointments', label: 'All Appointments' },
    { id: 'reports', label: 'Reports' },
  ];

  // Reports computed values
  const apptByStatus = ['upcoming', 'completed', 'cancelled', 'follow-up'].map((s) => ({
    status: s,
    count: appointments.filter((a) => a.status === s).length,
  }));

  const usersByRole = ['patient', 'doctor', 'nurse', 'admin', 'it'].map((r) => ({
    role: r,
    count: users.filter((u) => u.role === r).length,
  }));

  // Most booked doctor
  const doctorBookings = {};
  appointments.forEach((a) => {
    if (!a.physician) return;
    const key = a.physician._id;
    if (!doctorBookings[key]) doctorBookings[key] = { name: `Dr. ${a.physician.firstName} ${a.physician.lastName}`, specialty: a.physician.specialty, count: 0 };
    doctorBookings[key].count++;
  });
  const topDoctors = Object.values(doctorBookings).sort((a, b) => b.count - a.count).slice(0, 5);

  const barColors = {
    patient: 'bg-blue-400', doctor: 'bg-purple-400', nurse: 'bg-teal-400', admin: 'bg-amber-400', it: 'bg-gray-400',
    upcoming: 'bg-blue-400', completed: 'bg-green-400', cancelled: 'bg-red-400', 'follow-up': 'bg-yellow-400',
  };

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

      {/* â”€â”€ USER MANAGEMENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {tab === 'users' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Users" value={users.length} color="text-blue-700" />
            <StatCard label="Doctors" value={users.filter((u) => u.role === 'doctor').length} color="text-purple-700" />
            <StatCard label="Patients" value={users.filter((u) => u.role === 'patient').length} color="text-teal-700" />
            <StatCard label="Active" value={users.filter((u) => u.isActive).length} color="text-green-700" />
          </div>

          <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-5" style={{ backgroundColor: '#1a2744' }}>
              <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Admin</p>
              <h2 className="text-white text-lg font-black">USER MANAGEMENT</h2>
            </div>
            <div className="bg-white dark:bg-gray-800 px-6 py-3 flex gap-3 border-b border-gray-100 dark:border-gray-700 flex-wrap items-center">
              <div className="flex gap-2 flex-wrap">
                {['', 'patient', 'doctor', 'nurse', 'admin', 'it'].map((r) => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors
                      ${roleFilter === r ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200'}`}
                    style={roleFilter === r ? { backgroundColor: '#1a2744' } : {}}>
                    {r || 'All'}
                  </button>
                ))}
              </div>
              <div className="flex flex-1 min-w-[200px] gap-2">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  placeholder="Search by name or emailâ€¦"
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                <button onClick={fetchUsers}
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ backgroundColor: '#1a2744' }}>
                  Search
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading usersâ€¦</div>
              ) : users.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-400 text-sm">No users found.</div>
              ) : (
                users.map((u) => (
                  <div key={u._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#1a2744' }}>
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleSelect current={u.role} userId={u._id} onChanged={fetchUsers} />
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${u.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button onClick={() => handleToggle(u)} disabled={!!actionLoading[u._id]}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors disabled:opacity-50
                          ${u.isActive ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                        {actionLoading[u._id] ? 'â€¦' : u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* â”€â”€ ALL APPOINTMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {tab === 'appointments' && (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#1a2744' }}>
            <div>
              <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Admin</p>
              <h2 className="text-white text-lg font-black">ALL APPOINTMENTS</h2>
            </div>
            <button onClick={() => {
              const rows = appointments.map((a) =>
                `"${a.patient?.firstName} ${a.patient?.lastName}","${a.physician?.firstName} ${a.physician?.lastName}","${a.physician?.specialty}","${new Date(a.date).toLocaleDateString()}","${a.time}","${a.status}","${a.chiefComplaint?.replace(/"/g, '""')}"`
              );
              const csv = `Patient,Physician,Specialty,Date,Time,Status,Chief Complaint\n${rows.join('\n')}`;
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'appointments.csv'; a.click();
              URL.revokeObjectURL(url);
            }} className="px-4 py-2 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors">
              Export CSV
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">Loadingâ€¦</div>
            ) : appointments.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">No appointments yet.</div>
            ) : (
              appointments.map((a) => (
                <div key={a._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                      {a.patient?.firstName} {a.patient?.lastName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Dr. {a.physician?.firstName} {a.physician?.lastName} ({a.physician?.specialty}) &bull;{' '}
                      {new Date(a.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} at {a.time}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">{a.chiefComplaint}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${apptStatusColors[a.status] || ''}`}>
                      {a.status.toUpperCase()}
                    </span>
                    {a.verifiedByNurse && (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">âœ“</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* â”€â”€ REPORTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {tab === 'reports' && (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Users" value={users.length} color="text-blue-700" />
            <StatCard label="Total Appointments" value={appointments.length} color="text-purple-700" />
            <StatCard label="Upcoming" value={appointments.filter((a) => a.status === 'upcoming').length} color="text-blue-600" />
            <StatCard label="Completed" value={appointments.filter((a) => a.status === 'completed').length} color="text-green-600" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Users by role */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4" style={{ backgroundColor: '#1a2744' }}>
                <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Breakdown</p>
                <h2 className="text-white text-base font-black">USERS BY ROLE</h2>
              </div>
              <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {usersByRole.map(({ role, count }) => {
                  const pct = users.length ? Math.round((count / users.length) * 100) : 0;
                  return (
                    <div key={role} className="px-5 py-3">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold capitalize text-gray-700 dark:text-gray-200">{role}</span>
                        <span className="text-gray-500 dark:text-gray-400">{count} <span className="text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColors[role]}`} style={{ width: `${pct}%` }} />
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
                {apptByStatus.map(({ status, count }) => {
                  const pct = appointments.length ? Math.round((count / appointments.length) * 100) : 0;
                  return (
                    <div key={status} className="px-5 py-3">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold capitalize text-gray-700 dark:text-gray-200">{status}</span>
                        <span className="text-gray-500 dark:text-gray-400">{count} <span className="text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColors[status]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top doctors */}
          <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4" style={{ backgroundColor: '#1a2744' }}>
              <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Ranking</p>
              <h2 className="text-white text-base font-black">MOST BOOKED PHYSICIANS</h2>
            </div>
            <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {topDoctors.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">No appointment data yet.</div>
              ) : topDoctors.map((doc, i) => {
                const maxCount = topDoctors[0].count || 1;
                const pct = Math.round((doc.count / maxCount) * 100);
                return (
                  <div key={doc.name} className="px-6 py-4 flex items-center gap-4">
                    <span className="text-2xl font-black text-gray-300 dark:text-gray-600 w-7 flex-shrink-0">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-gray-800 dark:text-gray-100">{doc.name}</span>
                        <span className="text-gray-500 dark:text-gray-400 font-medium">{doc.count} appts</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">{doc.specialty}</p>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-purple-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
