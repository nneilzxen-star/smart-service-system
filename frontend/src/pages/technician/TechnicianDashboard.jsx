import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, techniciansAPI } from '../../services/api';
import { formatDate, formatTime, formatCurrency, getErrorMessage } from '../../utils/helpers';
import { StatusBadge, AvailabilityBadge, StatCard, SkeletonCard, ErrorState } from '../../components/ui';
import { Briefcase, CheckCircle, DollarSign, Star, ArrowRight, ToggleLeft, ToggleRight, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [availability, setAvailability] = useState(user?.availability_status || 'available');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingAvail, setTogglingAvail] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, jRes] = await Promise.all([
        techniciansAPI.getStats(),
        bookingsAPI.getAll({ limit: 10 }),
      ]);
      setStats(sRes.data.stats);
      setJobs(jRes.data.data || []);
    } catch {
      setError('Could not load your dashboard. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const toggleAvailability = async () => {
    const next = availability === 'available' ? 'offline' : 'available';
    setTogglingAvail(true);
    try {
      await techniciansAPI.updateAvailability({ availability_status: next });
      setAvailability(next);
      toast.success(`Status set to ${next}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingAvail(false);
    }
  };

  const activeJob = jobs.find(j => ['Assigned', 'Accepted', 'On the Way', 'In Progress'].includes(j.status));
  const todayJobs = jobs.filter(j => !['Completed', 'Cancelled', 'Rejected'].includes(j.status));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:py-8 space-y-7 page-enter">
      {/* Header */}
      <div className="technician-welcome relative isolate overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 text-white">
        <div className="hero-grid absolute inset-0 -z-10 opacity-50" aria-hidden="true" />
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="text-emerald-200 text-sm font-semibold tracking-wide mb-2">TECHNICIAN WORKSPACE</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-emerald-100/90 text-sm sm:text-base mt-2">Your workday at a glance.</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <AvailabilityBadge status={availability} />
            <button onClick={toggleAvailability} disabled={togglingAvail || loading || Boolean(activeJob)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-60 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ring-1 ring-white/15">
            {activeJob ? <><Briefcase className="w-4 h-4" /> On active job</> : availability === 'available'
              ? <><ToggleRight className="w-4 h-4" /> Go Offline</>
              : <><ToggleLeft className="w-4 h-4" /> Go Online</>}
            </button>
          </div>
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={fetchDashboard} /> : <>
      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)}</div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 dashboard-stagger">
          <StatCard icon={Briefcase} label="Total Jobs" value={stats.total_jobs} color="blue" />
          <StatCard icon={CheckCircle} label="Completed" value={stats.completed_jobs} color="green" />
          <StatCard icon={DollarSign} label="Earnings" value={formatCurrency(stats.total_earnings)} color="amber" />
          <StatCard icon={Star} label="Rating" value={`${parseFloat(stats.rating||0).toFixed(1)}★`} color="purple" />
        </div>
      )}

      {/* Active Job */}
      {activeJob && (
        <div className="card interactive-card border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900">Active Job</h2>
            <StatusBadge status={activeJob.status} />
          </div>
          <p className="font-medium text-gray-900">{activeJob.service_name}</p>
          <p className="text-sm text-gray-500 mt-1">👤 {activeJob.customer_name}</p>
          <p className="text-sm text-gray-500">📅 {formatDate(activeJob.booking_date)} at {formatTime(activeJob.booking_time)}</p>
          <Link to={`/technician/jobs/${activeJob.id}`} className="btn-success mt-4 w-full text-sm">
            View Job Details <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Today's Jobs */}
      <div>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 mb-1">Work queue</p>
            <h2 className="section-title">Assigned Jobs <span className="text-slate-400 font-medium">({todayJobs.length})</span></h2>
          </div>
          <Link to="/technician/jobs" className="text-sm text-emerald-700 font-semibold hover:text-emerald-900 transition-colors whitespace-nowrap">View all <ArrowRight className="inline w-4 h-4 ml-1" /></Link>
        </div>
        {loading ? <SkeletonCard /> : todayJobs.length === 0 ? (
          <div className="card text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-7 h-7" />
            </div>
            <p className="font-semibold text-slate-900">You’re all caught up</p>
            <p className="text-sm text-gray-500 mt-1">New assigned jobs will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3 dashboard-stagger">
            {todayJobs.slice(0, 3).map((j) => (
              <Link key={j.id} to={`/technician/jobs/${j.id}`}
                className="card interactive-card p-4 flex items-center gap-3 group">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{j.service_name}</p>
                  <p className="text-xs text-gray-500">{j.customer_name} · {formatDate(j.booking_date)}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatTime(j.booking_time)}</p>
                </div>
                <StatusBadge status={j.status} />
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

export default TechnicianDashboard;
