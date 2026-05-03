import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeSwitch from './common/ThemeSwitch';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const DEBUG_ROLES = ['patient', 'doctor', 'nurse', 'admin', 'it'];

export default function Navbar() {
    const { isDark, onThemeToggle } = useTheme();
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [debugOpen, setDebugOpen] = useState(false);
    const [switching, setSwitching] = useState(false);

    // active page = the current path segment, e.g. /book → 'book'
    const activePage = location.pathname.replace('/', '').split('/')[0] || '';

    const handleDebugRole = async (role) => {
        if (role === user?.role) { setDebugOpen(false); return; }
        setSwitching(true);
        try {
            await api.patch('/users/debug-role', { role });
            await refreshUser();
            setDebugOpen(false);
            window.location.reload();
        } catch {
            setSwitching(false);
            setDebugOpen(false);
        }
    };

    const patientLinks = [
        { label: 'About', page: 'about' },
        { label: 'FAQ', page: 'faq' },
        { label: 'Book', page: 'book' },
        { label: 'Manage', page: 'manage' },
        { label: 'Profile', page: 'profile' },
        { label: 'Community', page: 'community' },
    ];

    const doctorLinks = [
        { label: 'My Schedule', page: 'schedule' },
        { label: 'Appointments', page: 'appointments' },
        { label: 'Profile', page: 'profile' },
    ];

    const nurseLinks = [
        { label: 'Appointments', page: 'appointments' },
        { label: 'Schedules', page: 'schedules' },
        { label: 'Verify', page: 'verify' },
        { label: 'Profile', page: 'profile' },
    ];

    const adminLinks = [
        { label: 'Users', page: 'users' },
        { label: 'Appointments', page: 'appointments' },
        { label: 'Profile', page: 'profile' },
    ];

    const itLinks = [
        { label: 'Dashboard', page: 'dashboard' },
        { label: 'Profile', page: 'profile' },
    ];

    const roleLinks = {
        patient: patientLinks,
        doctor: doctorLinks,
        nurse: nurseLinks,
        admin: adminLinks,
        it: itLinks,
    };

    const links = roleLinks[user?.role] || patientLinks;

    return (
        <div className="flex flex-row justify-between items-center px-8 py-4 dark:bg-gray-900">
            <h1 className="font-sans text-3xl dark:text-white">StaffMed</h1>
            <div className="flex flex-row gap-6 items-center">
                {links.map(({ label, page }) => (
                    <a
                        key={page}
                        className={`text-2xl cursor-pointer select-none dark:text-gray-200 ${activePage === page ? 'underline underline-offset-4' : ''}`}
                        onClick={() => navigate(`/${page}`)}
                    >
                        {label}
                    </a>
                ))}
                <ThemeSwitch checked={isDark} onChange={onThemeToggle} />
                {user && (
                    <div className="flex items-center gap-3 ml-2">
                        <div className="relative">
                            <button
                                onClick={() => setDebugOpen((o) => !o)}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-yellow-400 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                                title="Debug: switch role"
                            >
                                <span className="text-xs font-bold text-yellow-700">{user.firstName}</span>
                                <span className="text-xs text-yellow-500 font-mono">[{user.role}]</span>
                                <svg className={`w-3 h-3 text-yellow-500 transition-transform ${debugOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {debugOpen && (
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-yellow-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="px-3 py-2 bg-yellow-50 border-b border-yellow-100">
                                        <p className="text-xs font-black text-yellow-600 uppercase tracking-wider">Debug: Switch Role</p>
                                    </div>
                                    {switching ? (
                                        <div className="px-3 py-3 text-xs text-gray-400 text-center">Switching…</div>
                                    ) : (
                                        DEBUG_ROLES.map((r) => (
                                            <button key={r} onClick={() => handleDebugRole(r)}
                                                className={`w-full text-left px-3 py-2 text-xs font-medium capitalize hover:bg-yellow-50 transition-colors
                                                    ${r === user.role ? 'text-yellow-700 font-black bg-yellow-50' : 'text-gray-600'}`}>
                                                {r === user.role ? '✓ ' : ''}{r}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        <button onClick={logout}
                            className="px-4 py-1.5 rounded-full text-xs font-bold text-white transition-opacity hover:opacity-80"
                            style={{ backgroundColor: '#1a2744' }}>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
