import React, { useState, useEffect } from 'react';
import { servicesAPI } from '../../services/api';
import { formatCurrency, getErrorMessage } from '../../utils/helpers';
import { SkeletonCard, ErrorState, EmptyState, Modal, ConfirmDialog, Spinner } from '../../components/ui';
import { Zap, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', category: '', base_price: '', estimated_duration: 60, icon: 'wrench', status: 'active' };
const CATEGORIES = ['HVAC', 'Electrical', 'Plumbing', 'Appliance', 'IT', 'Cleaning', 'Security', 'Maintenance'];

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchServices = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await servicesAPI.getAll({ status: '' });
      setServices(data.services || []);
    } catch { setError('Failed to load services.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModal(true); };
  const openEdit = (s) => { setForm({ name: s.name, description: s.description || '', category: s.category || '', base_price: s.base_price, estimated_duration: s.estimated_duration, icon: s.icon || 'wrench', status: s.status }); setEditId(s.id); setModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.base_price) { toast.error('Name and base price are required.'); return; }
    setSaving(true);
    try {
      if (editId) { await servicesAPI.update(editId, form); toast.success('Service updated.'); }
      else { await servicesAPI.create(form); toast.success('Service created.'); }
      setModal(false);
      fetchServices();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await servicesAPI.delete(deleteTarget.id);
      toast.success('Service deactivated.');
      setDeleteDialog(false);
      fetchServices();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="text-sm text-gray-500">Manage available service offerings</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Service</button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>)}</div>
      ) : error ? <ErrorState message={error} onRetry={fetchServices} />
      : services.length === 0 ? <EmptyState icon={Zap} title="No services" description="Add your first service." action={<button onClick={openCreate} className="btn-primary">Add Service</button>} />
      : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.id} className={`card hover:shadow-md transition-shadow ${s.status === 'inactive' ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <button onClick={() => { setDeleteTarget(s); setDeleteDialog(true); }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{s.name}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary-600">{formatCurrency(s.base_price)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{s.estimated_duration}min</span>
                  <span className={`badge text-xs ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                </div>
              </div>
              {s.category && <p className="text-xs text-gray-400 mt-2">{s.category}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Service' : 'Add New Service'}>
        <div className="space-y-4">
          <div><label className="label">Service Name *</label><input className="input" placeholder="e.g. AC Repair" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} placeholder="Describe the service..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Base Price (₱) *</label><input type="number" className="input" placeholder="0.00" value={form.base_price} onChange={(e) => setForm({...form, base_price: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Duration (minutes)</label><input type="number" className="input" value={form.estimated_duration} onChange={(e) => setForm({...form, estimated_duration: e.target.value})} /></div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />} {editId ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete}
        title="Deactivate Service" message={`Deactivate "${deleteTarget?.name}"? It will no longer be available for booking.`}
        confirmText="Deactivate" danger />
    </div>
  );
};

export default AdminServices;
