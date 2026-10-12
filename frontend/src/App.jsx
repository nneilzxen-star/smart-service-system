import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageLoader } from './components/ui';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import TechnicianLayout from './layouts/TechnicianLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminBookingDetail from './pages/admin/AdminBookingDetail';
import AdminDispatch from './pages/admin/AdminDispatch';
import AdminUsers from './pages/admin/AdminUsers';
import AdminServices from './pages/admin/AdminServices';
import { AdminBilling, AdminReports, AdminAuditLogs, AdminTechnicians, AdminNotifications, AdminSettings } from './pages/admin/AdminMisc';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerServices from './pages/customer/CustomerServices';
import CustomerBookings from './pages/customer/CustomerBookings';
import CustomerBookingDetail from './pages/customer/CustomerBookingDetail';
import CreateBooking from './pages/customer/CreateBooking';
import CustomerProfile from './pages/customer/CustomerProfile';
import NotificationsPage from './pages/customer/NotificationsPage';

// Technician Pages
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import TechnicianJobs from './pages/technician/TechnicianJobs';
import TechnicianJobDetail from './pages/technician/TechnicianJobDetail';
import TechnicianProfile from './pages/technician/TechnicianProfile';

// Route Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'technician') return <Navigate to="/technician" replace />;
    return <Navigate to="/customer" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  // If user is already known, redirect immediately without waiting for loading
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'technician') return <Navigate to="/technician" replace />;
    return <Navigate to="/customer" replace />;
  }
  if (loading) return <PageLoader />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

    {/* Admin */}
    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminBookings /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/bookings/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminBookingDetail /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/dispatch" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminDispatch /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/technicians" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminTechnicians /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/services" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminServices /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/billing" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminBilling /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminReports /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminAuditLogs /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminNotifications /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />

    {/* Customer */}
    <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerLayout><CustomerDashboard /></CustomerLayout></ProtectedRoute>} />
    <Route path="/customer/services" element={<ProtectedRoute allowedRoles={['customer']}><CustomerLayout><CustomerServices /></CustomerLayout></ProtectedRoute>} />
    <Route path="/customer/services/:id" element={<ProtectedRoute allowedRoles={['customer']}><CustomerLayout><CreateBooking /></CustomerLayout></ProtectedRoute>} />
    <Route path="/customer/book" element={<ProtectedRoute allowedRoles={['customer']}><CustomerLayout><CreateBooking /></CustomerLayout></ProtectedRoute>} />
    <Route path="/customer/bookings" element={<ProtectedRoute allowedRoles={['customer']}><CustomerLayout><CustomerBookings /></CustomerLayout></ProtectedRoute>} />
    <Route path="/customer/bookings/:id" element={<ProtectedRoute allowedRoles={['customer']}><CustomerLayout><CustomerBookingDetail /></CustomerLayout></ProtectedRoute>} />
    <Route path="/customer/notifications" element={<ProtectedRoute allowedRoles={['customer']}><CustomerLayout><NotificationsPage /></CustomerLayout></ProtectedRoute>} />
    <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['customer']}><CustomerLayout><CustomerProfile /></CustomerLayout></ProtectedRoute>} />

    {/* Technician */}
    <Route path="/technician" element={<ProtectedRoute allowedRoles={['technician']}><TechnicianLayout><TechnicianDashboard /></TechnicianLayout></ProtectedRoute>} />
    <Route path="/technician/jobs" element={<ProtectedRoute allowedRoles={['technician']}><TechnicianLayout><TechnicianJobs /></TechnicianLayout></ProtectedRoute>} />
    <Route path="/technician/jobs/:id" element={<ProtectedRoute allowedRoles={['technician']}><TechnicianLayout><TechnicianJobDetail /></TechnicianLayout></ProtectedRoute>} />
    <Route path="/technician/notifications" element={<ProtectedRoute allowedRoles={['technician']}><TechnicianLayout><NotificationsPage /></TechnicianLayout></ProtectedRoute>} />
    <Route path="/technician/profile" element={<ProtectedRoute allowedRoles={['technician']}><TechnicianLayout><TechnicianProfile /></TechnicianLayout></ProtectedRoute>} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
