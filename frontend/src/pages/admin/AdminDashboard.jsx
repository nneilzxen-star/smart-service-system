import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor, timeAgo } from '../../utils/helpers';
import { StatCard, StatusBadge, SkeletonCard, ErrorState } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CalendarCheck, Users, Wrench, CheckCircle, Clock, TrendingUp, Star, DollarSign, ArrowRight, Activity } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true); setError(null);
    try {
      const { data: res } = await adminAPI.getDashboard();
      setData(res);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />;

  const { stats, recent_bookings, booking_trend, service_stats, tech_performance, recent_activity } = data;

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your service operations</p>
        </div>
        <Link to="/admin/bookings" className="btn-primary hidden sm:flex">
          View All Bookings <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Total Bookings" value={stats.total_bookings} color="blue" />
        <StatCard icon={Clock} label="Pending" value={stats.pending_bookings} color="amber" />
        <StatCard icon={Activity} label="Active Jobs" value={stats.active_jobs} color="purple" />
        <StatCard icon={CheckCircle} label="Completed" value={stats.completed_jobs} color="green" />
        <StatCard icon={Wrench} label="Available Techs" value={stats.available_technicians} color="cyan" />
        <StatCard icon={Users} label="Customers" value={stats.total_customers} color="blue" />
        <StatCard icon={DollarSign} label="Revenue" value={formatCurrency(stats.revenue)} color="green" />
        <StatCard icon={Star} label="Avg Rating" value={`${stats.avg_rating}★`} color="amber" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Booking Trend */}
        <div className="card">
          <h2 className="section-title mb-4">Booking Trend (30 Days)</h2>
          {booking_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={booking_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Bookings']} labelFormatter={(l) => `Date: ${l}`} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-8">No data available</p>}
        </div>

        {/* Service Distribution */}
        <div className="card">
          <h2 className="section-title mb-4">Service Distribution</h2>
          {service_stats.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={service_stats} dataKey="booking_count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {service_stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-8">No data available</p>}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-sm text-primary-600 hover:underline font-medium">View all</Link>
          </div>
          <div className="space-y-3">
            {recent_bookings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No bookings yet</p>
            ) : recent_bookings.map((b) => (
              <Link key={b.id} to={`/admin/bookings/${b.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CalendarCheck className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.booking_reference}</p>
                  <p className="text-xs text-gray-500 truncate">{b.customer_name} · {b.service_name}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={b.status} />
                  <span className="text-xs text-gray-400">{timeAgo(b.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Technician Performance */}
        <div className="card">
          <h2 className="section-title mb-4">Top Technicians</h2>
          <div className="space-y-3">
            {tech_performance.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No data</p>
            ) : tech_performance.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-xs font-bold text-emerald-600 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.completed} jobs · {parseFloat(t.rating || 0).toFixed(1)}★</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="section-title mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {recent_activity.map((log) => (
            <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{log.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">{log.user_name} · {timeAgo(log.timestamp)}</p>
              </div>
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg flex-shrink-0">{log.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
