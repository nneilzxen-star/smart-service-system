import React from 'react';
import { createPortal } from 'react-dom';
import { getStatusColor, getAvailabilityColor, getPaymentColor, generateInitials } from '../../utils/helpers';
import { Loader2, AlertCircle, X, CheckCircle } from 'lucide-react';

// Status Badge
export const StatusBadge = ({ status }) => (
  <span className={`badge ${getStatusColor(status)}`}>{status}</span>
);

// Availability Badge
export const AvailabilityBadge = ({ status }) => (
  <span className={`badge ${getAvailabilityColor(status)} capitalize`}>{status}</span>
);

// Payment Badge
export const PaymentBadge = ({ status }) => (
  <span className={`badge ${getPaymentColor(status)}`}>{status}</span>
);

// Avatar
export const Avatar = ({ name, size = 'md', className = '' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center font-bold flex-shrink-0 ring-2 ring-white shadow-sm ${className}`}>
      {generateInitials(name)}
    </div>
  );
};

// Loading Spinner
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return <Loader2 className={`${sizes[size]} animate-spin text-primary-600 ${className}`} />;
};

// Full page loader
export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500 font-medium">Loading...</p>
    </div>
  </div>
);

// Skeleton loader
export const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />
    ))}
  </div>
);

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {Icon && (
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
    )}
    <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>}
    {action}
  </div>
);

// Error State
export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
      <AlertCircle className="w-8 h-8 text-red-400" />
    </div>
    <h3 className="text-base font-semibold text-gray-900 mb-1">Something went wrong</h3>
    <p className="text-sm text-gray-500 mb-4">{message || 'Unable to load data. Please try again.'}</p>
    {onRetry && <button onClick={onRetry} className="btn-primary">Try Again</button>}
  </div>
);

// Modal
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className={`relative flex w-full ${sizes[size]} max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-slide-up`}>
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

// Confirm Dialog
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-gray-600 mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmText}</button>
    </div>
  </Modal>
);

// Star Rating
export const StarRating = ({ rating, max = 5, size = 'sm' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5' };
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} className={`${sizes[size]} ${i < Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// Stat Card
export const StatCard = ({ icon: Icon, label, value, color = 'blue', trend }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ring-1 ring-black/[0.03] ${colors[color]}`}>
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500 font-semibold truncate">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">{value}</p>
        {trend && <p className="text-xs text-emerald-600 font-medium">{trend}</p>}
      </div>
    </div>
  );
};

// Success animation
export const SuccessAnimation = ({ message }) => (
  <div className="flex flex-col items-center py-8 animate-slide-up">
    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
      <CheckCircle className="w-10 h-10 text-emerald-600" />
    </div>
    <p className="text-lg font-semibold text-gray-900">{message}</p>
  </div>
);
