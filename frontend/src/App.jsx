import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { useTheme } from './context/ThemeContext';
import './App.css';
import Navbar from './components/Navbar';
import BookPage from './components/BookPage';
import ConfirmationPage from './components/ConfirmationPage';
import ProfilePage from './components/ProfilePage';
import CommunityPage from './components/CommunityPage';
import AboutPage from './components/AboutPage';
import FAQPage from './components/FAQPage';
import ManagePage from './components/ManagePage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import GoogleOnboarding from './components/auth/GoogleOnboarding';
import DoctorView from './components/doctor/DoctorView';
import NurseView from './components/nurse/NurseView';
import AdminView from './components/admin/AdminView';
import ITView from './components/it/ITView';
import ChatBot from './components/common/ChatBot';
import { useAuth } from './context/AuthContext';
import darkBg from './assets/dark_bg.png';

const LIGHT_BG = "url('https://img.freepik.com/free-photo/blurred-abstract-background-interior-view-looking-out-toward-empty-office-lobby-entrance-doors-glass-curtain-wall-with-frame_1339-6363.jpg')";

// Default landing path per role
const ROLE_DEFAULT = {
  patient: '/book',
  doctor: '/schedule',
  nurse: '/appointments',
  admin: '/users',
  it: '/dashboard',
};

// Redirect to login if not authed, or to role-default if wrong role
function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.needsOnboarding) return <Navigate to="/onboarding" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_DEFAULT[user.role] ?? '/login'} replace />;
  }
  return children;
}

// Renders the right appointments view based on the logged-in role
function AppointmentsRoute() {
  const { user } = useAuth();
  if (user?.role === 'doctor') return <DoctorView activePage="appointments" />;
  if (user?.role === 'nurse') return <NurseView activePage="appointments" />;
  if (user?.role === 'admin') return <AdminView activePage="appointments" />;
  return null;
}

// Shared layout shell — Navbar + page content + ChatBot for patients
function AppShell() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  return (
    <div
      className={`h-screen flex flex-col bg-cover bg-no-repeat bg-fixed${isDark ? ' dark' : ''}`}
      style={{ backgroundImage: isDark ? `url(${darkBg})` : LIGHT_BG }}
    >
      <Navbar />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      {user?.role === 'patient' && <ChatBot />}
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const { isDark, onThemeToggle } = useTheme();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500 text-lg font-medium animate-pulse">Loading…</div>
      </div>
    );
  }

  const defaultPath = user ? (ROLE_DEFAULT[user.role] ?? '/login') : '/login';

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — redirect logged-in users to their home */}
        <Route path="/login" element={user ? <Navigate to={defaultPath} replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={defaultPath} replace /> : <RegisterPage />} />
        <Route path="/onboarding" element={<GoogleOnboarding />} />

        {/* Protected shell — all in-app pages */}
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          {/* Patient-only pages */}
          <Route path="/book"         element={<RequireAuth roles={['patient']}><BookPage /></RequireAuth>} />
          <Route path="/confirmation" element={<RequireAuth roles={['patient']}><ConfirmationPage /></RequireAuth>} />
          <Route path="/manage"       element={<RequireAuth roles={['patient']}><ManagePage /></RequireAuth>} />
          <Route path="/community"    element={<RequireAuth roles={['patient']}><CommunityPage /></RequireAuth>} />
          <Route path="/about"        element={<RequireAuth roles={['patient']}><AboutPage /></RequireAuth>} />
          <Route path="/faq"          element={<RequireAuth roles={['patient']}><FAQPage /></RequireAuth>} />

          {/* Doctor-only */}
          <Route path="/schedule"     element={<RequireAuth roles={['doctor']}><DoctorView activePage="schedule" /></RequireAuth>} />

          {/* Shared appointments — renders the right view per role */}
          <Route path="/appointments" element={<RequireAuth roles={['doctor', 'nurse', 'admin']}><AppointmentsRoute /></RequireAuth>} />

          {/* Nurse-only */}
          <Route path="/schedules"    element={<RequireAuth roles={['nurse']}><NurseView activePage="schedules" /></RequireAuth>} />
          <Route path="/verify"       element={<RequireAuth roles={['nurse']}><NurseView activePage="verification" /></RequireAuth>} />

          {/* Admin-only */}
          <Route path="/users"        element={<RequireAuth roles={['admin']}><AdminView activePage="users" /></RequireAuth>} />

          {/* IT-only */}
          <Route path="/dashboard"    element={<RequireAuth roles={['it']}><ITView /></RequireAuth>} />

          {/* Profile — all roles */}
          <Route path="/profile"      element={<RequireAuth><ProfilePage /></RequireAuth>} />
        </Route>

        {/* Root + catch-all */}
        <Route path="/" element={<Navigate to={defaultPath} replace />} />
        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

