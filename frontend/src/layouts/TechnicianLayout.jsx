import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/shared/NotificationBell';
import { Home, Briefcase, User, Bell, LogOut, Menu, X, Zap } from 'lucide-react';
import { Avatar } from '../components/ui';

const bottomNav = [
  { to: '/technician', icon: Home, label: 'Home', end: true },
  { to: '/technician/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/technician/notifications', icon: Bell, label: 'Alerts' },
  { to: '/technician/profile', icon: User, label: 'Profile' },
];

const TechnicianLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="app-header px-4 lg:px-8 py-3 flex items-center gap-3 sticky top-0 z-30">
        <Link to="/technician" className="flex items-center gap-2 flex-1" aria-label="SmartService technician home">
          <div className="brand-icon technician-brand-icon w-9 h-9 rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-gray-900 text-sm">SmartService</span>
            <span className="ml-2 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Technician</span>
          </div>
        </Link>
        <NotificationBell />
        <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-4">
          <Avatar name={user?.name} size="sm" />
          <span className="max-w-36 truncate text-sm font-semibold text-slate-700">{user?.name}</span>
        </div>
        <button aria-label="Open navigation menu" onClick={() => setMenuOpen(true)} className="p-2 hover:bg-gray-100 active:scale-95 rounded-xl lg:hidden transition-transform">
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <nav aria-label="Technician navigation" className="hidden lg:flex items-center gap-1">
          {bottomNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`
              }
            >
              <Icon className="w-4 h-4" />{label}
            </NavLink>
          ))}
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 ml-2">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm animate-fade-in" onClick={() => setMenuOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Technician navigation menu" className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Avatar name={user?.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-emerald-600">Technician</p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav aria-label="Technician navigation" className="flex-1 px-3 py-4 space-y-1">
              {bottomNav.map(({ to, icon: Icon, label, end }) => (
                <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`
                  }
                >
                  <Icon className="w-5 h-5" />{label}
                </NavLink>
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-gray-100">
              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 pb-20 lg:pb-6 page-enter">
        {children}
      </main>

      <nav aria-label="Technician navigation" className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/70 flex lg:hidden z-30 bottom-nav">
        {bottomNav.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `mobile-nav-link flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors duration-200 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`
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

export default TechnicianLayout;
