import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/shared/NotificationBell';
import { Avatar } from '../components/ui';
import { Home, Layers, CalendarCheck, Bell, User, LogOut, Menu, X, Zap } from 'lucide-react';

const bottomNav = [
  { to: '/customer', icon: Home, label: 'Home', end: true },
  { to: '/customer/services', icon: Layers, label: 'Services' },
  { to: '/customer/bookings', icon: CalendarCheck, label: 'Bookings' },
  { to: '/customer/notifications', icon: Bell, label: 'Alerts' },
  { to: '/customer/profile', icon: User, label: 'Profile' },
];

const CustomerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="app-header px-4 lg:px-8 py-3 flex items-center gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-2 flex-1">
          <Link to="/customer" className="flex items-center gap-2.5" aria-label="SmartService customer home">
            <div className="brand-icon w-9 h-9 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-gray-900 text-sm">SmartService</span>
          </Link>
        </div>
        <NotificationBell />
        <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-4">
          <Avatar name={user?.name} size="sm" />
          <span className="max-w-36 truncate text-sm font-semibold text-slate-700">{user?.name}</span>
        </div>
        <button aria-label="Open navigation menu" onClick={() => setMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-xl lg:hidden transition-colors">
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        {/* Desktop nav */}
        <nav aria-label="Customer navigation" className="hidden lg:flex items-center gap-1">
          {bottomNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`
              }
            >
              <Icon className="w-4 h-4" />{label}
            </NavLink>
          ))}
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ml-2">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm animate-fade-in" onClick={() => setMenuOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Customer navigation menu" className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Avatar name={user?.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-400">Customer</p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav aria-label="Customer navigation" className="flex-1 px-3 py-4 space-y-1">
              {bottomNav.map(({ to, icon: Icon, label, end }) => (
                <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`
                  }
                >
                  <Icon className="w-5 h-5" />{label}
                </NavLink>
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-gray-100">
              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-6 page-enter">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav aria-label="Customer navigation" className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/70 flex lg:hidden z-30 bottom-nav">
        {bottomNav.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `mobile-nav-link flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors duration-200 ${isActive ? 'text-primary-600' : 'text-gray-400'}`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default CustomerLayout;
