import React from 'react';
import { Award, Clock, CreditCard, Headphones, ShieldCheck, Sparkles } from 'lucide-react';
import { HomepageSection } from '../../types';

export const WhyChooseUsSection: React.FC<{ section: HomepageSection }> = ({ section }) => {
  const perks = [
    {
      icon: ShieldCheck,
      title: '100% Verified Inventory',
      desc: 'Every hotel room and tour itinerary is physically audited and guaranteed at check-in.',
    },
    {
      icon: CreditCard,
      title: 'Transparent Pricing',
      desc: 'Zero hidden booking surcharges. What you see on screen is the total checkout amount.',
    },
    {
      icon: Clock,
      title: 'Instant Free Cancellation',
      desc: 'Plans change? Cancel with 1-click up to 24 hours before your trip for a full refund.',
    },
    {
      icon: Headphones,
      title: '24/7 Concierge Support',
      desc: 'Dedicated travel specialists reachable anytime via call, chat, or WhatsApp throughout your stay.',
    },
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-950 transition-colors" id="why_choose_us">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            The ILLUSION Promise
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {section.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{section.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {perks.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 transition-all hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{p.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
