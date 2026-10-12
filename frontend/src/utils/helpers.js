import { format, formatDistanceToNow } from 'date-fns';

const parseApiDate = (date) => {
  if (!date) return null;

  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof date !== 'string') return null;
  const value = date.trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  let normalized = value.replace(' ', 'T');

  if (!hasTimezone) {
    normalized = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
      ? `${normalized}T00:00:00`
      : normalized;
    normalized += '+08:00';
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDate = (date) => {
  if (!date) return '—';
  try {
    const parsed = parseApiDate(date);
    return parsed ? format(parsed, 'MMM dd, yyyy') : date;
  } catch { return date; }
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  try {
    const parsed = parseApiDate(date);
    return parsed ? format(parsed, 'MMM dd, yyyy hh:mm a') : date;
  } catch { return date; }
};

export const formatTime = (time) => {
  if (!time) return '—';
  try {
    const [h, m] = time.split(':');
    const d = new Date(); d.setHours(h, m);
    return format(d, 'hh:mm a');
  } catch { return time; }
};

export const timeAgo = (date) => {
  if (!date) return '';
  try {
    const parsed = parseApiDate(date);
    if (!parsed) return date;
    return formatDistanceToNow(parsed, { addSuffix: true });
  } catch { return date; }
};

export { parseApiDate };

export const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getStatusColor = (status) => {
  const map = {
    'Pending': 'bg-amber-100 text-amber-800',
    'Confirmed': 'bg-blue-100 text-blue-800',
    'Assigned': 'bg-purple-100 text-purple-800',
    'Accepted': 'bg-indigo-100 text-indigo-800',
    'On the Way': 'bg-cyan-100 text-cyan-800',
    'In Progress': 'bg-orange-100 text-orange-800',
    'Completed': 'bg-emerald-100 text-emerald-800',
    'Cancelled': 'bg-red-100 text-red-800',
    'Rejected': 'bg-gray-100 text-gray-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

export const getAvailabilityColor = (status) => {
  const map = {
    available: 'bg-emerald-100 text-emerald-800',
    busy: 'bg-orange-100 text-orange-800',
    offline: 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

export const getPaymentColor = (status) => {
  const map = {
    Paid: 'bg-emerald-100 text-emerald-800',
    Pending: 'bg-amber-100 text-amber-800',
    Unpaid: 'bg-red-100 text-red-800',
    Cancelled: 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

export const getErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || 'An unexpected error occurred.';

export const generateInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
};
