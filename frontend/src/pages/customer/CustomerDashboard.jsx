import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, servicesAPI } from '../../services/api';
import { formatDate, formatTime, formatCurrency } from '../../utils/helpers';
import { StatusBadge, SkeletonCard, EmptyState, ErrorState } from '../../components/ui';
import { CalendarCheck, ArrowRight, Plus, Sparkles } from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, sRes] = await Promise.all([
      bookingsAPI.getAll({ limit: 5 }),
      servicesAPI.getAll(),
      ]);
      setBookings(bRes.data.data || []);
      setServices((sRes.data.services || []).slice(0, 6));
    } catch {
      setError('Could not load your dashboard. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const activeBooking = bookings.find(b => ['Assigned','Accepted','On the Way','In Progress'].includes(b.status));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:py-8 space-y-7 page-enter">
      {/* Welcome */}
      <div className="dashboard-welcome relative isolate overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 text-white">
        <div className="hero-grid absolute inset-0 -z-10 opacity-50" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="text-sky-200 text-sm font-semibold tracking-wide mb-2">CUSTOMER WORKSPACE</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-blue-100/90 text-sm sm:text-base mt-2">What can we help you take care of today?</p>
          <Link to="/customer/services" className="inline-flex items-center gap-2 mt-6 bg-white text-blue-800 font-semibold px-4 py-3 rounded-xl text-sm hover:bg-sky-50 transition-all duration-200 shadow-lg shadow-slate-950/15 hover:-translate-y-0.5">
            <Plus className="w-4 h-4" /> Book a Service <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={fetchDashboard} /> : <>
      {/* Active Booking */}
      {activeBooking && (
        <div className="card interactive-card border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Active Booking</h2>
            <StatusBadge status={activeBooking.status} />
          </div>
          <p className="font-semibold text-slate-900">{activeBooking.service_name}</p>
          <p className="text-sm text-gray-500 mt-1">{formatDate(activeBooking.booking_date)} at {formatTime(activeBooking.booking_time)}</p>
          {activeBooking.technician_name && <p className="text-sm text-gray-500">Technician: {activeBooking.technician_name}</p>}
          <Link to={`/customer/bookings/${activeBooking.id}`} className="btn-primary mt-4 text-sm">
            Track Booking <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Quick Services */}
      <div>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700 mb-1">Get started</p>
            <h2 className="section-title">Popular Services</h2>
          </div>
          <Link to="/customer/services" className="text-sm text-sky-700 font-semibold hover:text-sky-900 transition-colors whitespace-nowrap">View all <ArrowRight className="inline w-4 h-4 ml-1" /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>)}</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 dashboard-stagger">
            {services.map((s) => (
              <Link key={s.id} to={`/customer/services/${s.id}`}
                className="card interactive-card p-4 sm:p-5 group">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-4 group-hover:bg-sky-100 transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{s.description}</p>
                <p className="text-sm font-bold text-sky-700 mt-3">{formatCurrency(s.base_price)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700 mb-1">Your activity</p>
            <h2 className="section-title">Recent Bookings</h2>
          </div>
          <Link to="/customer/bookings" className="text-sm text-sky-700 font-semibold hover:text-sky-900 transition-colors whitespace-nowrap">View all <ArrowRight className="inline w-4 h-4 ml-1" /></Link>
        </div>
        {loading ? <SkeletonCard /> : bookings.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No bookings yet" description="Book your first service to get started."
            action={<Link to="/customer/services" className="btn-primary">Browse Services</Link>} />
        ) : (
          <div className="space-y-3 dashboard-stagger">
            {bookings.slice(0, 3).map((b) => (
              <Link key={b.id} to={`/customer/bookings/${b.id}`}
                className="card interactive-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CalendarCheck className="w-5 h-5 text-sky-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{b.service_name}</p>
                  <p className="text-xs text-gray-500">{formatDate(b.booking_date)} · {formatTime(b.booking_time)}</p>
                </div>
                <StatusBadge status={b.status} />
                <ArrowRight className="hidden sm:block w-4 h-4 text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
      </>}
    </div>
  );
};

export default CustomerDashboard;
