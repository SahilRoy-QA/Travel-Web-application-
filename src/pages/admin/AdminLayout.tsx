import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  ChevronRight,
  Compass,
  Database,
  Globe,
  Hotel,
  Layers,
  LayoutDashboard,
  LogOut,
  Luggage,
  Menu,
  MessageSquare,
  Percent,
  Settings,
  Shield,
  Sparkles,
  Tag,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { seedAllDemoData } from '../../services/dbInit';
import { TravelLogo } from '../../components/common/TravelLogo';

export const AdminLayout: React.FC = () => {
  const { user, userProfile, isAdmin, isSuperAdmin, isAgent, logout } = useAuth();
  const { branding } = useSettings();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<string | null>(null);

  // Guard: If not admin and not agent, redirect or show unauthorized
  if (!isAdmin && !isAgent) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-center text-white">
        <div className="max-w-md bg-slate-800 p-8 rounded-3xl border border-slate-700 space-y-4">
          <Shield className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">Admin Privileges Required</h2>
          <p className="text-xs text-slate-400">
            You must be logged in as an administrator or certified tour agent to access the back-office panel.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl"
            >
              Return to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSeedData = async () => {
    if (!window.confirm('Load full demo dataset (hotels, rooms, packages, services, coupons)?')) {
      return;
    }
    setSeeding(true);
    setSeedProgress('Seeding initialized...');
    try {
      await seedAllDemoData((msg) => setSeedProgress(msg));
      setTimeout(() => {
        setSeeding(false);
        setSeedProgress(null);
        window.location.reload();
      }, 1200);
    } catch {
      setSeeding(false);
      setSeedProgress('Seeding failed.');
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Site Builder & Theme', path: '/admin/site-builder', icon: Layers },
    { label: 'Hotels & Rooms', path: '/admin/hotels', icon: Hotel },
    { label: 'Tour Packages', path: '/admin/packages', icon: Luggage },
    { label: 'Tour Agents', path: '/admin/agents', icon: UserCheck },
    { label: 'Mobility & Cabs', path: '/admin/services', icon: Compass },
    { label: 'Bookings & Sales', path: '/admin/bookings', icon: BarChart3 },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Offers & Coupons', path: '/admin/offers', icon: Tag },
    { label: 'Reviews Moderation', path: '/admin/reviews', icon: MessageSquare },
    { label: 'Settings & Policies', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors">
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <TravelLogo compact isDark={isDark} />
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xs font-bold text-sky-600 dark:text-sky-400">
            View App →
          </Link>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between transform transition-transform duration-200 lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-0 max-lg:-translate-x-full'
        }`}
      >
        <div>
          {/* Admin Header Brand */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
            <Link to="/admin" className="flex items-center gap-2.5">
              <TravelLogo isDark={isDark} showTagline={false} />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {/* Quick Demo Data Seed Button */}
          {isAdmin && (
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{seeding ? (seedProgress || 'Seeding...') : 'Load Demo Data'}</span>
            </button>
          )}

          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Customer Website</span>
            </span>
            <ChevronRight className="w-3 h-3" />
          </Link>

          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area with Top Bar */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-sky-600 dark:text-sky-400">
              Back-Office Control
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Role: <strong className="text-slate-800 dark:text-white capitalize">{userProfile?.role || 'Admin'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition"
            >
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              <span>Open Public App</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
