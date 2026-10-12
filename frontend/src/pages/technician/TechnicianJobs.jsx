import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import { formatDate, formatTime, formatCurrency } from '../../utils/helpers';
import { StatusBadge, SkeletonCard, EmptyState, ErrorState } from '../../components/ui';
import { Briefcase, ChevronRight } from 'lucide-react';

const STATUSES = ['', 'Assigned', 'Accepted', 'On the Way', 'In Progress', 'Completed', 'Rejected'];

const TechnicianJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchJobs = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await bookingsAPI.getAll({ status: statusFilter || undefined, limit: 50 });
      setJobs(data.data || []);
    } catch { setError('Failed to load jobs.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [statusFilter]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 page-enter">
      <h1 className="page-title">My Jobs</h1>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)}</div>
      ) : error ? <ErrorState message={error} onRetry={fetchJobs} />
      : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs found" description={statusFilter ? `No ${statusFilter} jobs.` : "You have no assigned jobs."} />
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Link key={j.id} to={`/technician/jobs/${j.id}`}
              className="card flex items-center gap-4 hover:shadow-md transition-all active:scale-98 group">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{j.service_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">👤 {j.customer_name}</p>
                <p className="text-xs text-gray-500">📅 {formatDate(j.booking_date)} at {formatTime(j.booking_time)}</p>
                <p className="text-xs font-mono text-gray-400 mt-0.5">{j.booking_reference}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={j.status} />
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(j.estimated_cost)}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicianJobs;
