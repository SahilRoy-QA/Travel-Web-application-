import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Car,
  CheckCircle,
  Clock,
  Copy,
  Download,
  MapPin,
  Navigation,
  Phone,
  Printer,
  Share2,
  Shield,
  ShieldAlert,
  Star,
  X,
  XCircle,
} from 'lucide-react';
import { CabBooking, CabBookingStatus, DriverLocation } from '../types/cab';
import {
  cancelCabBookingInDb,
  getActiveFareConfig,
  subscribeToCabBooking,
  subscribeToDriverLocation,
} from '../services/cabService';
import { calculateCancellationFee } from '../services/cabFareEngine';
import { defaultFareConfig } from '../services/defaultCabFareConfig';
import { CabReviewModal } from '../components/cab/CabReviewModal';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const STATUS_ORDER: CabBookingStatus[] = [
  'requested',
  'confirmed',
  'driver_assigned',
  'driver_arriving',
  'trip_started',
  'completed',
];

const STATUS_LABELS: Record<CabBookingStatus, { label: string; desc: string }> = {
  requested: { label: 'Ride Requested', desc: 'Finding the nearest available driver' },
  confirmed: { label: 'Ride Confirmed', desc: 'Booking confirmed in system' },
  driver_assigned: { label: 'Driver Assigned', desc: 'Driver accepted your ride' },
  driver_arriving: { label: 'Driver Arriving', desc: 'Driver is on the way to your pickup' },
  trip_started: { label: 'Trip Started', desc: 'Ride in progress towards destination' },
  completed: { label: 'Trip Completed', desc: 'Hope you enjoyed your journey!' },
  cancelled: { label: 'Ride Cancelled', desc: 'This trip was cancelled' },
};

export const CabLiveTripPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { policies, branding } = useSettings();

  const [booking, setBooking] = useState<CabBooking | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [fareConfig, setFareConfig] = useState(defaultFareConfig);

  // Modals & UI states
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed plans');
  const [cancelling, setCancelling] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Emergency contact (configurable or standard 112)
  const emergencyPhone = branding?.contactPhone || '112';

  // Load fare config
  useEffect(() => {
    getActiveFareConfig().then((cfg) => setFareConfig(cfg));
  }, []);

  // Subscribe to booking live status
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const unsub = subscribeToCabBooking(id, (b) => {
      setBooking(b);
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  // Subscribe to driver location
  useEffect(() => {
    if (!booking?.driverId) return;

    const unsub = subscribeToDriverLocation(booking.driverId, (loc) => {
      setDriverLocation(loc);
    });

    return () => unsub();
  }, [booking?.driverId]);

  // Handle Share Trip
  const handleShareTrip = async () => {
    const shareUrl = window.location.href;
    const shareText = `Track my Illusion Cab live ride #${booking?.bookingNumber || id}: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Track My Cab Ride',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareUrl);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  // Handle Cancel Ride
  const handleCancelRide = async () => {
    if (!booking || !user) return;
    setCancelling(true);

    try {
      await cancelCabBookingInDb(booking.id, user.uid, cancelReason, booking, fareConfig);
      setCancelModalOpen(false);
    } catch (err) {
      console.error('Cancel cab failed:', err);
      alert('Could not cancel trip. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Connecting to live trip telemetry...
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Trip Not Found</h2>
          <p className="text-xs text-slate-500">
            Booking ID &quot;{id}&quot; does not exist or has expired.
          </p>
          <Link
            to="/cabs"
            className="inline-block py-2.5 px-5 bg-sky-600 text-white rounded-xl text-xs font-bold"
          >
            Book a New Cab
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';
  const currentStepIdx = STATUS_ORDER.indexOf(booking.status);
  const cancellationFeePreview = calculateCancellationFee(booking, fareConfig);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-24 transition-colors">
      {/* Top Bar with SOS and Share */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-14 sm:top-20 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/trips?tab=cabs"
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
            >
              <Navigation className="w-5 h-5 rotate-180" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  Live Ride #{booking.bookingNumber || booking.id.slice(0, 8)}
                </span>
                {!isCancelled && !isCompleted && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {STATUS_LABELS[booking.status]?.label || booking.status}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Trip Link */}
            <button
              type="button"
              onClick={handleShareTrip}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4 text-sky-500" />
              <span className="hidden sm:inline">Share Trip</span>
            </button>

            {/* Emergency SOS Button */}
            <button
              type="button"
              onClick={() => setSosModalOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/30 transition cursor-pointer flex items-center gap-1.5 animate-pulse"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>SOS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl text-xs font-bold border border-slate-700 animate-in fade-in">
          Trip link copied to clipboard!
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* ========================================================= */}
        {/* LIVE STATUS TIMELINE (6 STEPS)                            */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {STATUS_LABELS[booking.status]?.label}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {STATUS_LABELS[booking.status]?.desc}
              </p>
            </div>
            {isCancelled && (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-500 border border-rose-500/20">
                Cancelled
              </span>
            )}
          </div>

          {!isCancelled && (
            <div className="relative pt-2 pb-2">
              <div className="overflow-x-auto no-scrollbar pb-2">
                <div className="flex items-center justify-between min-w-[500px] relative">
                  {/* Connecting track line */}
                  <div className="absolute top-4 left-4 right-4 h-1 bg-slate-100 dark:bg-slate-800 -z-0" />
                  <div
                    className="absolute top-4 left-4 h-1 bg-sky-600 transition-all duration-500 -z-0"
                    style={{
                      width: `${(Math.max(0, currentStepIdx) / (STATUS_ORDER.length - 1)) * 100}%`,
                    }}
                  />

                  {STATUS_ORDER.map((st, i) => {
                    const isPassed = currentStepIdx >= i;
                    const isCurrent = currentStepIdx === i;

                    return (
                      <div key={st} className="flex flex-col items-center z-10 text-center w-20">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                            isCurrent
                              ? 'bg-sky-600 text-white ring-4 ring-sky-500/25 scale-110'
                              : isPassed
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isPassed && !isCurrent ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span>{i + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold mt-2 leading-tight ${
                            isCurrent
                              ? 'text-sky-600 dark:text-sky-400'
                              : isPassed
                              ? 'text-slate-800 dark:text-slate-200'
                              : 'text-slate-400'
                          }`}
                        >
                          {STATUS_LABELS[st].label.replace('Ride ', '').replace('Trip ', '')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* LIVE SIMULATED ROUTE & DRIVER MAP VIEW                    */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Visual Route Canvas / SVG Map representation */}
          <div className="relative h-64 sm:h-80 bg-slate-900 overflow-hidden flex items-center justify-center">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Simulated Road Lines & Curves */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 800 400"
              preserveAspectRatio="none"
            >
              {/* Road base */}
              <path
                d="M 120 280 C 260 280, 320 140, 520 140 C 620 140, 680 220, 720 220"
                fill="none"
                stroke="#1e293b"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Road lane line */}
              <path
                d="M 120 280 C 260 280, 320 140, 520 140 C 620 140, 680 220, 720 220"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeDasharray="8 8"
                className="animate-pulse"
              />
            </svg>

            {/* Pickup Location Marker */}
            <div className="absolute left-[15%] bottom-[25%] flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px] shadow-lg mb-1 whitespace-nowrap">
                PICKUP
              </div>
              <div className="w-5 h-5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/30 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-slate-950" />
              </div>
            </div>

            {/* Live Moving Driver Vehicle Marker */}
            {!isCancelled && !isCompleted && (
              <div className="absolute left-[45%] top-[35%] flex flex-col items-center animate-bounce duration-1000">
                <div className="px-2.5 py-1 rounded-md bg-sky-500 text-white font-black text-[10px] shadow-lg mb-1 whitespace-nowrap flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  <span>
                    {booking.vehicleModel?.split(' ')[0] || 'Cab'} • {booking.vehicleRegistrationNumber || 'Live'}
                  </span>
                </div>
                <div className="relative">
                  <span className="w-8 h-8 rounded-full bg-sky-500/20 absolute -inset-1 animate-ping" />
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-xl ring-2 ring-white">
                    <Navigation className="w-3.5 h-3.5 rotate-45" />
                  </div>
                </div>
              </div>
            )}

            {/* Drop Location Marker */}
            <div className="absolute right-[12%] bottom-[40%] flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-md bg-rose-500 text-white font-black text-[10px] shadow-lg mb-1 whitespace-nowrap">
                DESTINATION
              </div>
              <div className="w-5 h-5 rounded-full bg-rose-500 ring-4 ring-rose-500/30 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Map Overlay Badges */}
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  ETA: <strong>{booking.fareBreakdown?.durationMinutes || 25} mins</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Distance: <strong>{booking.fareBreakdown?.distanceKm || 18} km</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Route Text Addresses */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase text-[10px]">Pickup Location</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {booking.pickupAddress}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 p-1 rounded-md bg-rose-500/10 text-rose-500">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase text-[10px]">Drop Destination</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {booking.dropAddress}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DRIVER & VEHICLE DETAILS + START OTP                      */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Driver Card */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <img
                  src={
                    booking.driverPhotoUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                  }
                  alt={booking.driverName}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-sky-500/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {booking.driverName || 'Rajesh Kumar'}
                    </h3>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {booking.driverRating || 4.9}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified Commercial Pilot • Masked Call Guard
                  </p>
                </div>
              </div>

              {/* Tap to call */}
              <a
                href={`tel:${booking.driverPhone || '+919876543210'}`}
                className="p-3 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl shadow-lg shadow-sky-600/25 transition cursor-pointer flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-bold">Call Driver</span>
              </a>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Vehicle
                </p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {booking.vehicleModel || 'Maruti Suzuki Dzire'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  License Plate
                </p>
                <p className="font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white mt-0.5">
                  {booking.vehicleRegistrationNumber || 'DL 01 AB 4021'}
                </p>
              </div>
            </div>
          </div>

          {/* OTP Box */}
          <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 rounded-3xl p-5 flex flex-col justify-between text-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                Boarding OTP
              </p>
              <div className="my-3 flex items-center justify-center gap-2">
                <span className="text-4xl font-black tracking-widest text-sky-600 dark:text-sky-400 font-mono">
                  {booking.otp}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(booking.otp);
                    setCopiedOtp(true);
                    setTimeout(() => setCopiedOtp(false), 2000);
                  }}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs text-slate-600 dark:text-slate-300 hover:text-sky-600 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Share with driver when boarding vehicle to start trip.
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COMPLETED OR CANCELLED ACTIONS                            */}
        {/* ========================================================= */}
        {isCompleted && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Trip Completed Successfully
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your ride has completed. A digital receipt has been issued to your account.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Star className="w-4 h-4 fill-slate-950" />
                <span>Rate Driver & Vehicle</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Download Tax Invoice</span>
              </button>
            </div>
          </div>
        )}

        {/* Cancellation Button (Only active when ride is not yet completed or cancelled) */}
        {!isCompleted && !isCancelled && (
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">Need to cancel?</p>
              <p className="text-[11px] text-slate-400">
                Applicable cancellation fee: {policies.currencySymbol}
                {cancellationFeePreview}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="py-2 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
            >
              Cancel Ride
            </button>
          </div>
        )}
      </div>

      {/* SOS MODAL */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto ring-8 ring-rose-500/10">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Emergency SOS Assistance
            </h3>
            <p className="text-xs text-slate-500">
              This will dial emergency services ({emergencyPhone}) and dispatch live telemetry to
              the emergency control desk.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-left text-[11px] space-y-1 font-mono text-slate-600 dark:text-slate-300">
              <p>Trip: #{booking.bookingNumber}</p>
              <p>Vehicle: {booking.vehicleRegistrationNumber}</p>
              <p>Driver: {booking.driverName} ({booking.driverPhone})</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSosModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Dismiss
              </button>
              <a
                href={`tel:${emergencyPhone}`}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                <Phone className="w-4 h-4" />
                <span>Call {emergencyPhone}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Confirm Ride Cancellation
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="p-1 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Driver has already been assigned and dispatched. As per policy, cancellation charge is{' '}
              <strong className="text-rose-500">
                {policies.currencySymbol}
                {cancellationFeePreview}
              </strong>
              .
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Reason for cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="Changed plans">Changed plans / Not traveling</option>
                <option value="Driver delayed">Driver taking too long to arrive</option>
                <option value="Booked another cab">Booked alternate cab</option>
                <option value="Wrong address">Wrong pickup address entered</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Keep Ride
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelRide}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <CabReviewModal
          booking={booking}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
        />
      )}
    </div>
  );
};
