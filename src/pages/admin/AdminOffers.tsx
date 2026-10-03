import React, { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import {
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../services/firebase';
import { useSettings } from '../../context/SettingsContext';
import { sampleBanners, sampleCoupons } from '../../services/seedData';
import { Banner, Coupon } from '../../types';

export const AdminOffers: React.FC = () => {
  const { policies } = useSettings();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // New Coupon Form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minBookingAmount, setMinBookingAmount] = useState(3000);
  const [maxDiscount, setMaxDiscount] = useState(1500);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubC = onSnapshot(collection(db, 'coupons'), (snap) => {
      if (!snap.empty) {
        setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon)));
      } else {
        setCoupons(sampleCoupons);
      }
    });

    const unsubB = onSnapshot(collection(db, 'banners'), (snap) => {
      if (!snap.empty) {
        setBanners(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner)));
      } else {
        setBanners(sampleBanners);
      }
    });

    return () => {
      unsubC();
      unsubB();
    };
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(collection(db, 'coupons'));
      await setDoc(docRef, {
        id: docRef.id,
        code: code.trim().toUpperCase(),
        discountType,
        discountValue,
        minBookingAmount,
        maxDiscount: discountType === 'percentage' ? maxDiscount : undefined,
        isActive: true,
        usedCount: 0,
        createdAt: new Date().toISOString(),
      });
      setModalOpen(false);
      setCode('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'coupons');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Delete coupon?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `coupons/${id}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Offers & Promo Coupons
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create promotional voucher codes and seasonal homepage discount banners.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((cp) => (
          <div
            key={cp.id}
            className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-base font-black text-orange-400 bg-slate-900 px-3 py-1 rounded-xl">
                  {cp.code}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>

              <p className="text-sm font-bold text-white">
                {cp.discountType === 'percentage'
                  ? `${cp.discountValue}% Discount`
                  : `Flat ${policies.currencySymbol}${cp.discountValue} Off`}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Min. Booking: {policies.currencySymbol}{cp.minBookingAmount.toLocaleString()}
              </p>
              {cp.maxDiscount && (
                <p className="text-xs text-slate-400">
                  Max Cap: {policies.currencySymbol}{cp.maxDiscount.toLocaleString()}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-700/60 mt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Used {cp.usedCount || 0} times</span>
              <button
                onClick={() => handleDeleteCoupon(cp.id)}
                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Promo Code</h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE2026"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat ({policies.currencySymbol})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Minimum Booking Amount ({policies.currencySymbol})
                </label>
                <input
                  type="number"
                  required
                  value={minBookingAmount}
                  onChange={(e) => setMinBookingAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              {discountType === 'percentage' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Maximum Discount Cap ({policies.currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl"
                >
                  {saving ? 'Creating...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
