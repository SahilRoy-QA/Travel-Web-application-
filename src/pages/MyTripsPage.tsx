import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Car,
  CheckCircle,
  Clock,
  Download,
  Hotel,
  Luggage,
  MapPin,
  Navigation,
  Phone,
  Printer,
  RotateCcw,
  ShieldAlert,
  Star,
  X,
  XCircle,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Booking } from '../types';
import { CabBooking } from '../types/cab';
import { AuthModal } from '../components/auth/AuthModal';
import { CabReviewModal } from '../components/cab/CabReviewModal';
import { cancelCabBookingInDb, getActiveFareConfig } from '../services/cabService';
import { calculateCancellationFee } from '../services/cabFareEngine';
import { defaultFareConfig } from '../services/defaultCabFareConfig';

export const MyTripsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { policies } = useSettings();

  // Primary category tab: 'stays' vs 'cabs'
  const [category, setCategory] = useState<'stays' | 'cabs'>(() => {
    return searchParams.get('tab') === 'cabs' ? 'cabs' : 'stays';
  });

  // Stays & Packages bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  // Cab bookings
  const [cabBookings, setCabBookings] = useState<CabBooking[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [fareConfig, setFareConfig] = useState(defaultFareConfig);

  // Stays Cancellation Modal
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [processingCancel, setProcessingCancel] = useState(false);

  // Cab Cancellation Modal
  const [cancellingCab, setCancellingCab] = useState<CabBooking | null>(null);
  const [cabCancelReason, setCabCancelReason] = useState('Changed plans');
  const [processingCabCancel, setProcessingCabCancel] = useState(false);

  // Cab Review Modal
  const [reviewingCab, setReviewingCab] = useState<CabBooking | null>(null);

  // Load fare config
  useEffect(() => {
    getActiveFareConfig().then((cfg) => setFareConfig(cfg));
  }, []);

  // Sync category tab with URL param
  const handleSelectCategory = (cat: 'stays' | 'cabs') => {
    setCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'cabs') {
      newParams.set('tab', 'cabs');
    } else {
      newParams.delete('tab');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Listen to Hotel/Package bookings
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
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

  // Listen to Cab bookings
  useEffect(() => {
    if (!user) return;

    try {
      const q = query(collection(db, 'cabBookings'), where('userId', '==', user.uid));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CabBooking));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setCabBookings(list);
        },
        (err) => {
          console.warn('Cab bookings listener notice:', err.message);
        }
      );

      return () => unsub();
    } catch {
      // Ignored
    }
  }, [user]);

  // Confirm Stay cancellation
  const handleConfirmCancelStay = async () => {
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

  // Confirm Cab cancellation
  const handleConfirmCancelCab = async () => {
    if (!cancellingCab || !user) return;
    setProcessingCabCancel(true);

    try {
      await cancelCabBookingInDb(
        cancellingCab.id,
        user.uid,
        cabCancelReason,
        cancellingCab,
        fareConfig
      );
      setCancellingCab(null);
      setCabCancelReason('Changed plans');
    } catch (err) {
      console.error('Cab cancel error:', err);
      alert('Could not cancel cab. Please try again.');
    } finally {
      setProcessingCabCancel(false);
    }
  };

  // Filter Stays
  const filteredStays = bookings.filter((b) => {
    if (activeTab === 'upcoming') return b.bookingStatus === 'confirmed' || b.bookingStatus === 'pending';
    if (activeTab === 'completed') return b.bookingStatus === 'completed';
    return b.bookingStatus === 'cancelled';
  });

  // Filter Cabs
  const filteredCabs = cabBookings.filter((c) => {
    if (activeTab === 'upcoming') {
      return (
        c.status === 'requested' ||
        c.status === 'confirmed' ||
        c.status === 'driver_assigned' ||
        c.status === 'driver_arriving' ||
        c.status === 'trip_started'
      );
    }
    if (activeTab === 'completed') return c.status === 'completed';
    return c.status === 'cancelled';
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              My Trips & Bookings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your verified stays, track live cabs, print invoices, and review drivers.
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

        {/* Primary Category Selector: Stays vs Cabs */}
        <div className="flex items-center gap-2 mb-6 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit no-print">
          <button
            type="button"
            onClick={() => handleSelectCategory('stays')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              category === 'stays'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Hotel className="w-4 h-4" />
            <span>Hotels & Stays ({bookings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectCategory('cabs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              category === 'cabs'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Cabs & Mobility ({cabBookings.length})</span>
          </button>
        </div>

        {/* Sub Status Tabs: Upcoming / Completed / Cancelled */}
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
            {category === 'stays'
              ? bookings.filter((b) => b.bookingStatus === 'confirmed' || b.bookingStatus === 'pending').length
              : cabBookings.filter((c) =>
                  ['requested', 'confirmed', 'driver_assigned', 'driver_arriving', 'trip_started'].includes(c.status)
                ).length}
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
            {category === 'stays'
              ? bookings.filter((b) => b.bookingStatus === 'completed').length
              : cabBookings.filter((c) => c.status === 'completed').length}
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
            {category === 'stays'
              ? bookings.filter((b) => b.bookingStatus === 'cancelled').length
              : cabBookings.filter((c) => c.status === 'cancelled').length}
            )
          </button>
        </div>

        {/* ========================================================= */}
        {/* CABS TAB RENDERING                                        */}
        {/* ========================================================= */}
        {category === 'cabs' && (
          <div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-40 bg-white dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800"
                  />
                ))}
              </div>
            ) : filteredCabs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
                <Car className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No {activeTab} cab rides
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
                  Book city rides, airport flat-rate transfers, hourly rentals, or outstation cabs.
                </p>
                <Link
                  to="/cabs"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Book a Cab Now
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredCabs.map((c) => {
                  const isLive = ['requested', 'confirmed', 'driver_assigned', 'driver_arriving', 'trip_started'].includes(
                    c.status
                  );
                  const isCompleted = c.status === 'completed';
                  const isCancelled = c.status === 'cancelled';

                  return (
                    <div
                      key={c.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row justify-between gap-5"
                    >
                      <div className="flex-1 space-y-3">
                        {/* Top Meta */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                            {c.tripType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            ID: {c.bookingNumber || c.id.slice(0, 8)}
                          </span>
                          {isLive && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              LIVE RIDE
                            </span>
                          )}
                        </div>

                        {/* Title: Vehicle & Model */}
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            {c.vehicleModel || c.vehicleType}
                          </h3>
                          {c.vehicleRegistrationNumber && (
                            <span className="font-mono text-xs font-bold text-slate-500">
                              {c.vehicleRegistrationNumber}
                            </span>
                          )}
                        </div>

                        {/* Pickup & Drop Addresses */}
                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="truncate">
                              <strong>Pickup:</strong> {c.pickupAddress}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="truncate">
                              <strong>Drop:</strong> {c.dropAddress}
                            </span>
                          </div>
                        </div>

                        {/* Driver & Date & Price */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-sky-500" />
                            {new Date(c.pickupDateTime).toLocaleDateString()} at{' '}
                            {new Date(c.pickupDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {c.driverName && (
                            <span className="flex items-center gap-1">
                              <strong>Driver:</strong> {c.driverName}
                            </span>
                          )}
                          <span className="font-bold text-slate-900 dark:text-white">
                            {policies.currencySymbol}
                            {c.fareBreakdown?.finalTotal?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>

                      {/* Right Column: Status & Action Buttons */}
                      <div className="flex sm:flex-col justify-between sm:justify-end items-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <div>
                          {isLive && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                              <Clock className="w-3 h-3" />
                              {c.status.replace(/_/g, ' ')}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              Completed
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-500/20">
                              <XCircle className="w-3 h-3" />
                              Cancelled
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 no-print">
                          {/* Live Track Ride Button */}
                          {isLive && (
                            <Link
                              to={`/cabs/trip/${c.id}`}
                              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Live Tracking</span>
                            </Link>
                          )}

                          {/* Print Invoice */}
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                            title="Print Tax Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Rate Driver Button (Only when completed) */}
                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => setReviewingCab(c)}
                              className="px-3 py-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{c.driverRating ? `Rated (${c.driverRating}★)` : 'Rate Driver'}</span>
                            </button>
                          )}

                          {/* Rebook Button */}
                          {(isCompleted || isCancelled) && (
                            <Link
                              to={`/cabs?tripType=${c.tripType}&pickup=${encodeURIComponent(c.pickupAddress)}&drop=${encodeURIComponent(c.dropAddress)}`}
                              className="px-3 py-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl transition flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Rebook</span>
                            </Link>
                          )}

                          {/* Cancel Ride Button */}
                          {isLive && (
                            <button
                              type="button"
                              onClick={() => setCancellingCab(c)}
                              className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                            >
                              Cancel Ride
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STAYS & PACKAGES TAB RENDERING                            */}
        {/* ========================================================= */}
        {category === 'stays' && (
          <div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-40 bg-white dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800"
                  />
                ))}
              </div>
            ) : filteredStays.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
                <Luggage className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No {activeTab} bookings
                </h3>
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
                {filteredStays.map((b) => (
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
                          <span className="text-xs font-bold text-slate-400">
                            ID: {b.bookingNumber}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {b.itemTitle}
                        </h3>

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
                            {policies.currencySymbol}
                            {(b.totalAmount ?? 0).toLocaleString()}
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
                          title="Print Voucher"
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
        )}
      </div>

      {/* STAYS CANCELLATION MODAL */}
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
                onClick={handleConfirmCancelStay}
                disabled={processingCancel}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {processingCancel ? 'Processing...' : 'Yes, Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAB CANCELLATION MODAL WITH CALCULATED FEE */}
      {cancellingCab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span>Confirm Cab Cancellation</span>
              </h3>
              <button onClick={() => setCancellingCab(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Cancel ride <strong>#{cancellingCab.bookingNumber}</strong> ({cancellingCab.pickupAddress})?
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs">
              <span className="font-bold text-amber-800 dark:text-amber-300">Policy Fee: </span>
              <span>
                Applicable cancellation charge is {policies.currencySymbol}
                {calculateCancellationFee(cancellingCab, fareConfig)}.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for cancellation
              </label>
              <select
                value={cabCancelReason}
                onChange={(e) => setCabCancelReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="Changed plans">Changed plans / Not traveling</option>
                <option value="Driver delayed">Driver taking too long</option>
                <option value="Booked another cab">Booked alternate transport</option>
                <option value="Wrong address">Wrong pickup location</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingCab(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Keep Ride
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelCab}
                disabled={processingCabCancel}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {processingCabCancel ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAB REVIEW MODAL */}
      {reviewingCab && (
        <CabReviewModal
          booking={reviewingCab}
          isOpen={!!reviewingCab}
          onClose={() => setReviewingCab(null)}
          onSuccess={() => {
            setReviewingCab(null);
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};
