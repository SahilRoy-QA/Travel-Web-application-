import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Check, Copy, Sparkles, Tag } from 'lucide-react';
import { db } from '../../services/firebase';
import { sampleBanners, sampleCoupons } from '../../services/seedData';
import { Banner, Coupon, HomepageSection } from '../../types';

export const OffersBannerSection: React.FC<{ section: HomepageSection }> = ({ section }) => {
  const [coupons, setCoupons] = useState<Coupon[]>(sampleCoupons);
  const [banners, setBanners] = useState<Banner[]>(sampleBanners);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const qCoupons = query(collection(db, 'coupons'), where('isActive', '==', true));
      const unsubC = onSnapshot(
        qCoupons,
        (snap) => {
          if (!snap.empty) {
            setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon)));
          }
        },
        () => {}
      );

      const qBanners = query(collection(db, 'banners'), where('isActive', '==', true));
      const unsubB = onSnapshot(
        qBanners,
        (snap) => {
          if (!snap.empty) {
            setBanners(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner)));
          }
        },
        () => {}
      );

      return () => {
        unsubC();
        unsubB();
      };
    } catch {
      // Fallback
    }
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <section className="py-14 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 border-b border-slate-200/60 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Exclusive Deals
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {section.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{section.subtitle}</p>
        </div>

        {/* Coupons Carousel / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}% OFF`
                      : `FLAT ₹${coupon.discountValue} OFF`}
                  </span>
                  <span className="text-[11px] text-slate-400">Min: ₹{coupon.minBookingAmount}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                  Use this promo code at checkout on hotels or tour packages.
                </p>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-2.5">
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white tracking-wider">
                  {coupon.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(coupon.code)}
                  className="flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 cursor-pointer"
                >
                  {copiedCode === coupon.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Highlight Promo Banner */}
        {banners.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.slice(0, 2).map((b) => (
              <Link
                key={b.id}
                to={b.link || '/hotels'}
                className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all aspect-21/9 bg-slate-900 flex items-center"
              >
                <img
                  src={b.image}
                  alt={b.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
                />
                <div className="relative p-6 sm:p-8 text-white z-10">
                  {b.badge && (
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-sky-600 text-white px-2.5 py-1 rounded-md mb-2">
                      {b.badge}
                    </span>
                  )}
                  <h3 className="text-lg sm:text-2xl font-black">{b.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-sm">{b.subtitle}</p>
                  <span className="inline-block mt-4 text-xs font-bold text-white underline underline-offset-4 group-hover:text-sky-400 transition-colors">
                    Explore Offer →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
