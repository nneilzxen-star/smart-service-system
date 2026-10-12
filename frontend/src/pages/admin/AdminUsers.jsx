import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { formatDateTime, getErrorMessage, timeAgo } from '../../utils/helpers';
import { SkeletonTable, ErrorState, EmptyState, Modal, ConfirmDialog, Spinner } from '../../components/ui';
import { Users, Search, Edit2, Trash2, CheckCircle, XCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['', 'customer', 'technician', 'admin'];
const STATUSES = ['', 'active', 'inactive', 'suspended'];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await adminAPI.getUsers({ role: roleFilter || undefined });
      setUsers(data.users || []);
    } catch { setError('Failed to load users.'); }
    finally { setLoading(false); }
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (user) => { setEditUser({ ...user }); setEditModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateUser(editUser.id, editUser);
      toast.success('User updated.');
      setEditModal(false);
      fetchUsers();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await adminAPI.deleteUser(deleteTarget.id);
      toast.success('User deactivated.');
      setDeleteDialog(false);
      fetchUsers();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const roleColors = { admin: 'bg-red-100 text-red-700', technician: 'bg-blue-100 text-blue-700', customer: 'bg-gray-100 text-gray-700' };
  const statusColors = { active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-gray-100 text-gray-500', suspended: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="text-sm text-gray-500">Manage all system users</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-40" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r || 'All Roles'}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <div className="p-6"><SkeletonTable /></div>
          : error ? <ErrorState message={error} onRetry={fetchUsers} />
          : filtered.length === 0 ? <EmptyState icon={Users} title="No users found" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Joined</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                            {u.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400 md:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge capitalize ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge capitalize ${statusColors[u.status] || 'bg-gray-100 text-gray-600'}`}>{u.status}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-400 text-xs">{timeAgo(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(u)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => { setDeleteTarget(u); setDeleteDialog(true); }} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit User">
        {editUser && (
          <div className="space-y-4">
            <div><label className="label">Name</label><input className="input" value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={editUser.phone || ''} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} /></div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}>
                {['customer','technician','admin'].map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={editUser.status} onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}>
                {['active','inactive','suspended'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />} Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete}
        title="Deactivate User" message={`Deactivate ${deleteTarget?.name}? They will no longer be able to log in.`}
        confirmText="Deactivate" danger />
    </div>
  );
};

export default AdminUsers;
