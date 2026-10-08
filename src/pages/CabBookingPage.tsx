import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Baby,
  Briefcase,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Filter,
  Info,
  MapPin,
  Navigation,
  Phone,
  Plane,
  Plus,
  QrCode,
  Shield,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  User,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { CabLocationInput } from '../components/cab/CabLocationInput';
import { AuthModal } from '../components/auth/AuthModal';
import {
  CabBooking,
  CabPaymentMode,
  CabTripType,
  CabVehicle,
  CabVehicleType,
  FareBreakdown,
  FareCalculationInput,
  RentalPackage,
} from '../types/cab';
import {
  createCabBookingInDb,
  estimateDistanceAndDuration,
  getActiveFareConfig,
  getAvailableCabVehicles,
  sampleCabVehicles,
} from '../services/cabService';
import { calculateFare } from '../services/cabFareEngine';
import { defaultFareConfig } from '../services/defaultCabFareConfig';
import { sampleCoupons } from '../services/seedData';
import { Coupon } from '../types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const VEHICLE_META: Record<
  CabVehicleType,
  {
    title: string;
    description: string;
    image: string;
    seats: number;
    luggage: number;
    etaMinutes: number;
    availableNearby: number;
  }
> = {
  hatchback: {
    title: 'Hatchback',
    description: 'WagonR, Swift, Tiago • Affordable daily commute',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    seats: 4,
    luggage: 2,
    etaMinutes: 3,
    availableNearby: 6,
  },
  sedan: {
    title: 'Sedan',
    description: 'Dzire, Etios, Aura • Extra legroom & quiet ride',
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=80',
    seats: 4,
    luggage: 3,
    etaMinutes: 5,
    availableNearby: 8,
  },
  suv: {
    title: 'SUV',
    description: 'Ertiga, Carens, Triber • 6 seats for family & bags',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    seats: 6,
    luggage: 4,
    etaMinutes: 7,
    availableNearby: 4,
  },
  premium_suv: {
    title: 'Premium SUV',
    description: 'Innova Crysta, Hycross • Top-tier comfort & VIP travel',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    seats: 7,
    luggage: 5,
    etaMinutes: 9,
    availableNearby: 3,
  },
  tempo_traveller: {
    title: 'Tempo Traveller',
    description: 'Force Urbania 12-16 Seater • Big groups & corporate',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    seats: 12,
    luggage: 10,
    etaMinutes: 14,
    availableNearby: 2,
  },
};

export const CabBookingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { policies, branding } = useSettings();

  // Active step (1 to 6)
  const [step, setStep] = useState<number>(() => {
    const s = Number(searchParams.get('step'));
    return s >= 1 && s <= 6 ? s : 1;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // ----------------------------------------------------
  // STEP 1: Search Parameters
  // ----------------------------------------------------
  const [tripType, setTripType] = useState<CabTripType>(
    (searchParams.get('tripType') as CabTripType) || 'point_to_point'
  );
  const [pickup, setPickup] = useState(searchParams.get('pickup') || 'Connaught Place, New Delhi');
  const [drop, setDrop] = useState(
    searchParams.get('drop') || 'Indira Gandhi International Airport (DEL)'
  );
  const [isImmediate, setIsImmediate] = useState(searchParams.get('immediate') !== 'false');
  const [pickupDate, setPickupDate] = useState(() => {
    return searchParams.get('date') || new Date().toISOString().split('T')[0];
  });
  const [pickupTime, setPickupTime] = useState(() => {
    if (searchParams.get('time')) return searchParams.get('time')!;
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d.toTimeString().slice(0, 5);
  });
  const [returnDate, setReturnDate] = useState(() => {
    if (searchParams.get('returnDate')) return searchParams.get('returnDate')!;
    const tom = new Date();
    tom.setDate(tom.getDate() + 2);
    return tom.toISOString().split('T')[0];
  });
  const [passengersCount, setPassengersCount] = useState(
    Number(searchParams.get('passengers') || 2)
  );
  const [luggageCount, setLuggageCount] = useState(Number(searchParams.get('luggage') || 1));
  const [rentalPackageId, setRentalPackageId] = useState(
    searchParams.get('packageId') || '8hr_80km'
  );

  // ----------------------------------------------------
  // STEP 2: Vehicle Selection & Sort/Filter
  // ----------------------------------------------------
  const [selectedVehicleType, setSelectedVehicleType] = useState<CabVehicleType>(
    (searchParams.get('vehicle') as CabVehicleType) || 'sedan'
  );
  const [vehicleSortBy, setVehicleSortBy] = useState<'price_asc' | 'capacity_desc' | 'eta_asc'>(
    'price_asc'
  );
  const [vehicleFilterCapacity, setVehicleFilterCapacity] = useState<number>(0);

  // ----------------------------------------------------
  // STEP 3: Details & Add-ons
  // ----------------------------------------------------
  const [customerName, setCustomerName] = useState(
    userProfile?.displayName || user?.displayName || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    userProfile?.phoneNumber || '+91 98765 43210'
  );
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [flightNumber, setFlightNumber] = useState(searchParams.get('flight') || '');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [extraStops, setExtraStops] = useState<string[]>([]);
  const [newStopInput, setNewStopInput] = useState('');
  const [showAddStop, setShowAddStop] = useState(false);

  // Add-ons
  const [addOnChildSeat, setAddOnChildSeat] = useState(false);
  const [addOnCarrier, setAddOnCarrier] = useState(false);
  const [addOnPet, setAddOnPet] = useState(false);

  // ----------------------------------------------------
  // STEP 4: Fare Engine & Coupons
  // ----------------------------------------------------
  const [fareConfig, setFareConfig] = useState(defaultFareConfig);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>(sampleCoupons);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // ----------------------------------------------------
  // STEP 5: Payment Abstraction
  // ----------------------------------------------------
  const [paymentMode, setPaymentMode] = useState<CabPaymentMode>('pay_now');
  const [paymentSubMode, setPaymentSubMode] = useState<'demo_pay' | 'upi_qr'>('demo_pay');
  const [qrTimer, setQrTimer] = useState(600);
  const [processingBooking, setProcessingBooking] = useState(false);

  // ----------------------------------------------------
  // STEP 6: Confirmed Booking Result
  // ----------------------------------------------------
  const [confirmedBooking, setConfirmedBooking] = useState<CabBooking | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Load fare config from db
  useEffect(() => {
    getActiveFareConfig().then((cfg) => setFareConfig(cfg));
  }, []);

  // Fetch available coupons
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
        console.warn('Coupons fetch notice:', err);
      }
    };
    fetchCoupons();
  }, []);

  // Auto-fill user contact info if available
  useEffect(() => {
    if (userProfile?.displayName && !customerName) {
      setCustomerName(userProfile.displayName);
    }
    if (user?.email && !customerEmail) {
      setCustomerEmail(user.email);
    }
    if (userProfile?.phoneNumber && customerPhone === '+91 98765 43210') {
      setCustomerPhone(userProfile.phoneNumber);
    }
  }, [user, userProfile]);

  // Sync URL params
  const updateQueryParams = (updates: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        newParams.set(k, String(v));
      } else {
        newParams.delete(k);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  // Timer for UPI QR
  useEffect(() => {
    if (step === 5 && paymentSubMode === 'upi_qr') {
      const interval = setInterval(() => {
        setQrTimer((p) => (p > 0 ? p - 1 : 600));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, paymentSubMode]);

  // Distance & duration estimation based on pickup and drop
  const routeEstimate = useMemo(() => {
    return estimateDistanceAndDuration(pickup, drop, tripType);
  }, [pickup, drop, tripType]);

  // Calculate live fare breakdown for ANY vehicle type
  const getFareForVehicle = (vType: CabVehicleType): FareBreakdown => {
    const pickupDateTimeISO = isImmediate
      ? new Date().toISOString()
      : `${pickupDate}T${pickupTime}:00`;

    const input: FareCalculationInput = {
      tripType,
      vehicleType: vType,
      distanceKm: routeEstimate.distanceKm,
      durationMinutes: routeEstimate.durationMinutes,
      pickupDateTime: pickupDateTimeISO,
      returnDateTime:
        tripType === 'outstation_round_trip' ? `${returnDate}T20:00:00` : undefined,
      rentalPackageId: tripType === 'rental' ? rentalPackageId : undefined,
      addOns: {
        childSeat: addOnChildSeat,
        luggageCarrier: addOnCarrier,
        petFriendly: addOnPet,
      },
      couponDiscountValue: appliedCoupon
        ? Number(appliedCoupon.discountValue)
        : undefined,
      couponType: appliedCoupon?.discountType === 'percentage' ? 'percentage' : 'flat',
      couponMaxDiscount: appliedCoupon?.maxDiscount
        ? Number(appliedCoupon.maxDiscount)
        : undefined,
    };

    return calculateFare(input, fareConfig);
  };

  // Current selected vehicle's active fare breakdown
  const currentFareBreakdown = useMemo(() => {
    return getFareForVehicle(selectedVehicleType);
  }, [
    selectedVehicleType,
    tripType,
    routeEstimate,
    isImmediate,
    pickupDate,
    pickupTime,
    returnDate,
    rentalPackageId,
    addOnChildSeat,
    addOnCarrier,
    addOnPet,
    appliedCoupon,
    fareConfig,
  ]);

  // Coupon application logic
  const handleApplyCoupon = (codeToApply: string) => {
    if (!codeToApply.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponError(null);
    setCouponSuccess(null);

    const upper = codeToApply.trim().toUpperCase();
    const found = [...availableCoupons, ...sampleCoupons].find(
      (c) => c.code.toUpperCase() === upper && c.isActive !== false
    );

    if (!found) {
      setCouponError(`Invalid coupon "${upper}". Try WELCOME500 or TRAVELLY10.`);
      return;
    }

    const minAmount = Number(found.minBookingAmount) || 0;
    if (currentFareBreakdown.subtotal < minAmount) {
      setCouponError(
        `Minimum fare of ${policies.currencySymbol}${minAmount} required for coupon ${found.code}.`
      );
      return;
    }

    setAppliedCoupon(found);
    setCouponCode(found.code);
    setCouponSuccess(`Applied coupon ${found.code}! Discount added to your trip.`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess(null);
    setCouponError(null);
  };

  // Available vehicles list with estimated fares
  const vehicleCards = useMemo(() => {
    const list = (Object.keys(VEHICLE_META) as CabVehicleType[]).map((vType) => {
      const meta = VEHICLE_META[vType];
      const fare = getFareForVehicle(vType);
      return {
        vehicleType: vType,
        ...meta,
        fare,
      };
    });

    // Filtering
    let filtered = list;
    if (vehicleFilterCapacity > 0) {
      filtered = filtered.filter((v) => v.seats >= vehicleFilterCapacity);
    }

    // Sorting
    if (vehicleSortBy === 'price_asc') {
      filtered.sort((a, b) => a.fare.finalTotal - b.fare.finalTotal);
    } else if (vehicleSortBy === 'capacity_desc') {
      filtered.sort((a, b) => b.seats - a.seats);
    } else if (vehicleSortBy === 'eta_asc') {
      filtered.sort((a, b) => a.etaMinutes - b.etaMinutes);
    }

    return filtered;
  }, [
    tripType,
    routeEstimate,
    isImmediate,
    pickupDate,
    pickupTime,
    returnDate,
    rentalPackageId,
    addOnChildSeat,
    addOnCarrier,
    addOnPet,
    appliedCoupon,
    fareConfig,
    vehicleSortBy,
    vehicleFilterCapacity,
  ]);

  // Handle final booking confirmation
  const handleConfirmAndPay = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setProcessingBooking(true);
    try {
      // 4-digit start OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const bookingNumber = `CAB-${Date.now().toString().slice(-6)}`;
      const pickupDateTimeISO = isImmediate
        ? new Date().toISOString()
        : `${pickupDate}T${pickupTime}:00`;

      // Assign realistic demo driver & vehicle
      const assignedDriver =
        selectedVehicleType === 'tempo_traveller'
          ? { name: 'Vikram Singh', phone: '+91 97188 99001', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' }
          : selectedVehicleType === 'suv' || selectedVehicleType === 'premium_suv'
          ? { name: 'Amit Sharma', phone: '+91 98112 34567', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' }
          : { name: 'Rajesh Kumar', phone: '+91 98765 43210', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' };

      const assignedVeh = sampleCabVehicles.find((v) => v.vehicleType === selectedVehicleType) || sampleCabVehicles[1];

      const newBookingData = {
        bookingNumber,
        userId: user.uid,
        customerName: customerName || user.displayName || 'Customer',
        customerPhone: customerPhone || '+91 98765 43210',
        customerEmail: customerEmail || user.email || '',
        tripType,
        vehicleType: selectedVehicleType,
        pickupAddress: pickup,
        dropAddress: drop,
        extraStops: extraStops.map((s) => ({ address: s })),
        pickupDateTime: pickupDateTimeISO,
        returnDateTime: tripType === 'outstation_round_trip' ? `${returnDate}T20:00:00` : undefined,
        isImmediate,
        passengersCount,
        luggageCount,
        flightNumber: flightNumber || undefined,
        specialInstructions: specialInstructions || undefined,
        addOns: {
          childSeat: addOnChildSeat,
          luggageCarrier: addOnCarrier,
          petFriendly: addOnPet,
        },
        otp,
        status: 'driver_assigned' as const,
        statusHistory: [
          {
            status: 'requested' as const,
            timestamp: new Date().toISOString(),
            actorUid: user.uid,
            actorRole: 'customer' as const,
          },
          {
            status: 'driver_assigned' as const,
            timestamp: new Date().toISOString(),
            actorUid: 'system',
            actorRole: 'system' as const,
            note: `Auto-dispatched nearest verified ${assignedVeh.model}`,
          },
        ],
        driverId: 'driver-rajesh-1',
        driverName: assignedDriver.name,
        driverPhone: assignedDriver.phone,
        driverPhotoUrl: assignedDriver.photo,
        vehicleId: assignedVeh.id,
        vehicleRegistrationNumber: assignedVeh.registrationNumber,
        vehicleModel: assignedVeh.model,
        fareBreakdown: currentFareBreakdown,
        fareConfigVersion: fareConfig.version || 'v1.0',
        paymentMode,
        paymentStatus:
          paymentMode === 'pay_now'
            ? ('paid' as const)
            : paymentMode === 'advance_20'
            ? ('advance_paid' as const)
            : ('pending' as const),
        advancePaidAmount:
          paymentMode === 'advance_20'
            ? currentFareBreakdown.advanceAmount
            : paymentMode === 'pay_now'
            ? currentFareBreakdown.finalTotal
            : 0,
        balanceDue:
          paymentMode === 'advance_20'
            ? currentFareBreakdown.remainingAmount
            : paymentMode === 'pay_to_driver'
            ? currentFareBreakdown.finalTotal
            : 0,
      };

      const created = await createCabBookingInDb(newBookingData);
      setConfirmedBooking(created);
      setStep(6);
      updateQueryParams({ step: 6, bookingId: created.id });
    } catch (err) {
      console.error('Cab booking creation failed:', err);
      alert('Could not complete booking. Please try again.');
    } finally {
      setProcessingBooking(false);
    }
  };

  // Add extra stop
  const handleAddStop = () => {
    if (newStopInput.trim() && extraStops.length < 3) {
      setExtraStops([...extraStops, newStopInput.trim()]);
      setNewStopInput('');
      setShowAddStop(false);
    }
  };

  const handleRemoveStop = (idx: number) => {
    setExtraStops(extraStops.filter((_, i) => i !== idx));
  };

  const stepTitles = [
    'Search Ride',
    'Select Vehicle',
    'Passenger Details',
    'Fare Review',
    'Payment',
    'Voucher & OTP',
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-24 transition-colors">
      {/* Top Banner & Stepper Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-14 sm:top-20 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-sky-500" />
                  <span>Cab & Mobility Booking</span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Step {step} of 6 • {stepTitles[step - 1]}
                </p>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="hidden md:flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s
                        ? 'bg-sky-600 text-white ring-4 ring-sky-500/20'
                        : step > s
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 6 && (
                    <div
                      className={`w-4 h-0.5 ${
                        step > s ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 sm:pt-8">
        {/* ========================================================= */}
        {/* STEP 1: SEARCH & TRIP TYPE                                */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Trip Type Selector Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 sm:p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'point_to_point', label: 'Local City', icon: Car, desc: 'Point to Point' },
                  { id: 'airport', label: 'Airport', icon: Plane, desc: 'Flat Zone Rates' },
                  { id: 'rental', label: 'Rental', icon: Clock, desc: 'Hourly Packages' },
                  {
                    id: 'outstation_one_way',
                    label: 'Outstation',
                    icon: Navigation,
                    desc: 'One-Way / Round',
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive =
                    tripType === tab.id ||
                    (tab.id === 'outstation_one_way' && tripType === 'outstation_round_trip');

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setTripType(tab.id as CabTripType);
                        updateQueryParams({ tripType: tab.id });
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition cursor-pointer ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold leading-tight">{tab.label}</span>
                      <span
                        className={`text-[10px] leading-tight ${
                          isActive ? 'text-sky-100' : 'text-slate-400'
                        }`}
                      >
                        {tab.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-selector for Outstation: One-Way vs Round-Trip */}
              {(tripType === 'outstation_one_way' || tripType === 'outstation_round_trip') && (
                <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTripType('outstation_one_way')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      tripType === 'outstation_one_way'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    One-Way Outstation
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType('outstation_round_trip')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      tripType === 'outstation_round_trip'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Round-Trip (Return Cab)
                  </button>
                </div>
              )}
            </div>

            {/* Main Search Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              {/* Immediate vs Schedule Later */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Booking Schedule:
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsImmediate(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isImmediate
                        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Book Now (Instant)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsImmediate(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      !isImmediate
                        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Schedule Later
                  </button>
                </div>
              </div>

              {/* Pickup & Drop Inputs with Google Places / Fallback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CabLocationInput
                  label="Pickup Location"
                  value={pickup}
                  onChange={(val) => setPickup(val)}
                  placeholder="e.g. Connaught Place, Hotel Oberoi, DEL Terminal 3"
                  isPickup={true}
                  required
                />
                <CabLocationInput
                  label={tripType === 'rental' ? 'City / Base Hub' : 'Drop Destination'}
                  value={drop}
                  onChange={(val) => setDrop(val)}
                  placeholder={
                    tripType === 'rental'
                      ? 'e.g. Delhi NCR local usage'
                      : 'e.g. Cyber City Gurgaon, Jaipur Mall'
                  }
                  isPickup={false}
                  required
                />
              </div>

              {/* Extra stops if any */}
              {extraStops.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Via Stops:
                  </span>
                  {extraStops.map((stop, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{stop}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(idx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Stop trigger */}
              {!showAddStop && extraStops.length < 3 && tripType !== 'rental' && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAddStop(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stop along the way</span>
                  </button>
                </div>
              )}

              {showAddStop && (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl">
                  <input
                    type="text"
                    value={newStopInput}
                    onChange={(e) => setNewStopInput(e.target.value)}
                    placeholder="Enter intermediate stop address"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddStop(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Rental Package Selector (for Hourly Rental) */}
              {tripType === 'rental' && (
                <div className="bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 rounded-2xl p-4 space-y-2">
                  <label className="block text-xs font-bold text-sky-900 dark:text-sky-300">
                    Select Rental Duration & Distance Package:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: '4hr_40km', label: '4 Hours / 40 km', desc: 'Short city errands' },
                      { id: '8hr_80km', label: '8 Hours / 80 km', desc: 'Full day city tour' },
                      { id: '12hr_120km', label: '12 Hours / 120 km', desc: 'Extended day travel' },
                    ].map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setRentalPackageId(pkg.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          rentalPackageId === pkg.id
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <p className="text-xs font-bold">{pkg.label}</p>
                        <p
                          className={`text-[10px] mt-0.5 ${
                            rentalPackageId === pkg.id ? 'text-sky-100' : 'text-slate-400'
                          }`}
                        >
                          {pkg.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date & Time (if schedule later or outstation) */}
              {(!isImmediate || tripType === 'outstation_round_trip') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Pickup Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Pickup Time
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  {tripType === 'outstation_round_trip' && (
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Return Date
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="date"
                          min={pickupDate}
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Passengers and Luggage Count */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Passengers
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5">
                    <button
                      type="button"
                      disabled={passengersCount <= 1}
                      onClick={() => setPassengersCount((c) => Math.max(1, c - 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-30 cursor-pointer shadow-xs"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-xs font-bold">{passengersCount}</span>
                    <button
                      type="button"
                      disabled={passengersCount >= 16}
                      onClick={() => setPassengersCount((c) => Math.min(16, c + 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-30 cursor-pointer shadow-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Luggage Bags
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5">
                    <button
                      type="button"
                      disabled={luggageCount <= 0}
                      onClick={() => setLuggageCount((c) => Math.max(0, c - 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-30 cursor-pointer shadow-xs"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-xs font-bold">{luggageCount}</span>
                    <button
                      type="button"
                      disabled={luggageCount >= 12}
                      onClick={() => setLuggageCount((c) => Math.min(12, c + 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-30 cursor-pointer shadow-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Estimated route distance banner */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-sky-500" />
                  <span>
                    Est. Route: <strong>{routeEstimate.distanceKm} km</strong> • Approx{' '}
                    <strong>{routeEstimate.durationMinutes} mins</strong>
                  </span>
                </div>
                {routeEstimate.tollEstimate > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Toll Included: {policies.currencySymbol}
                    {routeEstimate.tollEstimate}
                  </span>
                )}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => {
                  if (!pickup.trim() || !drop.trim()) {
                    alert('Please enter both pickup and destination locations.');
                    return;
                  }
                  setStep(2);
                  updateQueryParams({
                    step: 2,
                    tripType,
                    pickup,
                    drop,
                    passengers: passengersCount,
                    luggage: luggageCount,
                    date: pickupDate,
                    time: pickupTime,
                  });
                }}
                className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Find Available Cabs & Fares</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: VEHICLE SELECTION CARDS & SORT/FILTER             */}
        {/* ========================================================= */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with Sort and Filter controls */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Available Vehicle Classes
                </h2>
                <p className="text-xs text-slate-500">
                  {routeEstimate.distanceKm} km route • {pickup.split(',')[0]} →{' '}
                  {drop.split(',')[0]}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Capacity Filter */}
                <select
                  value={vehicleFilterCapacity}
                  onChange={(e) => setVehicleFilterCapacity(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value={0}>All Capacities</option>
                  <option value={4}>4+ Passengers</option>
                  <option value={6}>6+ Passengers</option>
                  <option value={10}>10+ Passengers (Van)</option>
                </select>

                {/* Sort selector */}
                <select
                  value={vehicleSortBy}
                  onChange={(e) => setVehicleSortBy(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value="price_asc">Price: Low to High</option>
                  <option value="capacity_desc">Capacity: High to Low</option>
                  <option value="eta_asc">Fastest Pickup ETA</option>
                </select>
              </div>
            </div>

            {/* Vehicle Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicleCards.map((veh) => {
                const isSelected = selectedVehicleType === veh.vehicleType;

                return (
                  <div
                    key={veh.vehicleType}
                    onClick={() => {
                      setSelectedVehicleType(veh.vehicleType);
                      updateQueryParams({ vehicle: veh.vehicleType });
                    }}
                    className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-500 shadow-xl dark:shadow-sky-950/40'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Image & Live Badge */}
                      <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <img
                          src={veh.image}
                          alt={veh.title}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        {/* Live available badge */}
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{veh.availableNearby} cabs nearby</span>
                        </div>

                        {/* ETA Badge */}
                        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                          <Clock className="w-3 h-3 text-sky-500" />
                          <span>{veh.etaMinutes} mins ETA</span>
                        </div>
                      </div>

                      {/* Info & Specs */}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {veh.title}
                          </h3>
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                            AC Guaranteed
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
                          {veh.description}
                        </p>

                        {/* Capacity Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {veh.seats} Seats
                          </span>
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {veh.luggage} Bags
                          </span>
                          {veh.fare.isNightSurchargeApplied && (
                            <span className="text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                              Night Surcharge
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fare Summary & Select Button */}
                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                      <div className="flex items-baseline justify-between mb-3 pt-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Estimated Total
                          </p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">
                            {policies.currencySymbol}
                            {veh.fare.finalTotal.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-400">incl. 5% GST</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicleType(veh.vehicleType);
                          setStep(3);
                          updateQueryParams({ step: 3, vehicle: veh.vehicleType });
                        }}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-white'
                        }`}
                      >
                        {isSelected ? 'Selected • Continue' : 'Select Ride'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back button */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Modify Search Locations</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: PASSENGER DETAILS & ADD-ONS                       */}
        {/* ========================================================= */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Passenger Contact & Special Requests
                </h2>
                <p className="text-xs text-slate-500">
                  Driver will call this number upon arrival.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Primary Passenger Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Sahil Roy"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Mobile Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Flight Number (especially for airport transfers) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Flight Number (Optional • for airport tracking)
                </label>
                <div className="relative">
                  <Plane className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 6E 214 or AI 101"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold uppercase focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Add-ons Checklist */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Trip Add-Ons
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-750 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <div className="flex items-center gap-3">
                      <Baby className="w-5 h-5 text-sky-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          Child Safety Seat
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Sanitized infant / booster car seat
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                        +{policies.currencySymbol}150
                      </span>
                      <input
                        type="checkbox"
                        checked={addOnChildSeat}
                        onChange={(e) => setAddOnChildSeat(e.target.checked)}
                        className="w-4 h-4 rounded-md text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-750 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-sky-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          Rooftop Luggage Carrier
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Covered luggage rack for heavy bags
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                        +{policies.currencySymbol}200
                      </span>
                      <input
                        type="checkbox"
                        checked={addOnCarrier}
                        onChange={(e) => setAddOnCarrier(e.target.checked)}
                        className="w-4 h-4 rounded-md text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-750 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-sky-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          Pet-Friendly Cab
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Seat protective mat & pet welcome
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                        +{policies.currencySymbol}100
                      </span>
                      <input
                        type="checkbox"
                        checked={addOnPet}
                        onChange={(e) => setAddOnPet(e.target.checked)}
                        className="w-4 h-4 rounded-md text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Driver Instructions & Landmark Notes
                </label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Please call before reaching Gate 2, luggage assistance needed"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!customerName.trim() || !customerPhone.trim()) {
                      alert('Please provide passenger name and phone number.');
                      return;
                    }
                    setStep(4);
                    updateQueryParams({ step: 4 });
                  }}
                  className="flex-1 py-3 px-5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/25 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Review Itemised Price</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: ITEMISED PRICE REVIEW & COUPON ENGINE             */}
        {/* ========================================================= */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Itemised Fare Breakdown
                </h2>
                <p className="text-xs text-slate-500">
                  Transparent, verified pricing calculated strictly by the engine.
                </p>
              </div>

              {/* Coupon Engine Box */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-750 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Apply Promo or Discount Code
                    </span>
                  </div>
                  {appliedCoupon && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Active
                    </span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                    <div>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {appliedCoupon.code} Applied!
                      </p>
                      <p className="text-[11px] text-slate-500">
                        You saved {policies.currencySymbol}
                        {currentFareBreakdown.discountAmount}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. WELCOME500 or TRAVELLY10"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon(couponCode)}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] font-semibold text-rose-500">{couponError}</p>
                )}
                {couponSuccess && (
                  <p className="text-[11px] font-semibold text-emerald-500">{couponSuccess}</p>
                )}
              </div>

              {/* Itemised Breakdown Table */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                <div className="py-2.5 flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Base Minimum Fare</span>
                  <span>
                    {policies.currencySymbol}
                    {currentFareBreakdown.baseFare}
                  </span>
                </div>

                {currentFareBreakdown.distanceFare > 0 && (
                  <div className="py-2.5 flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>
                      Distance Charge ({currentFareBreakdown.distanceKm} km billable)
                    </span>
                    <span>
                      {policies.currencySymbol}
                      {currentFareBreakdown.distanceFare}
                    </span>
                  </div>
                )}

                {currentFareBreakdown.durationFare > 0 && (
                  <div className="py-2.5 flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Time Charge ({currentFareBreakdown.durationMinutes} mins)</span>
                    <span>
                      {policies.currencySymbol}
                      {currentFareBreakdown.durationFare}
                    </span>
                  </div>
                )}

                {currentFareBreakdown.tollEstimate > 0 && (
                  <div className="py-2.5 flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Estimated Highway Tolls</span>
                    <span>
                      {policies.currencySymbol}
                      {currentFareBreakdown.tollEstimate}
                    </span>
                  </div>
                )}

                {currentFareBreakdown.nightSurcharge > 0 && (
                  <div className="py-2.5 flex items-center justify-between text-amber-500 font-bold">
                    <span>Night Surcharge (Late Night Ride)</span>
                    <span>
                      +{policies.currencySymbol}
                      {currentFareBreakdown.nightSurcharge}
                    </span>
                  </div>
                )}

                {currentFareBreakdown.driverAllowance > 0 && (
                  <div className="py-2.5 flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>
                      Driver Allowance ({currentFareBreakdown.outstationDays} Day
                      {currentFareBreakdown.outstationDays > 1 ? 's' : ''})
                    </span>
                    <span>
                      +{policies.currencySymbol}
                      {currentFareBreakdown.driverAllowance}
                    </span>
                  </div>
                )}

                {currentFareBreakdown.addOnsFare > 0 && (
                  <div className="py-2.5 flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Selected Add-Ons</span>
                    <span>
                      +{policies.currencySymbol}
                      {currentFareBreakdown.addOnsFare}
                    </span>
                  </div>
                )}

                {currentFareBreakdown.discountAmount > 0 && (
                  <div className="py-2.5 flex items-center justify-between text-emerald-500 font-bold">
                    <span>Coupon Discount</span>
                    <span>
                      -{policies.currencySymbol}
                      {currentFareBreakdown.discountAmount}
                    </span>
                  </div>
                )}

                <div className="py-2.5 flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Goods & Services Tax (GST 5%)</span>
                  <span>
                    {policies.currencySymbol}
                    {currentFareBreakdown.gstAmount}
                  </span>
                </div>

                <div className="pt-4 pb-2 flex items-baseline justify-between text-base font-black text-slate-900 dark:text-white">
                  <span>Total Amount</span>
                  <span className="text-xl text-sky-600 dark:text-sky-400">
                    {policies.currencySymbol}
                    {currentFareBreakdown.finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(5);
                    updateQueryParams({ step: 5 });
                  }}
                  className="flex-1 py-3 px-5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/25 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Proceed to Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: PAYMENT ABSTRACTION                               */}
        {/* ========================================================= */}
        {step === 5 && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Choose Payment Option
                </h2>
                <p className="text-xs text-slate-500">
                  Flexible options with zero hidden fees.
                </p>
              </div>

              {/* Payment Mode Selection: Pay Now, Advance 20%, or Pay to Driver */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode('pay_now')}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    paymentMode === 'pay_now'
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 ring-2 ring-sky-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-2">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Pay Full Now</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">100% upfront prepaid</p>
                  </div>
                  <p className="text-sm font-black text-sky-600 dark:text-sky-400 mt-3">
                    {policies.currencySymbol}
                    {currentFareBreakdown.finalTotal.toLocaleString()}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('advance_20')}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    paymentMode === 'advance_20'
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 ring-2 ring-sky-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Pay 20% Advance
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Balance to driver</p>
                  </div>
                  <p className="text-sm font-black text-amber-500 mt-3">
                    {policies.currencySymbol}
                    {currentFareBreakdown.advanceAmount.toLocaleString()}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('pay_to_driver')}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    paymentMode === 'pay_to_driver'
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 ring-2 ring-sky-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                      <Car className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Pay to Driver</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Cash / UPI on ride end</p>
                  </div>
                  <p className="text-sm font-black text-emerald-500 mt-3">
                    {policies.currencySymbol}0 now
                  </p>
                </button>
              </div>

              {/* Online payment methods (if Pay Now or Advance 20) */}
              {paymentMode !== 'pay_to_driver' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentSubMode('demo_pay')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        paymentSubMode === 'demo_pay'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Instant One-Click Demo Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentSubMode('upi_qr')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        paymentSubMode === 'upi_qr'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Scan UPI QR (GPay / PhonePe)
                    </button>
                  </div>

                  {paymentSubMode === 'upi_qr' && (
                    <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-750 text-center space-y-3">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Scan with any UPI App • Expires in {Math.floor(qrTimer / 60)}:
                        {(qrTimer % 60).toString().padStart(2, '0')}
                      </p>
                      <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&data=${encodeURIComponent(
                            `upi://pay?pa=illusion.cabs@okhdfcbank&pn=Illusion%20Cabs&am=${
                              paymentMode === 'advance_20'
                                ? currentFareBreakdown.advanceAmount
                                : currentFareBreakdown.finalTotal
                            }&cu=INR`
                          )}`}
                          alt="UPI QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        UPI ID: <strong>illusion.cabs@okhdfcbank</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {paymentMode === 'pay_to_driver' && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>
                    No advance payment required. You can pay{' '}
                    <strong>
                      {policies.currencySymbol}
                      {currentFareBreakdown.finalTotal.toLocaleString()}
                    </strong>{' '}
                    directly to your driver via Cash or UPI when your trip completes.
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={processingBooking}
                  onClick={handleConfirmAndPay}
                  className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {processingBooking
                      ? 'Confirming Cab...'
                      : paymentMode === 'pay_to_driver'
                      ? 'Confirm Cab (Pay on Ride End)'
                      : `Confirm & Pay ${policies.currencySymbol}${
                          paymentMode === 'advance_20'
                            ? currentFareBreakdown.advanceAmount.toLocaleString()
                            : currentFareBreakdown.finalTotal.toLocaleString()
                        }`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 6: CONFIRMATION VOUCHER & TRIP-START OTP             */}
        {/* ========================================================= */}
        {step === 6 && confirmedBooking && (
          <div className="max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
              {/* Success Badge */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                  Cab Confirmed & Driver Assigned
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Ride Booking Voucher
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Booking ID: <strong>{confirmedBooking.bookingNumber}</strong>
                </p>
              </div>

              {/* Trip-Start OTP Highlight Card */}
              <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 rounded-2xl p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 mb-1">
                  Trip-Start Verification OTP
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-black tracking-widest text-sky-600 dark:text-sky-400 font-mono">
                    {confirmedBooking.otp}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(confirmedBooking.otp);
                      setCopiedOtp(true);
                      setTimeout(() => setCopiedOtp(false), 2000);
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-600 transition cursor-pointer"
                  >
                    {copiedOtp ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Share this OTP with your driver upon boarding to verify and start the trip.
                </p>
              </div>

              {/* QR Code Voucher */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=${encodeURIComponent(
                    `ILLUSION_CAB_BOOKING:${confirmedBooking.id}:OTP:${confirmedBooking.otp}`
                  )}`}
                  alt="Booking Voucher QR"
                  className="w-32 h-32 mx-auto rounded-lg"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-mono">Scan for digital voucher</p>
              </div>

              {/* Driver & Vehicle Assigned */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-750 text-left space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-750">
                  <div className="flex items-center gap-3">
                    <img
                      src={confirmedBooking.driverPhotoUrl}
                      alt={confirmedBooking.driverName}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-sky-500/20"
                    />
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {confirmedBooking.driverName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {confirmedBooking.driverPhone} • ⭐ 4.9
                      </p>
                    </div>
                  </div>
                  <a
                    href={`tel:${confirmedBooking.driverPhone}`}
                    className="p-2.5 rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Assigned Vehicle
                    </p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {confirmedBooking.vehicleModel}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-750 text-slate-900 dark:text-white">
                      {confirmedBooking.vehicleRegistrationNumber}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-750 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="truncate">
                    <strong>Pickup:</strong> {confirmedBooking.pickupAddress}
                  </p>
                  <p className="truncate">
                    <strong>Drop:</strong> {confirmedBooking.dropAddress}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Link
                  to={`/cabs/trip/${confirmedBooking.id}`}
                  className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Open Live Trip & Driver Tracking Screen</span>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/trips?tab=cabs"
                    className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-center"
                  >
                    View in My Trips
                  </Link>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Print Voucher</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal for guest login */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};
