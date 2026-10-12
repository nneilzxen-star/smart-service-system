import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import { formatDate, formatTime, formatCurrency } from '../../utils/helpers';
import { StatusBadge, SkeletonCard, EmptyState, ErrorState } from '../../components/ui';
import { CalendarCheck, Plus, ChevronRight } from 'lucide-react';

const STATUSES = ['', 'Pending', 'Assigned', 'Accepted', 'On the Way', 'In Progress', 'Completed', 'Cancelled'];

const CustomerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBookings = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await bookingsAPI.getAll({ status: statusFilter || undefined, limit: 50 });
      setBookings(data.data || []);
    } catch { setError('Failed to load bookings.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [statusFilter]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="page-title">My Bookings</h1>
        <Link to="/customer/book" className="btn-primary text-sm"><Plus className="w-4 h-4" /> New</Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)}</div>
      ) : error ? <ErrorState message={error} onRetry={fetchBookings} />
      : bookings.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No bookings found"
          description={statusFilter ? `No ${statusFilter} bookings.` : "You haven't made any bookings yet."}
          action={<Link to="/customer/book" className="btn-primary">Book a Service</Link>} />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Link key={b.id} to={`/customer/bookings/${b.id}`}
              className="card flex items-center gap-4 hover:shadow-md transition-all active:scale-98 group">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <CalendarCheck className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{b.service_name}</p>
                <p className="text-xs text-gray-500">{formatDate(b.booking_date)} at {formatTime(b.booking_time)}</p>
                <p className="text-xs font-mono text-gray-400 mt-0.5">{b.booking_reference}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={b.status} />
                <span className="text-sm font-bold text-primary-600">{formatCurrency(b.estimated_cost)}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerBookings;
