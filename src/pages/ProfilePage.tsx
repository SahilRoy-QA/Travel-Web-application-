import React, { useState } from 'react';
import {
  CheckCircle,
  Mail,
  Monitor,
  Moon,
  Phone,
  Sun,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const ProfilePage: React.FC = () => {
  const { user, userProfile, updateUserContact, isVerified, resendVerification } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phoneNumber || '');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserContact(name, phone);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 sm:py-12 transition-colors">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="w-14 h-14 rounded-full bg-sky-600 text-white flex items-center justify-center font-black text-xl uppercase shadow-md">
              {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {userProfile?.displayName || 'Traveler Profile'}
              </h1>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-200 dark:border-sky-500/20">
                  {userProfile?.role || 'Customer'}
                </span>
                {isVerified ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified Email
                  </span>
                ) : (
                  <button
                    onClick={() => resendVerification()}
                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400 underline cursor-pointer"
                  >
                    Verify Email
                  </button>
                )}
              </div>
            </div>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400">
              ✓ Profile information updated successfully.
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Legal Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-slate-400">Account login email cannot be edited directly</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Appearance & Theme Preference Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Appearance & Theme</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize how Travelly looks on your device. Choose between crisp light mode, midnight dark mode, or follow your system settings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-500/10 ring-2 ring-sky-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                <Sun className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">Light Mode</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Clean high-contrast daytime interface</div>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-500/10 ring-2 ring-sky-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3">
                <Moon className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">Dark Mode</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Deep slate midnight palette easy on the eyes</div>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                theme === 'system'
                  ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-500/10 ring-2 ring-sky-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center mb-3">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">System Default</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Automatically syncs with your device OS settings</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
