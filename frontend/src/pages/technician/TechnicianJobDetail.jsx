import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import { formatDate, formatTime, formatCurrency, formatDateTime, getErrorMessage } from '../../utils/helpers';
import { StatusBadge, ConfirmDialog, Spinner } from '../../components/ui';
import { ArrowLeft, MapPin, Calendar, Clock, User, Phone, FileText, CheckCircle, XCircle, Navigation, Play, Flag } from 'lucide-react';
import toast from 'react-hot-toast';

const TechnicianJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectDialog, setRejectDialog] = useState(false);
  const [completeDialog, setCompleteDialog] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const { data } = await bookingsAPI.getById(id);
      setBooking(data.booking);
    } catch {
      toast.error('Job not found.');
      navigate('/technician/jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const doAction = async (action, payload = {}) => {
    setActionLoading(true);
    try {
      if (action === 'accept') await bookingsAPI.accept(id);
      else if (action === 'reject') await bookingsAPI.reject(id);
      else await bookingsAPI.updateStatus(id, { status: action, notes: notes || undefined });
      toast.success('Status updated successfully!');
      setRejectDialog(false);
      setCompleteDialog(false);
      fetchBooking();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!booking) return null;

  const { status } = booking;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 page-enter">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/technician/jobs')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900">{booking.booking_reference}</h1>
          <p className="text-sm text-gray-500">{booking.service_name}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Customer Info */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Customer</h2>
        <p className="font-semibold text-gray-900 text-lg">{booking.customer_name}</p>
        {booking.customer_phone && (
          <a href={`tel:${booking.customer_phone}`} className="flex items-center gap-2 text-emerald-600 font-medium mt-1 hover:underline">
            <Phone className="w-4 h-4" /> {booking.customer_phone}
          </a>
        )}
      </div>

      {/* Job Details */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-900">Job Details</h2>
        <div className="flex items-start gap-3 text-sm">
          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div><p className="text-gray-500">Scheduled</p><p className="font-medium text-gray-900">{formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}</p></div>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-gray-500">Service Address</p>
            <p className="font-medium text-gray-900">{booking.service_address}</p>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(booking.service_address)}`} target="_blank" rel="noreferrer"
              className="text-xs text-emerald-600 hover:underline mt-1 inline-flex items-center gap-1">
              <Navigation className="w-3 h-3" /> Open in Maps
            </a>
          </div>
        </div>
        {booking.description && (
          <div className="flex items-start gap-3 text-sm">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div><p className="text-gray-500">Customer's Description</p><p className="font-medium text-gray-900">{booking.description}</p></div>
          </div>
        )}
        <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
          <span className="text-gray-500">Estimated Cost</span>
          <span className="font-bold text-emerald-600 text-base">{formatCurrency(booking.estimated_cost)}</span>
        </div>
      </div>

      {/* Service Notes Input */}
      {['Accepted', 'On the Way', 'In Progress'].includes(status) && (
        <div className="card">
          <label className="label flex items-center gap-2"><FileText className="w-4 h-4" /> Add Service Notes (optional)</label>
          <textarea className="input" rows={3} placeholder="Describe what you found, what you did, parts used..."
            value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {status === 'Assigned' && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setRejectDialog(true)} className="btn-danger py-4 text-base">
              <XCircle className="w-5 h-5" /> Reject Job
            </button>
            <button onClick={() => doAction('accept')} disabled={actionLoading} className="btn-success py-4 text-base">
              {actionLoading ? <Spinner size="sm" /> : <CheckCircle className="w-5 h-5" />} Accept Job
            </button>
          </div>
        )}

        {status === 'Accepted' && (
          <button onClick={() => doAction('On the Way')} disabled={actionLoading} className="btn-primary w-full py-4 text-base">
            {actionLoading ? <Spinner size="sm" /> : <Navigation className="w-5 h-5" />} Start Travel
          </button>
        )}

        {status === 'On the Way' && (
          <button onClick={() => doAction('In Progress')} disabled={actionLoading} className="btn-primary w-full py-4 text-base">
            {actionLoading ? <Spinner size="sm" /> : <Play className="w-5 h-5" />} Start Service
          </button>
        )}

        {status === 'In Progress' && (
          <button onClick={() => setCompleteDialog(true)} className="btn-success w-full py-4 text-base">
            <Flag className="w-5 h-5" /> Complete Service
          </button>
        )}
      </div>

      {/* Status History */}
      {booking.history?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Status History</h2>
          <div className="space-y-2">
            {booking.history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-gray-600">{h.old_status || 'Created'} → </span>
                  <span className="font-medium text-gray-900">{h.new_status}</span>
                </div>
                <span className="text-xs text-gray-400">{formatDateTime(h.changed_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={rejectDialog} onClose={() => setRejectDialog(false)} onConfirm={() => doAction('reject')}
        title="Reject Job" message="Are you sure you want to reject this job? It will be returned to the dispatcher."
        confirmText="Reject Job" danger />

      <ConfirmDialog isOpen={completeDialog} onClose={() => setCompleteDialog(false)} onConfirm={() => doAction('Completed')}
        title="Complete Service" message="Confirm that the service has been completed. An invoice will be generated automatically."
        confirmText="Mark as Completed" />
    </div>
  );
};

export default TechnicianJobDetail;
