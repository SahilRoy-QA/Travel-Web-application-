import React from 'react';
import { Star } from 'lucide-react';
import { HomepageSection } from '../../types';

export const TestimonialsSection: React.FC<{ section: HomepageSection }> = ({ section }) => {
  const reviews = [
    {
      name: 'Priya Sharma',
      location: 'Mumbai, India',
      rating: 5,
      stay: 'The Grand Horizon Resort, Goa',
      date: 'Visited September 2026',
      comment:
        'The live room availability on ILLUSION was so seamless! Checked in at Goa without a minute delay, and the ocean view suite was exactly as pictured. Will book again!',
    },
    {
      name: 'Vikram Malhotra',
      location: 'Bengaluru, India',
      rating: 5,
      stay: 'Royal Rajasthan Heritage Odyssey',
      date: 'Visited August 2026',
      comment:
        'Our chauffeur and tour guide arranged by the ILLUSION agent was exceptional. The palace stays in Udaipur were royalty incarnate. Outstanding customer care!',
    },
    {
      name: 'Ananya Deshmukh',
      location: 'Pune, India',
      rating: 5,
      stay: 'Coconut Lagoon Backwater Retreat, Kerala',
      date: 'Visited October 2026',
      comment:
        'Private houseboat cruise with personal chef was a dream vacation for our anniversary. The BookMyShow-style step checkout was effortless on my mobile phone.',
    },
  ];

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200/60 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Guest Testimonials
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {section.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{section.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{rev.name}</p>
                <p className="text-[11px] text-slate-400">{rev.location}</p>
                <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-1 font-medium">{rev.stay}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
