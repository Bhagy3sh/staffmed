import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FaceRecognition from './common/FaceRecognition';

const FaceScanIcon = () => (
  <svg viewBox="0 0 220 220" className="w-44 h-44" fill="none" stroke="#1a2744" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20,65 L20,20 L65,20" />
    <path d="M155,20 L200,20 L200,65" />
    <path d="M20,155 L20,200 L65,200" />
    <path d="M155,200 L200,200 L200,155" />
    <line x1="65" y1="20" x2="155" y2="20" strokeDasharray="9,5" />
    <line x1="65" y1="200" x2="155" y2="200" strokeDasharray="9,5" />
    <line x1="20" y1="65" x2="20" y2="155" strokeDasharray="9,5" />
    <line x1="200" y1="65" x2="200" y2="155" strokeDasharray="9,5" />
    <circle cx="110" cy="93" r="30" />
    <path d="M58,192 Q58,148 110,140 Q162,148 162,192" />
    <line x1="36" y1="98" x2="52" y2="98" />
    <line x1="168" y1="98" x2="184" y2="98" />
  </svg>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-2/5">{label}</span>
    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 text-right w-3/5">{value || '—'}</span>
  </div>
);

function Field({ label, name, type = 'text', value, error, onChange }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange}
        className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-colors dark:bg-gray-700 dark:text-gray-100
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-blue-400'}`} />
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  );
}

function EditDemographicsModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    birthday: user.demographics?.birthday ? new Date(user.demographics.birthday).toISOString().split('T')[0] : '',
    address: user.demographics?.address || '',
    philhealthNo: user.demographics?.philhealthNo || '',
    contactNo: user.demographics?.contactNo || '',
    emergencyContactName: user.demographics?.emergencyContactName || '',
    emergencyContactNo: user.demographics?.emergencyContactNo || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (form.contactNo && !/^[0-9+\-\s]{7,15}$/.test(form.contactNo)) errs.contactNo = 'Invalid format';
    if (form.emergencyContactNo && !/^[0-9+\-\s]{7,15}$/.test(form.emergencyContactNo)) errs.emergencyContactNo = 'Invalid format';
    if (form.philhealthNo && !/^[0-9\-]{0,20}$/.test(form.philhealthNo)) errs.philhealthNo = 'Invalid PhilHealth number';
    return errs;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
    setServerError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const { data } = await usersAPI.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        demographics: {
          birthday: form.birthday || null,
          address: form.address.trim(),
          philhealthNo: form.philhealthNo.trim(),
          contactNo: form.contactNo.trim(),
          emergencyContactName: form.emergencyContactName.trim(),
          emergencyContactNo: form.emergencyContactNo.trim(),
        },
      });
      onSaved(data);
      onClose();
    } catch (err) {
      const d = err.response?.data;
      setServerError(d?.errors ? d.errors.map((e) => e.msg).join(' • ') : (d?.message || 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
        <div className="px-6 py-5" style={{ backgroundColor: '#1a2744' }}>
          <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Edit</p>
          <h3 className="text-white text-lg font-black">PATIENT DEMOGRAPHICS</h3>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-3">
          {serverError && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">{serverError}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" name="firstName" value={form.firstName} error={errors.firstName} onChange={handleChange} />
            <Field label="Last Name" name="lastName" value={form.lastName} error={errors.lastName} onChange={handleChange} />
          </div>
          <Field label="Birthday" name="birthday" type="date" value={form.birthday} error={errors.birthday} onChange={handleChange} />
          <Field label="Address" name="address" value={form.address} error={errors.address} onChange={handleChange} />
          <Field label="PhilHealth No." name="philhealthNo" value={form.philhealthNo} error={errors.philhealthNo} onChange={handleChange} />
          <Field label="Contact No." name="contactNo" value={form.contactNo} error={errors.contactNo} onChange={handleChange} />
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Emergency Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" name="emergencyContactName" value={form.emergencyContactName} error={errors.emergencyContactName} onChange={handleChange} />
              <Field label="Contact No." name="emergencyContactNo" value={form.emergencyContactNo} error={errors.emergencyContactNo} onChange={handleChange} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
              style={{ backgroundColor: '#1a2744' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    usersAPI.getProfile()
      .then(({ data }) => setUser(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (updated) => {
    setUser(updated);
    refreshUser();
  };

  if (loading) {
    return <div className="px-8 py-12 text-center text-gray-400">Loading profile…</div>;
  }

  const isPatient = user?.role === 'patient';
  const fmtBirthday = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <>
      {editOpen && isPatient && <EditDemographicsModal user={user} onClose={() => setEditOpen(false)} onSaved={handleSaved} />}

      <div className="flex flex-row gap-6 px-8 py-6">
        {/* Left — Demographics / Profile */}
        <div className="w-1/2 flex flex-col gap-4">
          <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 w-full">
            <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#1a2744' }}>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                <div>
                  <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">{user?.role?.toUpperCase()}</p>
                  <h2 className="text-white text-lg font-black tracking-wide leading-tight">
                    {isPatient ? 'DEMOGRAPHICS' : 'PROFILE'}
                  </h2>
                </div>
              </div>
              {isPatient && (
                <button onClick={() => setEditOpen(true)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors">
                  Edit
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 pb-4">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <Row label="Full Name" value={`${user?.lastName || ''}, ${user?.firstName || ''}`} />
                <Row label="Email" value={user?.email} />
                {isPatient && (
                  <>
                    <Row label="Birthday" value={fmtBirthday(user?.demographics?.birthday)} />
                    <Row label="Address" value={user?.demographics?.address} />
                    <Row label="PhilHealth No." value={user?.demographics?.philhealthNo} />
                    <Row label="Contact No." value={user?.demographics?.contactNo} />
                  </>
                )}
                {['doctor', 'nurse'].includes(user?.role) && (
                  <>
                    <Row label="Specialty" value={user?.specialty} />
                    <Row label="Department" value={user?.department} />
                    <Row label="License No." value={user?.licenseNo} />
                  </>
                )}
                {user?.role === 'it' && (
                  <Row label="Employee ID" value={user?.employeeId} />
                )}
                <Row label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }) : '—'} />
              </div>

              {/* Emergency contact — patients only */}
              {isPatient && (
                <div className="mx-4 mt-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900">
                  <div className="px-4 py-2 border-b border-red-100 dark:border-red-900">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Emergency Contact</p>
                  </div>
                  <div className="divide-y divide-red-50 dark:divide-red-900">
                    <Row label="Name" value={user?.demographics?.emergencyContactName} />
                    <Row label="Contact No." value={user?.demographics?.emergencyContactNo} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — Face Recognition */}
        <div className="w-1/2 flex flex-col rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 self-start">
          <div className="px-6 py-5 flex items-center gap-3" style={{ backgroundColor: '#1a2744' }}>
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <div>
              <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Identity</p>
              <h2 className="text-white text-lg font-black tracking-wide leading-tight">FACE RECOGNITION</h2>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 flex flex-col items-center justify-center gap-6 px-8 py-8">
            <FaceRecognition role={user?.role} />
          </div>
        </div>
      </div>
    </>
  );
}



