import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import { formatDate, formatTime, formatCurrency, getStatusColor, timeAgo } from '../../utils/helpers';
import { StatusBadge, SkeletonTable, ErrorState, EmptyState } from '../../components/ui';
import { CalendarCheck, Search, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['', 'Pending', 'Confirmed', 'Assigned', 'Accepted', 'On the Way', 'In Progress', 'Completed', 'Cancelled', 'Rejected'];

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchBookings = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await bookingsAPI.getAll({ status: statusFilter || undefined, page, limit: 15 });
      setBookings(data.data || []);
      setPagination(data.pagination || {});
    } catch {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = bookings.filter((b) =>
    !search || b.booking_reference?.toLowerCase().includes(search.toLowerCase()) ||
    b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.service_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all service bookings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search by reference, customer, service..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select className="input w-44" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6"><SkeletonTable rows={8} /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchBookings} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No bookings found" description="No bookings match your current filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Reference</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Service</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Date & Time</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Technician</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Cost</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-primary-600">{b.booking_reference}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{b.customer_name}</p>
                        <p className="text-xs text-gray-400">{timeAgo(b.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">{b.service_name}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                        <p>{formatDate(b.booking_date)}</p>
                        <p className="text-xs text-gray-400">{formatTime(b.booking_time)}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-600">{b.technician_name || <span className="text-gray-300">Unassigned</span>}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">{formatCurrency(b.estimated_cost)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/bookings/${b.id}`} className="p-2 hover:bg-gray-100 rounded-lg inline-flex transition-colors">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages} · {pagination.total} total</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="btn-secondary p-2">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
