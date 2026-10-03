import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { TravelLogo } from '../common/TravelLogo';

export const Footer: React.FC = () => {
  const { branding } = useSettings();

  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-900 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info & Address */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <TravelLogo isDark={true} />
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              {branding.tagline || 'Elevate Every Journey. Discover Luxury Stays & Escapes.'}
            </p>

            <div className="space-y-2 text-xs text-slate-400 pt-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{branding.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{branding.contactPhone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{branding.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Footer Links */}
          {branding.footerLinks?.map((group, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {group.title}
              </h4>
              <ul className="space-y-2 text-xs">
                {group.links?.map((item, lIdx) => (
                  <li key={lIdx}>
                    <Link
                      to={item.url}
                      className="hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} {branding.brandName}. All rights reserved.</p>
          <div className="flex items-center gap-6 text-slate-400">
            <Link to="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link to="/admin" className="hover:text-sky-400 transition flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
