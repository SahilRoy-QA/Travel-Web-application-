import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Car,
  Compass,
  Heart,
  Hotel,
  Luggage,
  Menu,
  Monitor,
  Moon,
  Shield,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { TravelLogo } from '../common/TravelLogo';
import { AuthModal } from '../auth/AuthModal';

export const Header: React.FC = () => {
  const { featureFlags } = useSettings();
  const { user, userProfile, isAdmin, isAgent, logout } = useAuth();
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [profileDropdownOpen]);

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { label: 'Hotels & Resorts', path: '/hotels', icon: Hotel },
    { label: 'Holiday Tours', path: '/packages', icon: Luggage },
    { label: 'Mobility & Cabs', path: '/cabs', icon: Car },
    { label: 'Services', path: '/services', icon: Compass },
  ];

  return (
    <>
      {/* Maintenance Mode Banner */}
      {featureFlags.maintenanceMode && (
        <div className="bg-amber-600 text-white text-[11px] sm:text-xs font-semibold py-1.5 px-3 sm:px-4 text-center leading-normal break-words">
          ⚠️ Maintenance Notice: System updates in progress. Bookings remain safeguarded.
        </div>
      )}

      {/* Top Banner Notice (if configured) */}
      {featureFlags.bannerMessage && (
        <div className="bg-slate-900 text-white text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 text-center border-b border-slate-800 flex items-center justify-center gap-2 leading-normal break-words">
          <span>{featureFlags.bannerMessage}</span>
        </div>
      )}

      {/* Header Container: No overflow-hidden so absolute profile dropdown floats cleanly above hero carousel */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group min-w-0">
            <TravelLogo />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Quick Theme Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-in spin-in-90 duration-200" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 animate-in spin-in-90 duration-200" />
              )}
            </button>

            {/* PWA In-App Install Button (desktop/tablet) */}
            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>

            {/* My Trips */}
            <Link
              to="/trips"
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition"
              title="My Bookings"
            >
              <Luggage className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">My Trips</span>
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="hidden sm:flex p-2 text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition"
              title="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative z-50" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-850 transition cursor-pointer"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[11px] sm:text-xs uppercase shadow-xs">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'U'}
                  </div>
                  <span className="hidden lg:block text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {userProfile?.displayName || 'Traveler'}
                  </span>
                </button>

                {/* Dropdown Menu - Floating with high z-index and shadow */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {userProfile?.displayName || 'Traveler'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email || 'traveler@travelly.com'}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded-md">
                        {userProfile?.role === 'super_admin'
                          ? 'Super Admin'
                          : userProfile?.role === 'admin'
                          ? 'Administrator'
                          : 'Traveler'}
                      </span>
                    </div>

                    {(isAdmin || isAgent) && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition"
                      >
                        <Shield className="w-4 h-4 text-sky-500" />
                        <span className="font-semibold">Admin Dashboard</span>
                      </Link>
                    )}

                    <Link
                      to="/trips"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <Luggage className="w-4 h-4 text-slate-400" />
                      <span>My Bookings</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Profile & Settings</span>
                    </Link>

                    <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Theme</span>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                        <span>{isDark ? 'Light' : 'Dark'}</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1 bg-sky-600 hover:bg-sky-500 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer shrink-0"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <Icon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <Link
              to="/trips"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <Luggage className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span>My Trips & Bookings</span>
            </Link>

            <Link
              to="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <Heart className="w-5 h-5 text-red-500" />
              <span>Saved Wishlist</span>
            </Link>

            {/* Mobile Theme Selector Segmented Control */}
            <div className="pt-3 pb-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Theme</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    theme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    theme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    theme === 'system' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5 text-slate-400" />
                  <span>Auto</span>
                </button>
              </div>
            </div>

            {/* Install App Button in Mobile Drawer */}
            <div className="pt-2">
              <PWAInstallButton variant="drawer" />
            </div>

            {(isAdmin || isAgent) && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10"
              >
                <Shield className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <span>Admin Dashboard</span>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};
