import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import { Avatar, Spinner } from '../../components/ui';
import { User, Phone, Mail, Lock, Save, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CustomerProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile(form);
      updateUser(form);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match.'); return; }
    if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setSavingPw(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 page-enter">
      <h1 className="page-title">Profile</h1>

      {/* Avatar */}
      <div className="card flex items-center gap-4">
        <Avatar name={user?.name} size="xl" />
        <div>
          <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="badge bg-primary-100 text-primary-700 capitalize mt-1">{user?.role}</span>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><User className="w-4 h-4" /> Personal Information</h2>
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Email Address</label>
          <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={user?.email} disabled />
        </div>
        <div>
          <label className="label">Phone Number</label>
          <input className="input" placeholder="09XXXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <button onClick={handleSaveProfile} disabled={saving} className="btn-primary w-full">
          {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />} Save Changes
        </button>
      </div>

      {/* Change Password */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h2>
        <div>
          <label className="label">Current Password</label>
          <input type="password" className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
        </div>
        <div>
          <label className="label">New Password</label>
          <input type="password" className="input" placeholder="Min. 8 characters" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input type="password" className="input" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
        </div>
        <button onClick={handleChangePassword} disabled={savingPw} className="btn-secondary w-full">
          {savingPw ? <Spinner size="sm" /> : <Lock className="w-4 h-4" />} Change Password
        </button>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="btn-danger w-full">
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </div>
  );
};

export default CustomerProfile;
