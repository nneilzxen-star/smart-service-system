import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI, techniciansAPI, notificationsAPI } from '../../services/api';
import { formatCurrency, formatDateTime, getErrorMessage, timeAgo } from '../../utils/helpers';
import { PaymentBadge, SkeletonTable, ErrorState, EmptyState, Spinner } from '../../components/ui';
import { CreditCard, CheckCircle, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import useLiveTime from '../../hooks/useLiveTime';

export const AdminBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchBilling = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await adminAPI.getBilling();
      setInvoices(data.invoices || []);
    } catch { setError('Failed to load billing records.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBilling(); }, []);

  const updatePayment = async (id, status) => {
    setUpdating(id);
    try {
      await adminAPI.updatePayment(id, { payment_status: status });
      toast.success('Payment status updated.');
      fetchBilling();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUpdating(null); }
  };

  const totalRevenue = invoices.filter(i => i.payment_status === 'Paid').reduce((sum, i) => sum + parseFloat(i.total || 0), 0);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="page-title">Billing</h1>
        <p className="text-sm text-gray-500">Manage invoices and payment records</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center"><p className="text-2xl font-bold text-gray-900">{invoices.length}</p><p className="text-sm text-gray-500">Total Invoices</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-emerald-600">{invoices.filter(i=>i.payment_status==='Paid').length}</p><p className="text-sm text-gray-500">Paid</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-amber-600">{invoices.filter(i=>i.payment_status==='Pending').length}</p><p className="text-sm text-gray-500">Pending</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-primary-600">{formatCurrency(totalRevenue)}</p><p className="text-sm text-gray-500">Revenue</p></div>
      </div>
      <div className="card p-0 overflow-hidden">
        {loading ? <div className="p-6"><SkeletonTable /></div>
          : error ? <ErrorState message={error} onRetry={fetchBilling} />
          : invoices.length === 0 ? <EmptyState icon={CreditCard} title="No invoices yet" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Booking</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Service</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Payment</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-primary-600">{inv.invoice_number}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600 font-mono text-xs">{inv.booking_reference}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-600">{inv.customer_name}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-600">{inv.service_name}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(inv.total)}</td>
                      <td className="px-4 py-3"><PaymentBadge status={inv.payment_status} /></td>
                      <td className="px-4 py-3">
                        {inv.payment_status !== 'Paid' && (
                          <button onClick={() => updatePayment(inv.id, 'Paid')} disabled={updating === inv.id} className="btn-success text-xs py-1.5 px-3">
                            {updating === inv.id ? <Spinner size="sm" /> : <CheckCircle className="w-3.5 h-3.5" />} Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
};

export const AdminReports = () => {
  const [bookingReport, setBookingReport] = useState(null);
  const [techReport, setTechReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ from: '', to: '', status: '' });

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, tRes] = await Promise.all([
        adminAPI.getBookingReport(filters),
        adminAPI.getTechnicianReport(),
      ]);
      setBookingReport(bRes.data);
      setTechReport(tRes.data.technicians || []);
    } catch { setError('Failed to load reports. Check your connection and try again.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="text-sm text-gray-500">Analytics and performance reports</p>
      </div>
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <input type="date" className="input w-40" value={filters.from} onChange={(e) => setFilters({...filters, from: e.target.value})} />
          <input type="date" className="input w-40" value={filters.to} onChange={(e) => setFilters({...filters, to: e.target.value})} />
          <select className="input w-44" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
            <option value="">All Statuses</option>
            {['Pending','Completed','Cancelled','In Progress'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={fetchReports} className="btn-primary">Generate Report</button>
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={fetchReports} /> : bookingReport && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: bookingReport.summary?.total, color: 'text-gray-900' },
            { label: 'Completed', value: bookingReport.summary?.completed, color: 'text-emerald-600' },
            { label: 'Cancelled', value: bookingReport.summary?.cancelled, color: 'text-red-600' },
            { label: 'Pending', value: bookingReport.summary?.pending, color: 'text-amber-600' },
            { label: 'Revenue', value: formatCurrency(bookingReport.summary?.revenue), color: 'text-primary-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="section-title mb-4">Technician Performance</h2>
        {loading ? <SkeletonTable rows={4} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 font-medium text-gray-500">Technician</th>
                  <th className="text-left py-2 font-medium text-gray-500">Specialization</th>
                  <th className="text-left py-2 font-medium text-gray-500">Total Jobs</th>
                  <th className="text-left py-2 font-medium text-gray-500">Completed</th>
                  <th className="text-left py-2 font-medium text-gray-500">Rating</th>
                  <th className="text-left py-2 font-medium text-gray-500">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {techReport.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{t.name}</td>
                    <td className="py-3 text-gray-500">{t.specialization}</td>
                    <td className="py-3 text-gray-700">{t.total_jobs}</td>
                    <td className="py-3 text-emerald-600 font-medium">{t.completed}</td>
                    <td className="py-3 text-amber-600">{parseFloat(t.rating||0).toFixed(1)}★</td>
                    <td className="py-3 font-medium text-gray-900">{formatCurrency(t.revenue_generated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminAPI.getAuditLogs({ page, limit: 30, action: actionFilter || undefined });
      setLogs(data.logs || []);
      setPagination(data.pagination || {});
    } catch { setError('Failed to load audit logs.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter]);

  const actionColors = {
    USER_LOGIN: 'bg-blue-100 text-blue-700',
    USER_REGISTERED: 'bg-sky-100 text-sky-700',
    BOOKING_CREATED: 'bg-emerald-100 text-emerald-700',
    TECHNICIAN_ASSIGNED: 'bg-purple-100 text-purple-700',
    JOB_ACCEPTED: 'bg-green-100 text-green-700',
    JOB_REJECTED: 'bg-red-100 text-red-700',
    SERVICE_COMPLETED: 'bg-teal-100 text-teal-700',
    INVOICE_CREATED: 'bg-amber-100 text-amber-700',
    INVOICE_UPDATED: 'bg-yellow-100 text-yellow-700',
    USER_DELETED: 'bg-red-100 text-red-700',
    USER_UPDATED: 'bg-orange-100 text-orange-700',
    STATUS_CHANGED: 'bg-cyan-100 text-cyan-700',
    SERVICE_CREATED: 'bg-indigo-100 text-indigo-700',
    SERVICE_UPDATED: 'bg-violet-100 text-violet-700',
    SERVICE_DELETED: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="page-title">Audit Logs</h1>
        <p className="text-sm text-gray-500">Complete system activity trail</p>
      </div>
      <div className="card p-4">
        <select className="input w-56" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          {['USER_LOGIN','BOOKING_CREATED','TECHNICIAN_ASSIGNED','SERVICE_COMPLETED','INVOICE_CREATED','STATUS_CHANGED','USER_DELETED','USER_UPDATED'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="card p-0 overflow-hidden">
        {loading ? <div className="p-6"><SkeletonTable rows={10} /></div> : error ? <ErrorState message={error} onRetry={fetchLogs} /> : logs.length === 0 ? <EmptyState icon={CheckCircle} title="No audit logs" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Module</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-xs">{log.user_name || 'System'}</p>
                      <p className="text-xs text-gray-400 capitalize">{log.user_role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs font-mono ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-600 max-w-xs truncate">{log.description}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400">{log.module}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn-secondary text-xs py-1.5 px-3">Prev</button>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p+1))} disabled={page===pagination.totalPages} className="btn-secondary text-xs py-1.5 px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminTechnicians = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTechnicians = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await techniciansAPI.getAll();
      setTechnicians(data.technicians || []);
    } catch {
      setError('Failed to load technicians.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTechnicians(); }, []);

  return (
    <div className="space-y-6 page-enter">
      <div><h1 className="page-title">Technicians</h1><p className="text-sm text-gray-500">Manage technician accounts</p></div>
      <div className="card p-0 overflow-hidden">
        {loading ? <div className="p-6"><SkeletonTable /></div> : error ? <ErrorState message={error} onRetry={fetchTechnicians} /> : technicians.length === 0 ? <EmptyState icon={CheckCircle} title="No technicians found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Specialization</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Availability</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Rating</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Completed Jobs</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {technicians.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-600">{t.name?.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-400">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">{t.specialization}</td>
                    <td className="px-4 py-3">
                      <span className={`badge capitalize ${t.availability_status==='available'?'bg-emerald-100 text-emerald-700':t.availability_status==='busy'?'bg-orange-100 text-orange-700':'bg-gray-100 text-gray-600'}`}>{t.availability_status}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-amber-600 font-medium">{parseFloat(t.rating||0).toFixed(1)}★</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600">{t.completed_jobs}</td>
                    <td className="px-4 py-3">
                      <span className={`badge capitalize ${t.status==='active'?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useLiveTime();

  const fetchNotifications = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifications(data.notifications || []);
      setError(null);
    } catch {
      setError('Could not refresh system notifications.');
    }
    finally { if (showLoader) setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications(true);
    const pollInterval = setInterval(() => fetchNotifications(false), 10000);
    return () => clearInterval(pollInterval);
  }, [fetchNotifications]);

  return (
    <div className="space-y-6 page-enter">
      <div><h1 className="page-title">Notifications</h1><p className="text-sm text-gray-500">All system notifications</p></div>
      <div className="card">
        {loading ? <SkeletonTable /> : error && notifications.length === 0 ? <ErrorState message={error} onRetry={() => fetchNotifications(true)} /> : notifications.length === 0 ? <EmptyState icon={CheckCircle} title="No notifications" /> : (
          <div className="space-y-3">
            {error && <p role="status" className="text-sm text-amber-800 bg-amber-50 rounded-xl px-4 py-3">{error} Showing the last available notifications.</p>}
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl ${!n.is_read ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? 'bg-primary-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminSettings = () => (
  <div className="space-y-6 page-enter">
    <div><h1 className="page-title">System Settings</h1><p className="text-sm text-gray-500">Configure system preferences</p></div>
    <div className="card">
      <h2 className="section-title mb-4">Demo Accounts</h2>
      <div className="space-y-3">
        {[
          { role: 'Admin', email: 'admin@smartservice.test', color: 'bg-red-50 border-red-200' },
          { role: 'Customer', email: 'customer@smartservice.test', color: 'bg-blue-50 border-blue-200' },
          { role: 'Technician', email: 'technician@smartservice.test', color: 'bg-emerald-50 border-emerald-200' },
        ].map(({ role, email, color }) => (
          <div key={role} className={`flex items-center justify-between p-4 rounded-xl border ${color}`}>
            <div>
              <p className="font-medium text-gray-900">{role}</p>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
            <span className="text-xs text-gray-400 font-mono bg-white px-3 py-1 rounded-lg border">Demo@1234</span>
          </div>
        ))}
      </div>
    </div>
    <div className="card">
      <h2 className="section-title mb-2">System Information</h2>
      <div className="space-y-2 text-sm text-gray-600">
        <p>Version: 1.0.0</p>
        <p>Stack: React + Node.js + Express + MySQL</p>
        <p>Architecture: Layered REST API with Event-Driven Workflow</p>
        <p>Academic Project: Systems Integration and Architecture</p>
      </div>
    </div>
  </div>
);
