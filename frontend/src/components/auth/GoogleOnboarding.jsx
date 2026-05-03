import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeSwitch from '../common/ThemeSwitch';

const ROLES = [
  { value: 'patient', label: 'Patient', icon: '🏥', desc: 'Book appointments and manage your health records' },
  { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️', desc: 'Manage schedules and view patient appointments' },
  { value: 'nurse', label: 'Nurse', icon: '👩‍⚕️', desc: 'View schedules, verify patients, manage appointments' },
  { value: 'admin', label: 'Admin', icon: '🛡️', desc: 'Full system administration and user management' },
  { value: 'it', label: 'IT Staff', icon: '💻', desc: 'System monitoring and technical support' },
];

function Field({ label, name, value, error, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors
          ${error ? 'border-red-400 bg-red-50 dark:bg-red-900/30 dark:text-red-300' : 'border-gray-300 dark:border-gray-600 focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100'}`}
      />
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  );
}

export default function GoogleOnboarding() {
  const { user, completeOnboarding, logout } = useAuth();
  const { isDark, onThemeToggle } = useTheme();
  const [step, setStep] = useState(0); // 0 = role, 1 = details
  const [role, setRole] = useState('');
  const [form, setForm] = useState({ specialty: '', department: '', licenseNo: '', employeeId: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const needsDetails = ['doctor', 'nurse', 'it'].includes(role);

  const validateRole = () => {
    if (!role) return { role: 'Please select a role to continue' };
    return {};
  };

  const validateDetails = () => {
    const errs = {};
    if (['doctor', 'nurse'].includes(role)) {
      if (!form.specialty.trim()) errs.specialty = 'Specialty is required';
      if (!form.department.trim()) errs.department = 'Department is required';
      if (!form.licenseNo.trim()) errs.licenseNo = 'License number is required';
    }
    return errs;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
    setServerError('');
  };

  const handleNext = () => {
    const errs = step === 0 ? validateRole() : validateDetails();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    if (step === 0 && needsDetails) {
      setStep(1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setServerError('');
    try {
      const payload = { role };
      if (['doctor', 'nurse'].includes(role)) {
        payload.specialty = form.specialty.trim();
        payload.department = form.department.trim();
        payload.licenseNo = form.licenseNo.trim();
      }
      if (role === 'it') {
        payload.employeeId = form.employeeId.trim();
      }
      await completeOnboarding(payload);
    } catch (err) {
      const d = err.response?.data;
      setServerError(d?.errors ? d.errors.map((e) => e.msg).join(' • ') : (d?.message || 'Something went wrong. Please try again.'));
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitch checked={isDark} onChange={onThemeToggle} />
      </div>
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-7" style={{ backgroundColor: '#1a2744' }}>
          <p className="text-blue-300 text-xs font-bold tracking-widest uppercase mb-1">Google Sign-In</p>
          <h1 className="text-white text-2xl font-black tracking-wide">COMPLETE YOUR PROFILE</h1>
          <p className="text-blue-200 text-sm mt-2">
            Welcome, <span className="font-bold">{user?.firstName}</span>! Just a few more details to set up your account.
          </p>
        </div>

        {/* Google account info */}
        <div className="px-8 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-200 font-black text-sm flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
          <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">Google</span>
        </div>

        <div className="px-8 py-6 dark:bg-gray-800">
          {/* Steps indicator */}
          {needsDetails && (
            <div className="flex items-center gap-2 mb-6">
              {['Select Role', 'Role Details'].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black
                    ${i <= step ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
                    style={i <= step ? { backgroundColor: '#1a2744' } : {}}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-bold ${i <= step ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}`}>{label}</span>
                  {i < 1 && <div className={`w-8 h-0.5 ${step > i ? 'bg-blue-400' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          )}

          {serverError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">
              {serverError}
            </div>
          )}

          {/* Step 0 — Role selection */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">What is your role at the facility?</p>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => { setRole(r.value); setErrors({}); }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 text-left transition-all
                    ${role === r.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <span className="text-2xl">{r.icon}</span>
                  <div>
                    <p className={`font-bold text-sm ${role === r.value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100'}`}>{r.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                  </div>
                  {role === r.value && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
              {errors.role && <p className="text-red-500 text-xs font-medium mt-1">{errors.role}</p>}
            </div>
          )}

          {/* Step 1 — Role-specific details */}
          {step === 1 && (
            <div className="space-y-4">
              {['doctor', 'nurse'].includes(role) && (
                <>
                  <Field label="Specialty" name="specialty" value={form.specialty} error={errors.specialty} onChange={handleChange} placeholder="e.g. Internal Medicine, Pediatrics" />
                  <Field label="Department" name="department" value={form.department} error={errors.department} onChange={handleChange} placeholder="e.g. Medical Ward, ICU" />
                  <Field label="PRC License No." name="licenseNo" value={form.licenseNo} error={errors.licenseNo} onChange={handleChange} placeholder="e.g. PRC-123456" />
                </>
              )}
              {role === 'it' && (
                <Field label="Employee ID" name="employeeId" value={form.employeeId} error={errors.employeeId} onChange={handleChange} placeholder="e.g. EMP-2024-001" />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {step === 1 && (
              <button
                onClick={() => { setStep(0); setErrors({}); }}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-white font-black text-sm disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: '#1a2744' }}
            >
              {loading ? 'Setting up…' : step === 0 && needsDetails ? 'Next' : 'Complete Setup'}
            </button>
          </div>

          <button
            onClick={logout}
            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  );
}
