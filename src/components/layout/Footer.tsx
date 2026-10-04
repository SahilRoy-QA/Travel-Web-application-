import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { TravelLogo } from '../common/TravelLogo';

export const Footer: React.FC = () => {
  const { branding } = useSettings();
  const { theme, isDark, setTheme } = useTheme();

  // State to track which footer accordion sections are expanded on mobile
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});

  const toggleSection = (index: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <footer className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-sm border-t border-slate-200 dark:border-slate-900 mt-16 sm:mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand Info & Address */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <TravelLogo />
            </Link>

            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              {branding.tagline || 'Elevate Every Journey. Discover Luxury Stays & Escapes.'}
            </p>

            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>{branding.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>{branding.contactPhone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>{branding.contactEmail}</span>
              </div>
            </div>

            {/* Theme Selector Widget in Footer */}
            <div className="pt-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Appearance
              </span>
              <div className="inline-flex items-center rounded-xl bg-slate-200/80 dark:bg-slate-900 p-1 border border-slate-300/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                  title="Light Mode"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                  title="Dark Mode"
                >
                  <Moon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                  title="System Theme"
                >
                  <Monitor className="w-3.5 h-3.5 text-slate-400" />
                  <span>System</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Footer Links (Collapsible Accordion on Mobile, Expanded Columns on Desktop) */}
          {branding.footerLinks?.map((group, idx) => {
            const isOpen = !!openSections[idx];

            return (
              <div
                key={idx}
                className="border-b border-slate-200/80 dark:border-slate-800/80 md:border-b-0 pb-3 md:pb-0"
              >
                {/* Mobile Accordion Header Button */}
                <button
                  type="button"
                  onClick={() => toggleSection(idx)}
                  className="md:hidden w-full flex items-center justify-between py-2 text-left text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Desktop Static Header */}
                <h4 className="hidden md:block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  {group.title}
                </h4>

                {/* Links List: Collapsible on Mobile, Always Block on Desktop */}
                <ul
                  className={`space-y-2 text-xs pt-1 md:pt-0 ${
                    isOpen ? 'block animate-in fade-in duration-150' : 'hidden md:block'
                  }`}
                >
                  {group.links?.map((item, lIdx) => (
                    <li key={lIdx}>
                      <Link
                        to={item.url}
                        className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-white transition-colors block py-0.5"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="border-t border-slate-200 dark:border-slate-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} {branding.brandName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition">
              Privacy Policy
            </Link>
            <Link
              to="/admin"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition flex items-center gap-1 font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
