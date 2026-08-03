import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeSwitch from '../common/ThemeSwitch';
import darkBg from '../../assets/dark_bg.png';

const LIGHT_BG = "url('https://img.freepik.com/free-photo/blurred-abstract-background-interior-view-looking-out-toward-empty-office-lobby-entrance-doors-glass-curtain-wall-with-frame_1339-6363.jpg')";

const ROLES = [
  { value: 'patient', label: 'Patient', icon: '🏥', desc: 'Book appointments and manage your health records' },
  { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️', desc: 'Manage schedules and view patient appointments' },
  { value: 'nurse', label: 'Nurse', icon: '👩‍⚕️', desc: 'View schedules, verify patients, manage appointments' },
  { value: 'admin', label: 'Admin', icon: '🛡️', desc: 'Full system administration and user management' },
  { value: 'it', label: 'IT Staff', icon: '💻', desc: 'System monitoring and technical support' },
];

const STEPS = ['Role', 'Account', 'Details'];

function FieldInput({ label, name, type = 'text', placeholder, autoComplete, value, error, onChange }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors
          ${error ? 'border-red-400 bg-red-50 dark:bg-red-900/30 dark:text-red-300' : 'border-gray-300 dark:border-gray-600 focus:border-blue-400 bg-white dark:bg-gray-700 dark:text-gray-100'}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { isDark, onThemeToggle } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    specialty: '', department: '', licenseNo: '', employeeId: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateStep1 = () => {
    const errs = {};
    if (!role) errs.role = 'Please select a role to continue';
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    else if (form.firstName.trim().length < 2) errs.firstName = 'Must be at least 2 characters';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    else if (form.lastName.trim().length < 2) errs.lastName = 'Must be at least 2 characters';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else {
      if (form.password.length < 8) errs.password = 'At least 8 characters';
      else if (!/[A-Z]/.test(form.password)) errs.password = 'Must include an uppercase letter';
      else if (!/[a-z]/.test(form.password)) errs.password = 'Must include a lowercase letter';
      else if (!/\d/.test(form.password)) errs.password = 'Must include a number';
      else if (!/[!@#$%^&*()_+\-=[\]{}|;',./:<>?]/.test(form.password)) errs.password = 'Must include a special character';
    }
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const validateStep3 = () => {
    const errs = {};
    if (['doctor', 'nurse'].includes(role)) {
      if (!form.specialty.trim()) errs.specialty = 'Specialty is required';
      if (!form.department.trim()) errs.department = 'Department is required';
      if (!form.licenseNo.trim()) errs.licenseNo = 'License number is required';
    }
    return errs;
  };

  const nextStep = () => {
    let errs = {};
    if (step === 0) errs = validateStep1();
    if (step === 1) errs = validateStep2();
    if (step === 2) errs = validateStep3();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    if (step === 2) handleSubmit();
    else setStep((s) => s + 1);
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
      };
      if (['doctor', 'nurse'].includes(role)) {
        payload.specialty = form.specialty.trim();
        payload.department = form.department.trim();
        payload.licenseNo = form.licenseNo.trim();
      }
      if (role === 'it') payload.employeeId = form.employeeId.trim();
      await register(payload);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setServerError(data.errors.map((e) => e.msg).join(' • '));
      } else {
        setServerError(data?.message || 'Registration failed. Please try again.');
      }
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 bg-cover bg-center${isDark ? ' dark' : ''}`}
      style={{ backgroundImage: isDark ? `url(${darkBg})` : LIGHT_BG }}>
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitch checked={isDark} onChange={onThemeToggle} />
      </div>

      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-black drop-shadow-lg">StaffMed</h1>
          <p className="text-black/70 text-sm mt-1 drop-shadow">Pelican Hospital Management System</p>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="px-8 py-5" style={{ backgroundColor: '#1a2744' }}>
            <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Create account</p>
            <h2 className="text-white text-2xl font-black tracking-wide">REGISTER</h2>
            {/* Step progress */}
            <div className="flex items-center gap-2 mt-4">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${i < step ? 'bg-green-400 text-white' : i === step ? 'bg-white text-gray-900' : 'bg-white/20 text-white/60'}`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-semibold ${i === step ? 'text-white' : 'text-white/60'}`}>{s}</span>
                  {i < STEPS.length - 1 && <div className="w-6 h-px bg-white/30" />}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 px-8 py-7">
            {serverError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm font-medium mb-5">
                {serverError}
              </div>
            )}

            {/* Step 0 — Role selection */}
            {step === 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-600 mb-4">I am a…</p>
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => { setRole(r.value); setErrors({}); }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition-all
                      ${role === r.value ? 'border-blue-900 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 bg-white dark:bg-gray-700'}`}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{r.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.desc}</p>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${role === r.value ? 'border-blue-900 bg-blue-900' : 'border-gray-300'}`}>
                      {role === r.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
              </div>
            )}

            {/* Step 1 — Account credentials */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FieldInput label="First Name" name="firstName" value={form.firstName} error={errors.firstName} onChange={handleChange} placeholder="Maria" autoComplete="given-name" />
                  <FieldInput label="Last Name" name="lastName" value={form.lastName} error={errors.lastName} onChange={handleChange} placeholder="Santos" autoComplete="family-name" />
                </div>
                <FieldInput label="Email Address" name="email" type="email" value={form.email} error={errors.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm outline-none transition-colors
                        ${errors.password ? 'border-red-400 bg-red-50 dark:bg-red-900/30 dark:text-red-300' : 'border-gray-300 dark:border-gray-600 focus:border-blue-400 bg-white dark:bg-gray-700 dark:text-gray-100'}`}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d={showPassword
                            ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"}
                        />
                      </svg>
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  <p className="text-gray-400 text-xs mt-1">Min 8 chars, uppercase, lowercase, number, special character</p>
                </div>
                <FieldInput label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} error={errors.confirmPassword} onChange={handleChange} placeholder="••••••••" autoComplete="new-password" />
              </div>
            )}

            {/* Step 2 — Role-specific details */}
            {step === 2 && (
              <div className="space-y-4">
                {['doctor', 'nurse'].includes(role) && (
                  <>
                    <FieldInput label="Specialty" name="specialty" value={form.specialty} error={errors.specialty} onChange={handleChange} placeholder="e.g. Internal Medicine" />
                    <FieldInput label="Department" name="department" value={form.department} error={errors.department} onChange={handleChange} placeholder="e.g. Cardiology Ward" />
                    <FieldInput label="License Number" name="licenseNo" value={form.licenseNo} error={errors.licenseNo} onChange={handleChange} placeholder="PRC License No." />
                  </>
                )}
                {role === 'it' && (
                  <FieldInput label="Employee ID (optional)" name="employeeId" value={form.employeeId} error={errors.employeeId} onChange={handleChange} placeholder="EMP-0001" />
                )}
                {role === 'patient' && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4 text-sm text-blue-800">
                    <p className="font-semibold mb-1">Almost there!</p>
                    <p>You can fill in your patient demographics after registering from your Profile page.</p>
                  </div>
                )}
                {role === 'admin' && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-5 py-4 text-sm text-amber-800">
                    <p className="font-semibold mb-1">Admin Account</p>
                    <p>Your admin privileges will be active immediately. Please contact IT if you have any issues.</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button type="button" onClick={() => { setStep((s) => s - 1); setErrors({}); }}
                  className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
                  Back
                </button>
              )}
              <button type="button" onClick={nextStep} disabled={loading}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-opacity disabled:opacity-60"
                style={{ backgroundColor: '#1a2744' }}>
                {loading ? 'Creating account…' : step === 2 ? 'Create Account' : 'Continue'}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')}
                className="font-bold underline" style={{ color: '#1a2744' }}>
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
