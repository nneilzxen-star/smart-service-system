import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import { formatDate, formatTime, formatCurrency, formatDateTime, getErrorMessage } from '../../utils/helpers';
import { StatusBadge, PaymentBadge, ConfirmDialog, Spinner } from '../../components/ui';
import { ArrowLeft, MapPin, Calendar, Clock, User, Wrench, Star, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TIMELINE_STEPS = ['Pending', 'Confirmed', 'Assigned', 'Accepted', 'On the Way', 'In Progress', 'Completed'];

const getStepIndex = (status) => {
  if (status === 'Cancelled' || status === 'Rejected') return -1;
  return TIMELINE_STEPS.indexOf(status);
};

const CustomerBookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const { data } = await bookingsAPI.getById(id);
      setBooking(data.booking);
    } catch {
      toast.error('Booking not found.');
      navigate('/customer/bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const handleCancel = async () => {
    try {
      await bookingsAPI.cancel(id);
      toast.success('Booking cancelled.');
      setCancelDialog(false);
      fetchBooking();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleReview = async () => {
    if (!reviewForm.rating) { toast.error('Please select a rating.'); return; }
    setSubmittingReview(true);
    try {
      await bookingsAPI.submitReview(id, reviewForm);
      toast.success('Review submitted! Thank you.');
      fetchBooking();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!booking) return null;

  const currentStep = getStepIndex(booking.status);
  const canCancel = !['Completed', 'Cancelled', 'Rejected', 'In Progress', 'On the Way'].includes(booking.status);
  const canReview = booking.status === 'Completed' && !booking.review;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 page-enter">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/customer/bookings')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900">{booking.booking_reference}</h1>
          <p className="text-sm text-gray-500">{booking.service_name}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Tracking Timeline */}
      {!['Cancelled', 'Rejected'].includes(booking.status) && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Booking Progress</h2>
          <div className="space-y-3">
            {TIMELINE_STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-emerald-500' : active ? 'bg-primary-600 ring-4 ring-primary-100' : 'bg-gray-100'}`}>
                    {done ? <CheckCircle className="w-4 h-4 text-white" /> : (
                      <span className={`text-xs font-bold ${active ? 'text-white' : 'text-gray-400'}`}>{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${done || active ? 'text-gray-900' : 'text-gray-400'}`}>{step}</p>
                    {active && <p className="text-xs text-primary-600 font-medium">Current Status</p>}
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={`absolute left-[2.25rem] mt-8 w-0.5 h-3 ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} style={{ position: 'relative', left: 'auto', marginTop: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled/Rejected */}
      {['Cancelled', 'Rejected'].includes(booking.status) && (
        <div className="card border-l-4 border-l-red-400 bg-red-50">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-semibold text-red-800">Booking {booking.status}</p>
              <p className="text-sm text-red-600">This booking has been {booking.status.toLowerCase()}.</p>
            </div>
          </div>
        </div>
      )}

      {/* Booking Info */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-900">Booking Details</h2>
        <div className="flex items-start gap-3 text-sm">
          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div><p className="text-gray-500">Date & Time</p><p className="font-medium text-gray-900">{formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}</p></div>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div><p className="text-gray-500">Service Address</p><p className="font-medium text-gray-900">{booking.service_address}</p></div>
        </div>
        {booking.description && (
          <div className="flex items-start gap-3 text-sm">
            <Wrench className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div><p className="text-gray-500">Description</p><p className="font-medium text-gray-900">{booking.description}</p></div>
          </div>
        )}
      </div>

      {/* Technician Info */}
      {booking.technician_name && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Your Technician</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-lg font-bold text-emerald-600">
              {booking.technician_name?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{booking.technician_name}</p>
              <p className="text-sm text-gray-500">{booking.specialization}</p>
              {booking.technician_phone && <p className="text-sm text-gray-500">{booking.technician_phone}</p>}
              {booking.technician_rating > 0 && <p className="text-sm text-amber-600 font-medium">{parseFloat(booking.technician_rating).toFixed(1)}★</p>}
            </div>
          </div>
        </div>
      )}

      {/* Technician Notes */}
      {booking.notes?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Service Notes</h2>
          {booking.notes.map((n) => (
            <div key={n.id} className="bg-gray-50 rounded-xl p-3 text-sm">
              <p className="text-gray-700">{n.notes}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Invoice */}
      {booking.invoice && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Invoice</h2>
          <div className="space-y-2 text-sm">
            <p className="text-xs text-gray-400 font-mono">{booking.invoice.invoice_number}</p>
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(booking.invoice.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Service Fee</span><span>{formatCurrency(booking.invoice.service_fee)}</span></div>
            <div className="flex justify-between font-bold border-t border-gray-100 pt-2">
              <span className="text-gray-900">Total</span><span className="text-primary-600 text-lg">{formatCurrency(booking.invoice.total)}</span>
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Payment</span><PaymentBadge status={booking.invoice.payment_status} /></div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {canReview && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Leave a Review</h2>
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)}
                className="transition-transform hover:scale-110">
                <Star className={`w-8 h-8 ${star <= (hoveredStar || reviewForm.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
              </button>
            ))}
          </div>
          <textarea className="input" rows={3} placeholder="Share your experience with the technician..."
            value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
          <button onClick={handleReview} disabled={submittingReview || !reviewForm.rating} className="btn-primary w-full mt-3">
            {submittingReview ? <Spinner size="sm" /> : <Star className="w-4 h-4" />} Submit Review
          </button>
        </div>
      )}

      {/* Existing Review */}
      {booking.review && (
        <div className="card bg-amber-50 border border-amber-100">
          <h2 className="font-semibold text-gray-900 mb-2">Your Review</h2>
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= booking.review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />)}
          </div>
          {booking.review.comment && <p className="text-sm text-gray-600 italic">"{booking.review.comment}"</p>}
        </div>
      )}

      {/* Cancel Button */}
      {canCancel && (
        <button onClick={() => setCancelDialog(true)} className="btn-danger w-full">
          <XCircle className="w-4 h-4" /> Cancel Booking
        </button>
      )}

      <ConfirmDialog isOpen={cancelDialog} onClose={() => setCancelDialog(false)} onConfirm={handleCancel}
        title="Cancel Booking" message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Yes, Cancel" danger />
    </div>
  );
};

export default CustomerBookingDetail;
