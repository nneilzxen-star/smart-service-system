import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI, techniciansAPI } from '../../services/api';
import { formatDate, formatTime, formatCurrency, getErrorMessage } from '../../utils/helpers';
import { StatusBadge, AvailabilityBadge, Modal, Spinner, EmptyState, SkeletonCard } from '../../components/ui';
import { Truck, Wrench, CheckCircle, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDispatch = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTech, setSelectedTech] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendRes, activeRes, techRes] = await Promise.all([
        bookingsAPI.getAll({ limit: 100 }),
        bookingsAPI.getAll({ limit: 100 }),
        techniciansAPI.getAvailable(),
      ]);
      const allBookings = pendRes.data.data || [];
      setPendingBookings(allBookings.filter(b => ['Pending', 'Confirmed', 'Rejected'].includes(b.status)));
      setActiveBookings(allBookings.filter(b => ['Assigned','Accepted','On the Way','In Progress'].includes(b.status)));
      setTechnicians(techRes.data.technicians || []);
    } catch { toast.error('Failed to load dispatch data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAssign = (booking) => { setSelectedBooking(booking); setSelectedTech(''); setAssignModal(true); };

  const handleAssign = async () => {
    if (!selectedTech) { toast.error('Please select a technician.'); return; }
    setAssigning(true);
    try {
      await bookingsAPI.assign(selectedBooking.id, { technician_user_id: selectedTech });
      toast.success('Technician assigned!');
      setAssignModal(false);
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setAssigning(false); }
  };

  if (loading) return <div className="grid md:grid-cols-2 gap-6">{Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)}</div>;

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dispatch Center</h1>
          <p className="text-sm text-gray-500">Assign and monitor technician deployments</p>
        </div>
        <button onClick={fetchData} className="btn-secondary"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-600">{pendingBookings.length}</p>
          <p className="text-sm text-gray-500 mt-1">Pending Bookings</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{activeBookings.length}</p>
          <p className="text-sm text-gray-500 mt-1">Active Jobs</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-emerald-600">{technicians.filter(t=>t.availability_status==='available').length}</p>
          <p className="text-sm text-gray-500 mt-1">Available Techs</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Bookings */}
        <div className="card">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" /> Pending Assignments ({pendingBookings.length})
          </h2>
          {pendingBookings.length === 0 ? (
            <EmptyState icon={CheckCircle} title="All caught up!" description="No pending bookings to assign." />
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((b) => (
                <div key={b.id} className="border border-gray-100 rounded-xl p-4 hover:border-primary-200 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-mono text-xs font-medium text-primary-600">{b.booking_reference}</p>
                      <p className="font-medium text-gray-900 text-sm">{b.service_name}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">👤 {b.customer_name}</p>
                  <p className="text-xs text-gray-500 mb-3">📅 {formatDate(b.booking_date)} at {formatTime(b.booking_time)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => openAssign(b)} className="btn-primary flex-1 text-xs py-2">
                      <Wrench className="w-3.5 h-3.5" /> Assign Technician
                    </button>
                    <Link to={`/admin/bookings/${b.id}`} className="btn-secondary p-2">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Jobs */}
        <div className="card">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Active Jobs ({activeBookings.length})
          </h2>
          {activeBookings.length === 0 ? (
            <EmptyState icon={Truck} title="No active jobs" description="No jobs currently in progress." />
          ) : (
            <div className="space-y-3">
              {activeBookings.map((b) => (
                <div key={b.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-mono text-xs font-medium text-primary-600">{b.booking_reference}</p>
                      <p className="font-medium text-gray-900 text-sm">{b.service_name}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-gray-500">👤 {b.customer_name}</p>
                  <p className="text-xs text-gray-500">🔧 {b.technician_name || 'Unassigned'}</p>
                  <div className="flex gap-2 mt-3">
                    {b.status === 'Assigned' && (
                      <button onClick={() => openAssign(b)} className="btn-secondary flex-1 text-xs py-2">
                        <RefreshCw className="w-3.5 h-3.5" /> Reassign
                      </button>
                    )}
                    <Link to={`/admin/bookings/${b.id}`} className="btn-secondary p-2">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Technicians */}
      <div className="card">
        <h2 className="section-title mb-4">Technician Status</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {technicians.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-sm font-bold text-emerald-600 flex-shrink-0">
                {t.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{t.name}</p>
                <p className="text-xs text-gray-500 truncate">{t.specialization}</p>
                <p className="text-xs text-gray-400">{parseFloat(t.rating||0).toFixed(1)}★ · {t.active_jobs} active</p>
              </div>
              <AvailabilityBadge status={t.availability_status} />
            </div>
          ))}
        </div>
      </div>

      {/* Assign Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Technician">
        {selectedBooking && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <p className="font-medium text-gray-900">{selectedBooking.booking_reference} — {selectedBooking.service_name}</p>
              <p className="text-gray-500">{selectedBooking.customer_name} · {formatDate(selectedBooking.booking_date)}</p>
            </div>
            <div>
              <label className="label">Select Technician</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {technicians.filter(t => t.availability_status === 'available').length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No available technicians at this time.</p>
                ) : technicians.filter(t => t.availability_status === 'available').map((t) => (
                  <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedTech == t.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="tech" value={t.id} checked={selectedTech == t.id} onChange={(e) => setSelectedTech(e.target.value)} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.specialization} · {parseFloat(t.rating||0).toFixed(1)}★</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setAssignModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAssign} disabled={assigning || !selectedTech} className="btn-primary">
                {assigning ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />} Assign
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDispatch;
