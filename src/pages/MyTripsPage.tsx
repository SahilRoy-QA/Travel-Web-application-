import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Luggage,
  MapPin,
  Printer,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Booking } from '../types';
import { AuthModal } from '../components/auth/AuthModal';

export const MyTripsPage: React.FC = () => {
  const { user } = useAuth();
  const { policies } = useSettings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Cancellation Modal
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [processingCancel, setProcessingCancel] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid)
      );

      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
          // Sort client-side by createdAt descending
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setBookings(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Bookings listener notice:', err.message);
          setLoading(false);
        }
      );

      return () => unsub();
    } catch {
      setLoading(false);
    }
  }, [user]);

  const handleConfirmCancel = async () => {
    if (!cancellingBooking || !user) return;
    setProcessingCancel(true);

    try {
      const ref = doc(db, 'bookings', cancellingBooking.id);
      await updateDoc(ref, {
        bookingStatus: 'cancelled',
        cancellationReason: cancelReason || 'Cancelled by guest',
        cancelledAt: new Date().toISOString(),
      });
      setCancellingBooking(null);
      setCancelReason('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${cancellingBooking.id}`);
    } finally {
      setProcessingCancel(false);
    }
  };

  const filtered = bookings.filter((b) => {
    if (activeTab === 'upcoming') return b.bookingStatus === 'confirmed' || b.bookingStatus === 'pending';
    if (activeTab === 'completed') return b.bookingStatus === 'completed';
    return b.bookingStatus === 'cancelled';
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              My Trips & Bookings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your confirmed stays, check vouchers, and track cancellations.
            </p>
          </div>

          {!user && (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              Sign In to View Trips
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 no-print">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Upcoming (
            {bookings.filter((b) => b.bookingStatus === 'confirmed' || b.bookingStatus === 'pending').length}
            )
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Completed (
            {bookings.filter((b) => b.bookingStatus === 'completed').length}
            )
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'cancelled'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Cancelled (
            {bookings.filter((b) => b.bookingStatus === 'cancelled').length}
            )
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-40 bg-white dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
            <Luggage className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No {activeTab} bookings</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
              When you book hotels, luxury chalets, or packages, your vouchers appear here.
            </p>
            <Link
              to="/hotels"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Explore Hotels
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row justify-between gap-6"
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {b.itemImage && (
                    <img
                      src={b.itemImage}
                      alt={b.itemTitle}
                      className="w-full sm:w-36 aspect-16/10 rounded-2xl object-cover"
                    />
                  )}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {b.type}
                      </span>
                      <span className="text-xs font-bold text-slate-400">ID: {b.bookingNumber}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{b.itemTitle}</h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        {b.checkInDate || b.departureDate}
                        {b.checkOutDate && ` to ${b.checkOutDate}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{b.guestsCount} Guests</span>
                    </div>

                    <div className="text-xs pt-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {policies.currencySymbol}{b.totalAmount.toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-1">
                        ({b.paymentMode === 'pay_later' ? 'Pay upon arrival' : 'Paid online'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex sm:flex-col justify-between sm:justify-end items-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div>
                    {b.bookingStatus === 'confirmed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        Confirmed
                      </span>
                    )}
                    {b.bookingStatus === 'cancelled' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-500/20">
                        <XCircle className="w-3 h-3" />
                        Cancelled
                      </span>
                    )}
                    {b.bookingStatus === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 no-print">
                    <button
                      onClick={() => window.print()}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                      title="Print Voucher (Always renders light-mode for clean ink printing)"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {b.bookingStatus === 'confirmed' && (
                      <button
                        onClick={() => setCancellingBooking(b)}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                      >
                        Cancel Stay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span>Confirm Cancellation</span>
              </h3>
              <button onClick={() => setCancellingBooking(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to cancel booking <strong>{cancellingBooking.bookingNumber}</strong> for{' '}
              <strong>{cancellingBooking.itemTitle}</strong>?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for cancellation (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Change of plans, found alternate dates..."
                rows={3}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={processingCancel}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {processingCancel ? 'Processing...' : 'Yes, Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};
