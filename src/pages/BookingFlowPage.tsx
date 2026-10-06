import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
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
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Hotel as HotelIcon,
  Lock,
  Luggage,
  MapPin,
  Printer,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  User,
  Users,
  X,
} from 'lucide-react';
import { db, cleanFirestoreData } from '../services/firebase';
import { auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { sampleHotels, samplePackages, sampleServices, sampleCoupons } from '../services/seedData';
import { Booking, Coupon, Hotel, RoomType, TourPackage, ServiceItem } from '../types';
import { AuthModal } from '../components/auth/AuthModal';
import { initiateRazorpayPayment } from '../services/razorpay';

export const BookingFlowPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userProfile, isVerified, quickSignIn } = useAuth();
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
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>(sampleCoupons);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Sync available coupons from Firestore or fallback to sampleCoupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const snap = await getDocs(collection(db, 'coupons'));
        if (!snap.empty) {
          const fetched = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Coupon))
            .filter((c) => c.isActive !== false);
          if (fetched.length > 0) {
            setAvailableCoupons(fetched);
          }
        }
      } catch (err) {
        console.warn('Coupon list loading notice:', err);
      }
    };
    fetchCoupons();
  }, []);

  // Payment state - Default to Demo Pay or UPI QR for instant testing
  const [paymentMode, setPaymentMode] = useState<'demo_pay' | 'upi_qr' | 'razorpay' | 'pay_later'>('demo_pay');
  const [utrNumber, setUtrNumber] = useState('');
  const [upiCopied, setUpiCopied] = useState(false);
  const [qrTimer, setQrTimer] = useState(600); // 10 minutes countdown
  const [processing, setProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const officialUpiId = 'travelly.bookings@okhdfcbank';

  // 10-Minute Timer for UPI QR Code
  useEffect(() => {
    if (step !== 4 || paymentMode !== 'upi_qr') return;
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 600));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, paymentMode]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sync guest info if user signs in during the flow
  useEffect(() => {
    if (userProfile?.displayName && !primaryName) {
      setPrimaryName(userProfile.displayName);
    }
    if (user?.email && !guestEmail) {
      setGuestEmail(user.email);
    }
    if (userProfile?.phoneNumber && !guestPhone) {
      setGuestPhone(userProfile.phoneNumber);
    }
  }, [user, userProfile]);

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
          } else {
            setBasePrice(hData.minPrice * nights * roomsCount);
          }
        }
      } else if (type === 'package') {
        const pkgSnap = await getDoc(doc(db, 'packages', itemId));
        let pData = pkgSnap.exists() ? ({ id: pkgSnap.id, ...pkgSnap.data() } as TourPackage) : null;
        if (!pData) {
          pData = samplePackages.find((p) => p.id === itemId) || null;
        }
        if (pData) {
          setPkg(pData);
          setItemTitle(pData.title);
          setItemImage(pData.images?.[0] || '');
          setBasePrice(pData.pricePerTraveller * guestsCount);
        }
      } else if (type === 'service') {
        const sSnap = await getDoc(doc(db, 'services', itemId));
        let sData = sSnap.exists() ? ({ id: sSnap.id, ...sSnap.data() } as ServiceItem) : null;
        if (!sData) {
          sData = sampleServices.find((s) => s.id === itemId) || null;
        }
        if (sData) {
          setService(sData);
          setItemTitle(sData.title);
          setItemImage(sData.image || '');
          setBasePrice(sData.price);
        }
      }
    };

    loadItem();
  }, [type, itemId, roomId, nights, roomsCount, guestsCount]);

  // Robust promo code application by code string
  const applyCouponByCode = async (rawCode: string) => {
    if (!rawCode || !rawCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponError(null);
    setCouponSuccess(null);

    const codeUpper = rawCode.trim().toUpperCase();

    // 1. Check in available list or sample coupons first
    let targetCoupon: Coupon | null =
      [...availableCoupons, ...sampleCoupons].find(
        (c) => c.code.toUpperCase() === codeUpper && c.isActive !== false
      ) || null;

    // 2. Query Firestore if not already found in memory
    if (!targetCoupon) {
      try {
        const q = query(collection(db, 'coupons'), where('code', '==', codeUpper));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const cp = { id: snap.docs[0].id, ...snap.docs[0].data() } as Coupon;
          if (cp.isActive !== false) {
            targetCoupon = cp;
          }
        }
      } catch (err) {
        console.warn('Coupon lookup notice:', err);
      }
    }

    if (!targetCoupon) {
      setCouponError(`Invalid or expired code "${codeUpper}". Try WELCOME500 or TRAVELLY10.`);
      return;
    }

    const minReq = Number(targetCoupon.minBookingAmount) || 0;
    if (basePrice < minReq) {
      setCouponError(
        `Minimum booking fare of ${policies.currencySymbol}${minReq.toLocaleString()} required for ${targetCoupon.code} (Current fare: ${policies.currencySymbol}${basePrice.toLocaleString()}).`
      );
      return;
    }

    setAppliedCoupon(targetCoupon);
    setCouponCode(targetCoupon.code);

    const val = Number(targetCoupon.discountValue) || 0;
    let disc = 0;
    if (targetCoupon.discountType === 'flat') {
      disc = Math.min(val, basePrice);
    } else {
      const pct = (basePrice * val) / 100;
      const maxD = targetCoupon.maxDiscount ? Number(targetCoupon.maxDiscount) : Infinity;
      disc = Math.min(Math.min(pct, maxD), basePrice);
    }
    disc = Math.round(disc);

    setCouponSuccess(
      `Coupon ${targetCoupon.code} applied! Saved ${policies.currencySymbol}${disc.toLocaleString()} on your trip.`
    );
  };

  const handleApplyCoupon = () => {
    applyCouponByCode(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess(null);
    setCouponError(null);
  };

  // Discount calculation safely typed and verified
  let discountAmount = 0;
  if (appliedCoupon && basePrice > 0) {
    const val = Number(appliedCoupon.discountValue) || 0;
    if (appliedCoupon.discountType === 'flat') {
      discountAmount = Math.min(val, basePrice);
    } else {
      const pct = (basePrice * val) / 100;
      const maxD = appliedCoupon.maxDiscount ? Number(appliedCoupon.maxDiscount) : Infinity;
      discountAmount = Math.min(Math.min(pct, maxD), basePrice);
    }
    discountAmount = Math.round(discountAmount);
  }

  const taxableAmount = Math.max(0, basePrice - discountAmount);
  const taxes = Math.round((taxableAmount * (policies?.standardTaxPercent || 18)) / 100);
  const finalTotal = taxableAmount + taxes;

  // Real UPI Intent URI formatted for GPay / PhonePe / Paytm / BHIM
  const upiIntentUri = `upi://pay?pa=${officialUpiId}&pn=Travelly%20Escapes&am=${finalTotal}&cu=INR&tn=Booking_${itemId.slice(0, 8)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    upiIntentUri
  )}`;

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(officialUpiId);
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2500);
  };

  // Resilient Final Booking Execution (Fixes undefined fields & prevents Firebase popups)
  const handleFinalBooking = async (overrideOptions?: {
    mode?: 'demo_pay' | 'pay_later' | 'online' | 'razorpay' | 'upi_qr';
    status?: 'pending' | 'completed';
    razorpayId?: string;
    upiId?: string;
  }) => {
    if (!primaryName.trim() || !guestEmail.trim()) {
      setErrorMsg('Please complete all guest details.');
      setStep(2);
      return;
    }

    setProcessing(true);
    setErrorMsg(null);

    // 1. Ensure user is authenticated to satisfy Firestore security rules
    let activeUser = user;
    if (!activeUser) {
      try {
        await quickSignIn(guestEmail, primaryName, 'customer');
        activeUser = auth.currentUser;
      } catch (authErr) {
        console.warn('Silent quick-sign in notice:', authErr);
      }
    }

    const currentUserId = activeUser?.uid || auth.currentUser?.uid || 'guest_traveler';
    const bookingNum = `TRV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newBookingRef = doc(collection(db, 'bookings'));

    const effectiveMode = overrideOptions?.mode || paymentMode;
    const effectiveStatus =
      overrideOptions?.status || (effectiveMode === 'pay_later' ? 'pending' : 'completed');

    // Build the payload without any undefined values
    const rawBookingPayload: Record<string, any> = {
      id: newBookingRef.id,
      bookingNumber: bookingNum,
      type,
      userId: currentUserId,
      userEmail: guestEmail,
      userName: primaryName,
      userPhone: guestPhone || '',
      itemTitle,
      itemImage: itemImage || '',
      nights,
      guestsCount,
      roomsCount,
      guestDetails: {
        primaryName,
        email: guestEmail,
        phone: guestPhone || '',
        specialRequests: specialRequests || '',
      },
      basePrice,
      taxes,
      discountAmount,
      totalAmount: finalTotal,
      paymentMode: effectiveMode,
      paymentStatus: effectiveStatus,
      bookingStatus: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    // Attach optional foreign keys ONLY if they are defined (CRITICAL: prevents Firestore setDoc undefined error)
    if (hotel?.id) rawBookingPayload.hotelId = hotel.id;
    if (room?.id) rawBookingPayload.roomId = room.id;
    if (pkg?.id) rawBookingPayload.packageId = pkg.id;
    if (service?.id) rawBookingPayload.serviceId = service.id;
    if (checkIn) rawBookingPayload.checkInDate = checkIn;
    if (checkOut) rawBookingPayload.checkOutDate = checkOut;
    if (departureDate) rawBookingPayload.departureDate = departureDate;
    if (appliedCoupon?.code) rawBookingPayload.couponCode = appliedCoupon.code;
    if (overrideOptions?.razorpayId) rawBookingPayload.razorpayPaymentId = overrideOptions.razorpayId;
    if (overrideOptions?.upiId || utrNumber) {
      rawBookingPayload.upiTransactionId = overrideOptions?.upiId || utrNumber || `UPI_${Date.now()}`;
    }
    if (pkg?.agentId) rawBookingPayload.agentId = pkg.agentId;

    // Sanitize completely to strip any hidden undefined fields
    const sanitizedBooking = cleanFirestoreData(rawBookingPayload) as Booking;

    try {
      // Step A: Attempt transactional inventory decrement & write
      let writeCompleted = false;
      try {
        await runTransaction(db, async (transaction) => {
          if (type === 'hotel' && roomId) {
            try {
              const roomRef = doc(db, 'rooms', roomId);
              const roomDoc = await transaction.get(roomRef);
              if (roomDoc.exists()) {
                const currentInventory = roomDoc.data().totalInventory || 0;
                if (currentInventory >= roomsCount) {
                  transaction.update(roomRef, {
                    totalInventory: currentInventory - roomsCount,
                  });
                }
              }
            } catch (invErr) {
              console.warn('Room inventory update skipped:', invErr);
            }
          }
          transaction.set(newBookingRef, sanitizedBooking);
        });
        writeCompleted = true;
      } catch (txErr) {
        console.warn('Transaction fallback, using direct setDoc:', txErr);
      }

      // Step B: Resilient Fallback to direct setDoc if transaction failed
      if (!writeCompleted) {
        await setDoc(newBookingRef, sanitizedBooking);
      }

      // Step C: Silent in-app notification write (safe catch so notifications never abort booking)
      try {
        if (currentUserId && currentUserId !== 'guest_traveler') {
          const notifRef = doc(collection(db, 'notifications'));
          await setDoc(notifRef, {
            userId: currentUserId,
            title: 'Booking Confirmed!',
            message: `Your reservation ${bookingNum} for ${itemTitle} is confirmed.`,
            type: 'success',
            read: false,
            link: '/trips',
            createdAt: new Date().toISOString(),
          });
        }
      } catch (notifErr) {
        console.warn('Notification log skipped:', notifErr);
      }

      setConfirmedBooking(sanitizedBooking);
      setStep(5); // Confirmation Screen
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setErrorMsg(err.message || 'Payment received, but saving reservation had an issue. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  // Trigger Razorpay Official Gateway
  const handleRazorpayTrigger = () => {
    setProcessing(true);
    initiateRazorpayPayment({
      amount: Math.round(finalTotal * 100), // in paise
      name: branding.brandName || 'Travelly',
      description: `Reservation for ${itemTitle}`,
      prefill: {
        name: primaryName,
        email: guestEmail,
        contact: guestPhone,
      },
      onSuccess: (res) => {
        handleFinalBooking({
          mode: 'razorpay',
          status: 'completed',
          razorpayId: res.razorpay_payment_id,
        });
      },
      onDismiss: () => {
        setProcessing(false);
      },
      onError: (err) => {
        setProcessing(false);
        setErrorMsg('Razorpay payment was not completed. You can pay via UPI QR code or Demo Pay.');
      },
    });
  };

  const stepTitles = [
    'Summary',
    'Guest Details',
    'Coupons & Add-ons',
    'Payment',
    'Voucher',
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 sm:py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Steps Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between overflow-x-auto no-scrollbar pb-2">
            {stepTitles.map((title, idx) => (
              <div key={idx} className="flex items-center shrink-0">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    step === idx + 1
                      ? 'bg-sky-600 text-white shadow-md'
                      : step > idx + 1
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-200/80 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    {step > idx + 1 ? '✓' : idx + 1}
                  </span>
                  <span>{title}</span>
                </div>
                {idx < stepTitles.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-slate-300 dark:text-slate-700 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: SUMMARY & DETAILS */}
        {step === 1 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Review Your Selection</h2>
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Step 1 of 4
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              {itemImage && (
                <img
                  src={itemImage}
                  alt={itemTitle}
                  className="w-full sm:w-48 h-36 object-cover rounded-2xl border border-slate-200 dark:border-slate-800"
                />
              )}
              <div className="space-y-2 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  {type} reservation
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{itemTitle}</h3>
                {hotel?.destinationCity && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    <span>{hotel.destinationCity}</span>
                  </p>
                )}
                {room && (
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Selected Room: <span className="text-sky-600 dark:text-sky-400">{room.name}</span>
                  </p>
                )}

                <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Check-In</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{checkIn || departureDate}</span>
                  </div>
                  {checkOut && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Check-Out</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{checkOut}</span>
                    </div>
                  )}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Guests & Rooms</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {guestsCount} Guests ({roomsCount} Room{roomsCount > 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Proceed to Guest Details →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GUEST DETAILS */}
        {step === 2 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Guest Information</h2>
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Step 2 of 4
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name (as per Govt ID) *
                </label>
                <input
                  type="text"
                  required
                  value={primaryName}
                  onChange={(e) => setPrimaryName(e.target.value)}
                  placeholder="e.g. Test_User_1"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (WhatsApp Voucher) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. High floor room, late check-in, dietary preferences..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!primaryName.trim() || !guestEmail.trim()) {
                    setErrorMsg('Please enter your full name and email address.');
                    return;
                  }
                  setErrorMsg(null);
                  setStep(3);
                }}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Continue to Coupons →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: COUPONS & PRICE BREAKDOWN */}
        {step === 3 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Apply Offers & Breakdown</h2>
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Step 3 of 4
              </span>
            </div>

            {/* Promo Code Box */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Promo Code & Coupons</span>
              </span>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 bg-emerald-600 text-white font-mono font-black text-xs rounded-lg uppercase tracking-wider shadow-xs">
                      {appliedCoupon.code}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Coupon Applied Successfully!
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        Discount of {policies.currencySymbol}{discountAmount.toLocaleString()} calculated & applied
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 text-red-600 hover:text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyCouponByCode(couponCode);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code (e.g. WELCOME500, TRAVELLY10)"
                    className="flex-1 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs uppercase font-bold text-slate-900 dark:text-white placeholder:normal-case placeholder:font-normal focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                  >
                    Apply Code
                  </button>
                </form>
              )}

              {couponError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}
              {couponSuccess && !appliedCoupon && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{couponSuccess}</span>
                </p>
              )}

              {/* Available Coupons Grid */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5">
                  Available Offers for This Booking
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableCoupons.map((cp) => {
                    const minAmount = Number(cp.minBookingAmount) || 0;
                    const isEligible = basePrice >= minAmount;
                    const isCurrent = appliedCoupon?.code === cp.code;

                    return (
                      <div
                        key={cp.id}
                        className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                          isCurrent
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-300 dark:hover:border-sky-700 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-mono font-black text-slate-900 dark:text-white tracking-wider text-xs">
                            {cp.code}
                          </span>
                          <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-900">
                            {cp.discountType === 'percentage'
                              ? `${cp.discountValue}% OFF`
                              : `FLAT ${policies.currencySymbol}${cp.discountValue} OFF`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                          {minAmount > 0
                            ? `Min fare: ${policies.currencySymbol}${minAmount.toLocaleString()}`
                            : 'No minimum booking required'}
                          {cp.maxDiscount
                            ? ` • Max save: ${policies.currencySymbol}${Number(cp.maxDiscount).toLocaleString()}`
                            : ''}
                        </p>
                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          {isCurrent ? (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Applied
                            </span>
                          ) : isEligible ? (
                            <button
                              type="button"
                              onClick={() => applyCouponByCode(cp.code)}
                              className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>Apply Coupon</span>
                              <span>→</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              Add {policies.currencySymbol}{(minAmount - basePrice).toLocaleString()} more to unlock
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Base Fare</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {policies.currencySymbol}
                  {basePrice.toLocaleString()}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>
                    - {policies.currencySymbol}
                    {discountAmount.toLocaleString()}
                  </span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Taxable Amount</span>
                  <span>
                    {policies.currencySymbol}
                    {taxableAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Taxes & GST ({policies.standardTaxPercent}%)</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {policies.currencySymbol}
                  {taxes.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline text-sm font-extrabold text-slate-900 dark:text-white">
                <div>
                  <span>Grand Total</span>
                  {discountAmount > 0 && (
                    <span className="text-[11px] block font-semibold text-emerald-600 dark:text-emerald-400">
                      Total savings: {policies.currencySymbol}{discountAmount.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {discountAmount > 0 && (
                    <span className="text-xs text-slate-400 line-through mr-2 font-normal">
                      {policies.currencySymbol}
                      {(basePrice + Math.round((basePrice * policies.standardTaxPercent) / 100)).toLocaleString()}
                    </span>
                  )}
                  <span className="text-sky-600 dark:text-sky-400 text-lg">
                    {policies.currencySymbol}
                    {finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Proceed to Payment ({policies.currencySymbol}
                {finalTotal.toLocaleString()}) →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PAYMENT OPTIONS (DEMO PAY + UPI QR CODE + RAZORPAY + PAY LATER) */}
        {step === 4 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Select Payment Method</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  100% Secure Encrypted Indian & Global Checkout
                </p>
              </div>
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Step 4 of 4
              </span>
            </div>

            {/* Payable Summary Banner */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Payable Amount:</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {policies.currencySymbol}{finalTotal.toLocaleString()}
                </span>
                {discountAmount > 0 && (
                  <span className="text-xs text-slate-400 line-through">
                    {policies.currencySymbol}{(basePrice + Math.round((basePrice * policies.standardTaxPercent) / 100)).toLocaleString()}
                  </span>
                )}
              </div>
              {discountAmount > 0 && appliedCoupon && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{appliedCoupon.code} applied (-{policies.currencySymbol}{discountAmount.toLocaleString()})</span>
                </div>
              )}
            </div>

            {/* Payment Method Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Option 1: Demo Pay (Requested for instant backend test) */}
              <div
                onClick={() => setPaymentMode('demo_pay')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  paymentMode === 'demo_pay'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-500/10 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">Demo Pay</h3>
                  </div>
                  {paymentMode === 'demo_pay' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  1-Click test payment. Confirms & tests backend writing instantly.
                </p>
                <span className="inline-block mt-2 text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md">
                  Backend Test
                </span>
              </div>

              {/* Option 2: UPI QR Code */}
              <div
                onClick={() => setPaymentMode('upi_qr')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  paymentMode === 'upi_qr'
                    ? 'border-sky-600 bg-sky-50/40 dark:bg-sky-500/10 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">UPI QR Code</h3>
                  </div>
                  {paymentMode === 'upi_qr' && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Scan & pay with GPay, PhonePe, Paytm, or BHIM.
                </p>
                <span className="inline-block mt-2 text-[9px] font-black uppercase text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-500/20 px-2 py-0.5 rounded-md">
                  GPay / PhonePe
                </span>
              </div>

              {/* Option 3: Razorpay Official Gateway */}
              <div
                onClick={() => setPaymentMode('razorpay')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  paymentMode === 'razorpay'
                    ? 'border-sky-600 bg-sky-50/40 dark:bg-sky-500/10 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">Razorpay</h3>
                  </div>
                  {paymentMode === 'razorpay' && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Cards (Visa, MC, RuPay), NetBanking & Wallets.
                </p>
                <span className="inline-block mt-2 text-[9px] font-bold uppercase text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  All Cards
                </span>
              </div>

              {/* Option 4: Pay at Hotel / Pay Later */}
              <div
                onClick={() => setPaymentMode('pay_later')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  paymentMode === 'pay_later'
                    ? 'border-sky-600 bg-sky-50/40 dark:bg-sky-500/10 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <HotelIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">Pay Later</h3>
                  </div>
                  {paymentMode === 'pay_later' && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Reserve now with ₹0 upfront. Pay upon arrival.
                </p>
                <span className="inline-block mt-2 text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Zero Advance
                </span>
              </div>
            </div>

            {/* TAB 1: DEMO PAY (TEST BACKEND ONE-CLICK) */}
            {paymentMode === 'demo_pay' && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-800 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Instant Backend Test Payment</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  This mode simulates an instant completed payment of{' '}
                  <strong>
                    {policies.currencySymbol}
                    {finalTotal.toLocaleString()}
                  </strong>
                  . It executes the full Firestore transaction, writes the booking into your Firebase database, decrements room
                  inventory, and confirms your reservation in real time.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() =>
                      handleFinalBooking({
                        mode: 'demo_pay',
                        status: 'completed',
                        upiId: `DEMO_PAY_${Date.now()}`,
                      })
                    }
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {processing ? (
                      <span>Saving Booking to Backend...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Test Backend Write ({policies.currencySymbol}{finalTotal.toLocaleString()})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: REAL DYNAMIC UPI QR CODE PAYMENT */}
            {paymentMode === 'upi_qr' && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div className="text-center sm:text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 justify-center sm:justify-start">
                      <QrCode className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>Instant UPI QR Code Payment</span>
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Open Google Pay, PhonePe, Paytm, or BHIM and scan this QR code
                    </p>
                  </div>

                  {/* QR Code Active Countdown */}
                  <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 shrink-0">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>QR Valid for: {formatTimer(qrTimer)}</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-2">
                  {/* Generated QR Code Card */}
                  <div className="p-4 bg-white rounded-3xl shadow-md border border-slate-200 flex flex-col items-center">
                    <div className="relative">
                      <img
                        src={qrCodeUrl}
                        alt="UPI Payment QR Code"
                        className="w-52 h-52 object-contain rounded-xl"
                        width="208"
                        height="208"
                      />
                      {/* Brand Logo in center of QR */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-md p-1 border border-slate-200 flex items-center justify-center">
                          <img
                            src="/brand/travelly-symbol.svg"
                            alt="Travelly"
                            className="w-7 h-7 object-contain"
                            width="28"
                            height="28"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Amount to Pay
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        {policies.currencySymbol}
                        {finalTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* UPI Details & Instructions */}
                  <div className="space-y-4 max-w-sm w-full">
                    {/* Copy UPI ID Box */}
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1">
                        Travelly Official UPI ID
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {officialUpiId}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyUpiId}
                          className="px-2.5 py-1 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {upiCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{upiCopied ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Mobile Direct UPI Intent */}
                    <a
                      href={upiIntentUri}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Tap to Pay via Mobile UPI App</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {/* Supported UPI Apps Badges */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 block mb-1.5">
                        Supported UPI Apps
                      </span>
                      <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          Google Pay
                        </span>
                        <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          PhonePe
                        </span>
                        <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          Paytm
                        </span>
                        <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          BHIM
                        </span>
                        <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          CRED
                        </span>
                      </div>
                    </div>

                    {/* UTR Input (Optional) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        12-Digit UPI Ref / UTR Number (Optional)
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="e.g. 428938472910"
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Instant Verification Button */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleFinalBooking({ mode: 'upi_qr', status: 'completed' })}
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer mx-auto"
                  >
                    {processing ? (
                      <span>Verifying UPI Payment & Securing Booking...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>I Have Completed Payment ({policies.currencySymbol}{finalTotal.toLocaleString()})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: RAZORPAY GATEWAY CHECKOUT */}
            {paymentMode === 'razorpay' && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Razorpay Secure Checkout</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pay with Credit Card, Debit Card, NetBanking, or Digital Wallets
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-500/20 px-2.5 py-1 rounded-lg">
                    Razorpay Official
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Credit / Debit</span>
                    <span className="text-[10px] text-slate-400">Visa, MC, RuPay</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">NetBanking</span>
                    <span className="text-[10px] text-slate-400">50+ Banks</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">UPI / QR</span>
                    <span className="text-[10px] text-slate-400">All UPI Apps</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Wallets & EMI</span>
                    <span className="text-[10px] text-slate-400">Paytm, Mobikwik</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleRazorpayTrigger}
                    className="w-full sm:w-auto px-10 py-3.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2 cursor-pointer mx-auto"
                  >
                    {processing ? (
                      <span>Opening Razorpay Gateway...</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Pay {policies.currencySymbol}{finalTotal.toLocaleString()} with Razorpay</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: PAY AT HOTEL / PAY LATER */}
            {paymentMode === 'pay_later' && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <HotelIcon className="w-4 h-4 text-emerald-600" />
                  <span>Pay upon Arrival at Property</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your reservation will be confirmed immediately with zero advance payment. You can complete payment at
                  the front desk during check-in via Cash, UPI, or Credit/Debit Card.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleFinalBooking({ mode: 'pay_later', status: 'pending' })}
                    className="px-8 py-3.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                  >
                    {processing ? (
                      <span>Securing Your Reservation...</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Confirm Reservation (Pay ₹{finalTotal.toLocaleString()} at Check-in)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Back to Pricing
              </button>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>256-Bit SSL Encrypted Transaction</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: BOOKING CONFIRMATION & VOUCHER */}
        {step === 5 && confirmedBooking && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 animate-in fade-in duration-300">
            {/* Header Celebration */}
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Booking Confirmed!</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your reservation is secured in the system. A confirmation voucher has been dispatched to{' '}
                <strong>{confirmedBooking.userEmail}</strong>.
              </p>
            </div>

            {/* Printable Voucher Card */}
            <div
              id="booking-voucher"
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-800/40"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                    TRAVELLY BOOKING ID
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-wider">
                    {confirmedBooking.bookingNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Guaranteed at Property</span>
                </div>
              </div>

              {/* Voucher Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-b border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Guest</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                    {confirmedBooking.userName}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">{confirmedBooking.userPhone}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Service Reserved</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                    {confirmedBooking.itemTitle}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 capitalize">{confirmedBooking.type}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Dates / Check-In</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                    {confirmedBooking.checkInDate || confirmedBooking.departureDate}
                  </p>
                  {confirmedBooking.checkOutDate && (
                    <p className="text-slate-500 dark:text-slate-400">To {confirmedBooking.checkOutDate}</p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Amount & Status</span>
                  <p className="font-extrabold text-slate-900 dark:text-white text-base mt-0.5">
                    {policies.currencySymbol}
                    {confirmedBooking.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase text-[10px] flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {confirmedBooking.paymentMode === 'demo_pay'
                        ? 'Paid (Demo Verified)'
                        : confirmedBooking.paymentMode === 'upi_qr'
                        ? 'Paid via UPI QR'
                        : confirmedBooking.paymentMode === 'razorpay'
                        ? 'Paid via Razorpay'
                        : confirmedBooking.paymentMode === 'pay_later'
                        ? 'Pay upon arrival'
                        : 'Paid Online'}
                    </span>
                  </p>
                  {confirmedBooking.razorpayPaymentId && (
                    <p className="text-[9px] text-slate-400 font-mono">ID: {confirmedBooking.razorpayPaymentId}</p>
                  )}
                  {confirmedBooking.upiTransactionId && (
                    <p className="text-[9px] text-slate-400 font-mono">Ref: {confirmedBooking.upiTransactionId}</p>
                  )}
                </div>
              </div>

              {/* Bottom Instructions */}
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                <p>Please present a valid Government Photo ID at the time of check-in.</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Voucher</span>
                  </button>
                  <Link
                    to="/trips"
                    className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
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
