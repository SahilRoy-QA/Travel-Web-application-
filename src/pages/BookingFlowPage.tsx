import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Hotel as HotelIcon,
  Lock,
  Luggage,
  MapPin,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  Users,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { sampleHotels, samplePackages, sampleServices } from '../services/seedData';
import { Booking, Coupon, Hotel, RoomType, TourPackage, ServiceItem } from '../types';
import { AuthModal } from '../components/auth/AuthModal';

export const BookingFlowPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userProfile, isVerified, resendVerification } = useAuth();
  const { policies, featureFlags, branding } = useSettings();

  const type = (searchParams.get('type') as 'hotel' | 'package' | 'service') || 'hotel';
  const itemId = searchParams.get('itemId') || '';
  const roomId = searchParams.get('roomId') || '';
  const checkIn = searchParams.get('checkIn') || new Date().toISOString().split('T')[0];
  const checkOut = searchParams.get('checkOut') || '';
  const departureDate = searchParams.get('departureDate') || '';
  const nights = Number(searchParams.get('nights') || 1);
  const roomsCount = Number(searchParams.get('roomsCount') || 1);
  const guestsCount = Number(searchParams.get('guestsCount') || 2);

  // Steps: 1: Selection Review, 2: Guest Details, 3: Pricing & Coupons, 4: Payment, 5: Confirmation
  const [step, setStep] = useState<number>(1);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Item details
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [room, setRoom] = useState<RoomType | null>(null);
  const [pkg, setPkg] = useState<TourPackage | null>(null);
  const [service, setService] = useState<ServiceItem | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [basePrice, setBasePrice] = useState(0);

  // Guest details state
  const [primaryName, setPrimaryName] = useState(userProfile?.displayName || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(userProfile?.phoneNumber || '');
  const [specialRequests, setSpecialRequests] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Payment state
  const [paymentMode, setPaymentMode] = useState<'pay_later' | 'online'>('pay_later');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [processing, setProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  // Fetch target catalog document
  useEffect(() => {
    if (!itemId) return;

    const loadItem = async () => {
      if (type === 'hotel') {
        const hotelSnap = await getDoc(doc(db, 'hotels', itemId));
        let hData = hotelSnap.exists() ? ({ id: hotelSnap.id, ...hotelSnap.data() } as Hotel) : null;
        if (!hData) {
          hData = sampleHotels.find((h) => h.id === itemId) || null;
        }

        if (hData) {
          setHotel(hData);
          setItemTitle(hData.name);
          setItemImage(hData.images?.[0] || '');

          if (roomId) {
            const roomSnap = await getDoc(doc(db, 'rooms', roomId));
            let rData = roomSnap.exists() ? ({ id: roomSnap.id, ...roomSnap.data() } as RoomType) : null;
            if (!rData && hData.rooms) {
              rData = hData.rooms.find((r) => r.id === roomId) || null;
            }
            if (rData) {
              setRoom(rData);
              setBasePrice(rData.basePrice * nights * roomsCount);
            } else {
              setBasePrice(hData.minPrice * nights * roomsCount);
            }
          }
        }
      } else if (type === 'package') {
        const pkgSnap = await getDoc(doc(db, 'packages', itemId));
        let pData = pkgSnap.exists() ? ({ id: pkgSnap.id, ...pkgSnap.data() } as TourPackage) : null;
        if (!pData) pData = samplePackages.find((p) => p.id === itemId) || null;
        if (pData) {
          setPkg(pData);
          setItemTitle(pData.title);
          setItemImage(pData.images?.[0] || '');
          setBasePrice(pData.pricePerTraveller * guestsCount);
        }
      } else if (type === 'service') {
        const srvSnap = await getDoc(doc(db, 'services', itemId));
        let sData = srvSnap.exists() ? ({ id: srvSnap.id, ...srvSnap.data() } as ServiceItem) : null;
        if (!sData) sData = sampleServices.find((s) => s.id === itemId) || null;
        if (sData) {
          setService(sData);
          setItemTitle(sData.title);
          setItemImage(sData.image);
          setBasePrice(sData.price * guestsCount);
        }
      }
    };

    loadItem();
  }, [itemId, roomId, type, nights, roomsCount, guestsCount]);

  // Keep guest fields in sync with user profile
  useEffect(() => {
    if (userProfile?.displayName && !primaryName) setPrimaryName(userProfile.displayName);
    if (user?.email && !guestEmail) setGuestEmail(user.email);
    if (userProfile?.phoneNumber && !guestPhone) setGuestPhone(userProfile.phoneNumber);
  }, [user, userProfile]);

  // Coupon application logic
  const handleApplyCoupon = async () => {
    setCouponError(null);
    setCouponSuccess(null);
    if (!couponCode.trim()) return;

    try {
      const q = query(
        collection(db, 'coupons'),
        where('code', '==', couponCode.trim().toUpperCase()),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        // Check local sample coupons
        const codeUpper = couponCode.trim().toUpperCase();
        if (codeUpper === 'WELCOME500' && basePrice >= 2000) {
          setAppliedCoupon({
            id: 'local_cp',
            code: 'WELCOME500',
            discountType: 'flat',
            discountValue: 500,
            minBookingAmount: 2000,
            isActive: true,
            usedCount: 1,
          });
          setCouponSuccess('Promo code WELCOME500 applied! ₹500 discount added.');
          return;
        }
        if (codeUpper === 'ILLUSION10' && basePrice >= 3000) {
          setAppliedCoupon({
            id: 'local_cp2',
            code: 'ILLUSION10',
            discountType: 'percentage',
            discountValue: 10,
            minBookingAmount: 3000,
            maxDiscount: 2000,
            isActive: true,
            usedCount: 1,
          });
          setCouponSuccess('Promo code ILLUSION10 applied! 10% discount added.');
          return;
        }
        if (codeUpper === 'SUMMER2026' && basePrice >= 10000) {
          setAppliedCoupon({
            id: 'local_cp3',
            code: 'SUMMER2026',
            discountType: 'flat',
            discountValue: 1500,
            minBookingAmount: 10000,
            isActive: true,
            usedCount: 1,
          });
          setCouponSuccess('Promo code SUMMER2026 applied! ₹1,500 discount added.');
          return;
        }
        setCouponError('Invalid or expired coupon code.');
        return;
      }

      const cpData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Coupon;
      if (basePrice < cpData.minBookingAmount) {
        setCouponError(`Minimum booking amount of ₹${cpData.minBookingAmount} required for this coupon.`);
        return;
      }

      setAppliedCoupon(cpData);
      setCouponSuccess(`Promo code ${cpData.code} applied successfully!`);
    } catch {
      setCouponError('Failed to validate coupon code.');
    }
  };

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'flat') {
      discountAmount = appliedCoupon.discountValue;
    } else {
      const pct = (basePrice * appliedCoupon.discountValue) / 100;
      discountAmount = appliedCoupon.maxDiscount ? Math.min(pct, appliedCoupon.maxDiscount) : pct;
    }
  }

  const taxableAmount = Math.max(0, basePrice - discountAmount);
  const taxes = Math.round((taxableAmount * policies.standardTaxPercent) / 100);
  const finalTotal = taxableAmount + taxes;

  // Final booking execution with Firestore Transaction
  const handleFinalBooking = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!primaryName.trim() || !guestEmail.trim()) {
      setErrorMsg('Please complete all guest details.');
      setStep(2);
      return;
    }

    setProcessing(true);
    setErrorMsg(null);

    const bookingNum = `ILN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // Execute booking transaction to prevent double booking
      await runTransaction(db, async (transaction) => {
        // If hotel room, verify room inventory
        if (type === 'hotel' && roomId) {
          const roomRef = doc(db, 'rooms', roomId);
          const roomDoc = await transaction.get(roomRef);
          if (roomDoc.exists()) {
            const currentInventory = roomDoc.data().totalInventory || 0;
            if (currentInventory < roomsCount) {
              throw new Error(
                `Inventory update alert: Only ${currentInventory} room(s) available. Please adjust your room count.`
              );
            }
            // Decrement inventory
            transaction.update(roomRef, {
              totalInventory: currentInventory - roomsCount,
            });
          }
        }

        const newBookingRef = doc(collection(db, 'bookings'));
        const bookingData: Booking = {
          id: newBookingRef.id,
          bookingNumber: bookingNum,
          type,
          userId: user.uid,
          userEmail: guestEmail,
          userName: primaryName,
          userPhone: guestPhone,
          hotelId: hotel?.id,
          roomId: room?.id,
          packageId: pkg?.id,
          serviceId: service?.id,
          itemTitle,
          itemImage,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          departureDate,
          nights,
          guestsCount,
          roomsCount,
          guestDetails: {
            primaryName,
            email: guestEmail,
            phone: guestPhone,
            specialRequests,
          },
          basePrice,
          taxes,
          discountAmount,
          couponCode: appliedCoupon?.code,
          totalAmount: finalTotal,
          paymentMode,
          paymentStatus: paymentMode === 'online' ? 'completed' : 'pending',
          bookingStatus: 'confirmed',
          agentId: pkg?.agentId,
          createdAt: new Date().toISOString(),
        };

        transaction.set(newBookingRef, bookingData);

        // Add in-app notification
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          userId: user.uid,
          title: 'Booking Confirmed!',
          message: `Your reservation ${bookingNum} for ${itemTitle} is confirmed.`,
          type: 'success',
          read: false,
          link: '/trips',
          createdAt: new Date().toISOString(),
        });

        setConfirmedBooking(bookingData);
      });

      setStep(5); // Confirmation Screen
    } catch (err: any) {
      setErrorMsg(err.message || 'Booking transaction failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const stepTitles = [
    'Summary',
    'Guest Details',
    'Price & Coupons',
    'Payment',
    'Confirmed',
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Step Indicator (BookMyShow clean card style) */}
        <div className="mb-8 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-orange-600 -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / (stepTitles.length - 1)) * 100}%` }}
            />

            {stepTitles.map((title, idx) => {
              const stepNumber = idx + 1;
              const isPassed = step > stepNumber;
              const isCurrent = step === stepNumber;

              return (
                <div key={title} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      isPassed
                        ? 'bg-orange-600 text-white'
                        : isCurrent
                        ? 'bg-slate-900 text-white ring-4 ring-orange-100'
                        : 'bg-white text-slate-400 border-2 border-slate-200'
                    }`}
                  >
                    {isPassed ? <Check className="w-4 h-4" /> : stepNumber}
                  </div>
                  <span
                    className={`hidden sm:block text-[11px] font-bold mt-2 ${
                      isCurrent ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Unverified Email Warning (Mandatory: Unverified users can browse but cannot book) */}
        {user && !isVerified && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <span>
                Your email is unverified. Please check your inbox or resend verification before finalizing booking.
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                await resendVerification();
                setVerificationSent(true);
              }}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer shrink-0"
            >
              {verificationSent ? 'Link Sent!' : 'Resend Verification'}
            </button>
          </div>
        )}

        {/* STEP 1: ITEM SELECTION SUMMARY */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">1. Review Reservation Details</h2>
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Step 1 of 4</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {itemImage && (
                <img
                  src={itemImage}
                  alt={itemTitle}
                  className="w-full sm:w-48 aspect-16/10 rounded-2xl object-cover"
                />
              )}
              <div className="flex-1 space-y-2">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                  {type}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{itemTitle}</h3>

                {room && (
                  <p className="text-xs text-slate-600">
                    <strong>Room Type:</strong> {room.name} ({room.bedType})
                  </p>
                )}

                {type === 'hotel' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-500 pt-2">
                    <div>
                      <span className="text-[10px] block font-bold text-slate-400">CHECK-IN</span>
                      <span className="font-semibold text-slate-800">{checkIn}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-bold text-slate-400">CHECK-OUT</span>
                      <span className="font-semibold text-slate-800">{checkOut}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-bold text-slate-400">STAY</span>
                      <span className="font-semibold text-slate-800">{nights} Night(s), {roomsCount} Room</span>
                    </div>
                  </div>
                ) : type === 'package' ? (
                  <div className="text-xs text-slate-500 pt-2">
                    <span className="text-[10px] block font-bold text-slate-400">DEPARTURE DATE</span>
                    <span className="font-semibold text-slate-800">{departureDate}</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 pt-2">
                    <span className="text-[10px] block font-bold text-slate-400">DATE</span>
                    <span className="font-semibold text-slate-800">{checkIn}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Guest Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GUEST DETAILS */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">2. Primary Guest Information</h2>
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Step 2 of 4</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={primaryName}
                  onChange={(e) => setPrimaryName(e.target.value)}
                  placeholder="e.g. Sahil Roy"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-[10px] text-slate-400">Voucher & invoice will be sent here</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-[10px] text-slate-400">For check-in updates and notifications</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Early check-in requested, high floor room, quiet corner..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!primaryName || !guestEmail) {
                    setErrorMsg('Please provide your name and email address.');
                    return;
                  }
                  setErrorMsg(null);
                  setStep(3);
                }}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Price Review</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PRICE REVIEW & PROMO CODE */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">3. Price Breakdown & Coupons</h2>
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Step 3 of 4</span>
            </div>

            {/* Promo Code Input */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-orange-600" />
                <span>Apply Promo Coupon</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME500, SUMMER2026"
                  className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {couponError && <p className="text-xs text-red-600 mt-2 font-medium">{couponError}</p>}
              {couponSuccess && <p className="text-xs text-emerald-600 mt-2 font-medium">{couponSuccess}</p>}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-600 pt-2">
              <div className="flex justify-between">
                <span>Base Fare</span>
                <span className="font-bold text-slate-900">
                  {policies.currencySymbol}{basePrice.toLocaleString()}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>- {policies.currencySymbol}{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>GST & Service Taxes ({policies.standardTaxPercent}%)</span>
                <span>{policies.currencySymbol}{taxes.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-base sm:text-lg font-black text-slate-900 pt-3 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="text-orange-600">
                  {policies.currencySymbol}{finalTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Payment</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PAYMENT ABSTRACTION */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">4. Select Payment Option</h2>
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Step 4 of 4</span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setPaymentMode('pay_later')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMode === 'pay_later'
                    ? 'border-orange-600 bg-orange-50/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-slate-900">Pay at Hotel / Pay Later</h3>
                  {paymentMode === 'pay_later' && <Check className="w-4 h-4 text-orange-600" />}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Reserve your room now with instant confirmation. Pay upon arrival via Cash, UPI, or Card.
                </p>
              </div>

              {featureFlags.enableOnlinePayment && (
                <div
                  onClick={() => setPaymentMode('online')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                    paymentMode === 'online'
                      ? 'border-orange-600 bg-orange-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">Pay Online</h3>
                      <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                        Demo Mode
                      </span>
                    </div>
                    {paymentMode === 'online' && <Check className="w-4 h-4 text-orange-600" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Simulate card or UPI payment. Structured for Razorpay / Stripe gateway integration.
                  </p>
                </div>
              )}
            </div>

            {/* Simulated Online Gateway Fields */}
            {paymentMode === 'online' && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <span>Simulated Card Payment Gateway</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="4242 •••• •••• 4242"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="12/28"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="•••"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Back
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={handleFinalBooking}
                className="px-8 py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                {processing ? (
                  <span>Securing Reservation...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirm & Book ({policies.currencySymbol}{finalTotal.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: BOOKING CONFIRMATION & VOUCHER */}
        {step === 5 && confirmedBooking && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8 animate-in fade-in duration-300">
            {/* Header Celebration */}
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Booking Confirmed!</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Your reservation is secured in the system. A confirmation voucher has been dispatched to{' '}
                <strong>{confirmedBooking.userEmail}</strong>.
              </p>
            </div>

            {/* Printable Voucher Card */}
            <div id="booking-voucher" className="border-2 border-dashed border-slate-200 rounded-3xl p-6 sm:p-8 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                    ILLUSION BOOKING ID
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                    {confirmedBooking.bookingNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Guaranteed at Property</span>
                </div>
              </div>

              {/* Voucher Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-b border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Guest</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{confirmedBooking.userName}</p>
                  <p className="text-slate-500">{confirmedBooking.userPhone}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Service Reserved</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{confirmedBooking.itemTitle}</p>
                  <p className="text-slate-500 capitalize">{confirmedBooking.type}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Dates / Check-In</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">
                    {confirmedBooking.checkInDate || confirmedBooking.departureDate}
                  </p>
                  {confirmedBooking.checkOutDate && (
                    <p className="text-slate-500">To {confirmedBooking.checkOutDate}</p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Amount & Status</span>
                  <p className="font-extrabold text-slate-900 text-base mt-0.5">
                    {policies.currencySymbol}{confirmedBooking.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-orange-600 font-semibold uppercase text-[10px]">
                    {confirmedBooking.paymentMode === 'pay_later' ? 'Pay upon arrival' : 'Paid Online'}
                  </p>
                </div>
              </div>

              {/* Bottom Instructions */}
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <p>
                  Please present a valid Government Photo ID at the time of check-in.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Voucher</span>
                  </button>
                  <Link
                    to="/trips"
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    <Luggage className="w-3.5 h-3.5" />
                    <span>View in My Trips</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};
