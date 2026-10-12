import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingsAPI, techniciansAPI } from '../../services/api';
import { formatDate, formatTime, formatCurrency, formatDateTime, getStatusColor, getErrorMessage } from '../../utils/helpers';
import { StatusBadge, PaymentBadge, Modal, ConfirmDialog, StarRating, Spinner } from '../../components/ui';
import { ArrowLeft, MapPin, Calendar, Clock, User, Wrench, FileText, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminBookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const { data } = await bookingsAPI.getById(id);
      setBooking(data.booking);
    } catch { toast.error('Failed to load booking.'); navigate('/admin/bookings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const openAssignModal = async () => {
    try {
      const { data } = await techniciansAPI.getAvailable();
      setTechnicians(data.technicians || []);
      setAssignModal(true);
    } catch { toast.error('Failed to load technicians.'); }
  };

  const handleAssign = async () => {
    if (!selectedTech) { toast.error('Please select a technician.'); return; }
    setAssigning(true);
    try {
      await bookingsAPI.assign(id, { technician_user_id: selectedTech });
      toast.success('Technician assigned successfully!');
      setAssignModal(false);
      fetchBooking();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setAssigning(false); }
  };

  const handleCancel = async () => {
    try {
      await bookingsAPI.cancel(id);
      toast.success('Booking cancelled.');
      setCancelDialog(false);
      fetchBooking();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!booking) return null;

  const canAssign = ['Pending', 'Confirmed', 'Assigned', 'Rejected'].includes(booking.status);
  const canCancel = !['Completed', 'Cancelled'].includes(booking.status);

  return (
    <div className="space-y-6 page-enter max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/bookings')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">{booking.booking_reference}</h1>
          <p className="text-sm text-gray-500">Booking Details</p>
        </div>
        <div className="flex gap-2">
          {canAssign && (
            <button onClick={openAssignModal} className="btn-primary">
              <Wrench className="w-4 h-4" />
              {booking.technician_id ? 'Reassign' : 'Assign Technician'}
            </button>
          )}
          {canCancel && (
            <button onClick={() => setCancelDialog(true)} className="btn-danger">
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Booking Information</h2>
              <StatusBadge status={booking.status} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.booking_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Time</p>
                  <p className="font-medium text-gray-900">{formatTime(booking.booking_time)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Service Address</p>
                  <p className="font-medium text-gray-900">{booking.service_address}</p>
                </div>
              </div>
              {booking.description && (
                <div className="sm:col-span-2">
                  <p className="text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700 bg-gray-50 rounded-xl p-3">{booking.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status History */}
          <div className="card">
            <h2 className="section-title mb-4">Status History</h2>
            <div className="space-y-3">
              {(booking.history || []).map((h, i) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${i === (booking.history.length - 1) ? 'bg-primary-500' : 'bg-gray-300'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      {h.old_status && <span className="text-xs text-gray-400">{h.old_status}</span>}
                      {h.old_status && <span className="text-xs text-gray-300">→</span>}
                      <StatusBadge status={h.new_status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">by {h.changed_by_name} · {formatDateTime(h.changed_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Notes */}
          {booking.notes?.length > 0 && (
            <div className="card">
              <h2 className="section-title mb-4">Technician Notes</h2>
              {booking.notes.map((n) => (
                <div key={n.id} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-700">{n.notes}</p>
                  <p className="text-xs text-gray-400 mt-2">— {n.technician_name} · {formatDateTime(n.created_at)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Review */}
          {booking.review && (
            <div className="card">
              <h2 className="section-title mb-4">Customer Review</h2>
              <StarRating rating={booking.review.rating} size="md" />
              <p className="text-sm text-gray-600 mt-2 italic">"{booking.review.comment}"</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Customer</h3>
            <p className="font-medium text-gray-900">{booking.customer_name}</p>
            <p className="text-sm text-gray-500">{booking.customer_email}</p>
            <p className="text-sm text-gray-500">{booking.customer_phone}</p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Wrench className="w-4 h-4" /> Service</h3>
            <p className="font-medium text-gray-900">{booking.service_name}</p>
            <p className="text-sm text-gray-500">{booking.service_category}</p>
          </div>

          {booking.technician_name && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Wrench className="w-4 h-4" /> Technician</h3>
              <p className="font-medium text-gray-900">{booking.technician_name}</p>
              <p className="text-sm text-gray-500">{booking.specialization}</p>
              <p className="text-sm text-gray-500">{booking.technician_phone}</p>
              {booking.technician_rating > 0 && <p className="text-sm text-amber-600 font-medium mt-1">{parseFloat(booking.technician_rating).toFixed(1)}★</p>}
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Billing</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Estimated</span><span className="font-medium">{formatCurrency(booking.estimated_cost)}</span></div>
              {booking.final_cost && <div className="flex justify-between"><span className="text-gray-500">Final Cost</span><span className="font-semibold text-gray-900">{formatCurrency(booking.final_cost)}</span></div>}
              {booking.invoice && (
                <>
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <p className="text-xs text-gray-400 mb-1">Invoice: {booking.invoice.invoice_number}</p>
                    <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold text-gray-900">{formatCurrency(booking.invoice.total)}</span></div>
                    <div className="flex justify-between mt-1"><span className="text-gray-500">Payment</span><PaymentBadge status={booking.invoice.payment_status} /></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Technician" size="md">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <p className="font-medium text-gray-900">{booking.booking_reference}</p>
            <p className="text-gray-500">{booking.service_name} · {formatDate(booking.booking_date)} {formatTime(booking.booking_time)}</p>
          </div>
          <div>
            <label className="label">Select Available Technician</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {technicians.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No available technicians</p>
              ) : technicians.map((t) => (
                <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedTech == t.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="tech" value={t.id} checked={selectedTech == t.id} onChange={(e) => setSelectedTech(e.target.value)} className="text-primary-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.specialization} · {parseFloat(t.rating || 0).toFixed(1)}★ · {t.active_jobs} active jobs</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setAssignModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAssign} disabled={assigning || !selectedTech} className="btn-primary">
              {assigning ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
              Assign Technician
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={cancelDialog} onClose={() => setCancelDialog(false)} onConfirm={handleCancel}
        title="Cancel Booking" message={`Are you sure you want to cancel booking ${booking.booking_reference}? This action cannot be undone.`}
        confirmText="Cancel Booking" danger />
    </div>
  );
};

export default AdminBookingDetail;
