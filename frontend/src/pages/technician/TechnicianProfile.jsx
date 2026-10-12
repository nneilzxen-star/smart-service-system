import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import { Avatar, Spinner } from '../../components/ui';
import { Save, LogOut, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TechnicianProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', specialization: user?.specialization || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile(form);
      updateUser(form);
      toast.success('Profile updated.');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match.'); return; }
    setSavingPw(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSavingPw(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 page-enter">
      <h1 className="page-title">Profile</h1>

      <div className="card flex items-center gap-4">
        <Avatar name={user?.name} size="xl" className="bg-emerald-600" />
        <div>
          <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="badge bg-emerald-100 text-emerald-700 mt-1">Technician</span>
          {user?.specialization && <p className="text-sm text-gray-500 mt-1">{user.specialization}</p>}
          {user?.rating > 0 && <p className="text-sm text-amber-600 font-medium">{parseFloat(user.rating).toFixed(1)}★</p>}
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Personal Information</h2>
        <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
        <div><label className="label">Specialization</label><input className="input" placeholder="e.g. AC Repair, Electrical" value={form.specialization} onChange={(e) => setForm({...form, specialization: e.target.value})} /></div>
        <button onClick={handleSave} disabled={saving} className="btn-success w-full">
          {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />} Save Changes
        </button>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h2>
        <div><label className="label">Current Password</label><input type="password" className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm({...pwForm, currentPassword: e.target.value})} /></div>
        <div><label className="label">New Password</label><input type="password" className="input" value={pwForm.newPassword} onChange={(e) => setPwForm({...pwForm, newPassword: e.target.value})} /></div>
        <div><label className="label">Confirm Password</label><input type="password" className="input" value={pwForm.confirmPassword} onChange={(e) => setPwForm({...pwForm, confirmPassword: e.target.value})} /></div>
        <button onClick={handleChangePassword} disabled={savingPw} className="btn-secondary w-full">
          {savingPw ? <Spinner size="sm" /> : <Lock className="w-4 h-4" />} Change Password
        </button>
      </div>

      <button onClick={() => { logout(); navigate('/login'); }} className="btn-danger w-full">
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </div>
  );
};

export default TechnicianProfile;
