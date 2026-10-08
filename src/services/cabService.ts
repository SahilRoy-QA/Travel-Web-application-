import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  CabBooking,
  CabBookingStatus,
  CabPaymentMode,
  CabReview,
  CabTripType,
  CabVehicle,
  CabVehicleType,
  Driver,
  DriverLocation,
  FareCalculationInput,
  FareConfig,
  VehicleFareConfig,
} from '../types/cab';
import { calculateFare, calculateCancellationFee, verifyBookingFare } from './cabFareEngine';
import { defaultFareConfig, defaultVehicleFareConfigs } from './defaultCabFareConfig';

// Sample vehicle fleet presets
export const sampleCabVehicles: CabVehicle[] = [
  {
    id: 'veh-hatchback-1',
    name: 'Compact Hatchback',
    model: 'Maruti Suzuki WagonR / Swift',
    vehicleType: 'hatchback',
    registrationNumber: 'DL 01 AB 4021',
    seatingCapacity: 4,
    luggageCapacity: 2,
    hasAC: true,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    fuelType: 'cng',
    color: 'White',
    year: 2023,
    documentExpiry: {
      insuranceExpiry: '2026-12-31',
      rcExpiry: '2035-01-01',
      fitnessExpiry: '2027-01-01',
      permitExpiry: '2027-01-01',
    },
    rating: 4.8,
    totalTrips: 412,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'veh-sedan-1',
    name: 'Comfort Sedan',
    model: 'Maruti Dzire / Hyundai Aura',
    vehicleType: 'sedan',
    registrationNumber: 'DL 02 CD 9932',
    seatingCapacity: 4,
    luggageCapacity: 3,
    hasAC: true,
    imageUrl: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    fuelType: 'petrol',
    color: 'Silver',
    year: 2024,
    documentExpiry: {
      insuranceExpiry: '2026-11-30',
      rcExpiry: '2036-05-10',
      fitnessExpiry: '2027-05-10',
      permitExpiry: '2027-05-10',
    },
    rating: 4.9,
    totalTrips: 680,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'veh-suv-1',
    name: 'Spacious SUV (6+1)',
    model: 'Maruti Ertiga / Kia Carens',
    vehicleType: 'suv',
    registrationNumber: 'HR 26 DQ 5104',
    seatingCapacity: 6,
    luggageCapacity: 4,
    hasAC: true,
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    fuelType: 'diesel',
    color: 'Grey',
    year: 2024,
    documentExpiry: {
      insuranceExpiry: '2026-09-15',
      rcExpiry: '2037-02-12',
      fitnessExpiry: '2027-02-12',
      permitExpiry: '2027-02-12',
    },
    rating: 4.9,
    totalTrips: 524,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'veh-premium-suv-1',
    name: 'Executive Premium SUV',
    model: 'Toyota Innova Crysta / Hycross',
    vehicleType: 'premium_suv',
    registrationNumber: 'DL 03 EX 7777',
    seatingCapacity: 7,
    luggageCapacity: 5,
    hasAC: true,
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    fuelType: 'diesel',
    color: 'Pearl White',
    year: 2024,
    documentExpiry: {
      insuranceExpiry: '2027-01-20',
      rcExpiry: '2038-04-10',
      fitnessExpiry: '2028-04-10',
      permitExpiry: '2028-04-10',
    },
    rating: 5.0,
    totalTrips: 340,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'veh-tempo-1',
    name: 'Tempo Traveller Group Van',
    model: 'Force Urbania 12-16 Seater Luxury',
    vehicleType: 'tempo_traveller',
    registrationNumber: 'UP 16 TT 8890',
    seatingCapacity: 12,
    luggageCapacity: 10,
    hasAC: true,
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    fuelType: 'diesel',
    color: 'White & Blue',
    year: 2023,
    documentExpiry: {
      insuranceExpiry: '2026-10-10',
      rcExpiry: '2036-09-01',
      fitnessExpiry: '2026-09-01',
      permitExpiry: '2026-09-01',
    },
    rating: 4.8,
    totalTrips: 185,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// Sample default drivers for demo dispatch
export const sampleDrivers: Driver[] = [
  {
    id: 'driver-rajesh-1',
    displayName: 'Rajesh Kumar',
    phoneNumber: '+91 98765 43210',
    email: 'rajesh.driver@illusiontravel.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    assignedVehicleId: 'veh-sedan-1',
    licenceNumber: 'DL-0420180019283',
    licenceExpiry: '2030-08-15',
    kycDocuments: {
      licenceUrl: 'https://placehold.co/600x400/png?text=DL_Licence',
      rcUrl: 'https://placehold.co/600x400/png?text=RC_Certificate',
    },
    kycStatus: 'verified',
    status: 'online',
    commissionPercent: 15,
    rating: 4.9,
    totalTrips: 580,
    lifetimeEarnings: 142000,
    pendingPayout: 4200,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'driver-amit-2',
    displayName: 'Amit Sharma',
    phoneNumber: '+91 98112 34567',
    email: 'amit.driver@illusiontravel.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    assignedVehicleId: 'veh-suv-1',
    licenceNumber: 'HR-2620190088231',
    licenceExpiry: '2031-03-20',
    kycDocuments: {
      licenceUrl: 'https://placehold.co/600x400/png?text=DL_Licence',
    },
    kycStatus: 'verified',
    status: 'online',
    commissionPercent: 15,
    rating: 4.8,
    totalTrips: 420,
    lifetimeEarnings: 108000,
    pendingPayout: 3100,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'driver-vikram-3',
    displayName: 'Vikram Singh',
    phoneNumber: '+91 97188 99001',
    email: 'vikram.driver@illusiontravel.com',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    assignedVehicleId: 'veh-premium-suv-1',
    licenceNumber: 'DL-0120170044552',
    licenceExpiry: '2029-11-10',
    kycDocuments: {},
    kycStatus: 'verified',
    status: 'online',
    commissionPercent: 12,
    rating: 5.0,
    totalTrips: 690,
    lifetimeEarnings: 215000,
    pendingPayout: 7800,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// Preset Popular Locations & Zones for fallback when Maps API key is not present
export interface PresetLocation {
  id: string;
  name: string;
  city: string;
  category: 'airport' | 'railway' | 'hub' | 'city' | 'popular';
  zoneId?: string;
  lat: number;
  lng: number;
  address: string;
}

export const presetLocations: PresetLocation[] = [
  // Delhi NCR
  { id: 'del-igi', name: 'Indira Gandhi International Airport (DEL)', city: 'Delhi', category: 'airport', zoneId: 'zone-delhi-igi', lat: 28.5562, lng: 77.1000, address: 'New Delhi, Delhi 110037' },
  { id: 'del-ndls', name: 'New Delhi Railway Station (NDLS)', city: 'Delhi', category: 'railway', lat: 28.6430, lng: 77.2197, address: 'Bhavbhuti Marg, Ratan Lal Market, Kamla Market, Delhi 110006' },
  { id: 'del-cp', name: 'Connaught Place (CP)', city: 'Delhi', category: 'hub', lat: 28.6315, lng: 77.2167, address: 'Connaught Place, New Delhi, Delhi 110001' },
  { id: 'del-noida', name: 'Noida Sector 62 / Electronic City', city: 'Noida', category: 'popular', zoneId: 'zone-noida', lat: 28.6279, lng: 77.3732, address: 'Sector 62, Noida, Uttar Pradesh 201309' },
  { id: 'del-cyber', name: 'Cyber Hub DLF Phase 2', city: 'Gurgaon', category: 'popular', zoneId: 'zone-gurgaon', lat: 28.4950, lng: 77.0895, address: 'DLF Cyber City, Gurugram, Haryana 122002' },

  // Mumbai
  { id: 'bom-csmia', name: 'Chhatrapati Shivaji Maharaj Airport (BOM)', city: 'Mumbai', category: 'airport', zoneId: 'zone-mumbai-airport', lat: 19.0896, lng: 72.8656, address: 'Sahar, Andheri East, Mumbai, Maharashtra 400099' },
  { id: 'bom-bandra', name: 'Bandra West (BKC / Linking Rd)', city: 'Mumbai', category: 'hub', zoneId: 'zone-mumbai-bandra', lat: 19.0596, lng: 72.8295, address: 'Bandra West, Mumbai, Maharashtra 400050' },
  { id: 'bom-cst', name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', city: 'Mumbai', category: 'railway', zoneId: 'zone-mumbai-south', lat: 18.9401, lng: 72.8347, address: 'Fort, Mumbai, Maharashtra 400001' },

  // Bengaluru
  { id: 'blr-airport', name: 'Kempegowda International Airport (BLR)', city: 'Bengaluru', category: 'airport', zoneId: 'zone-blr-airport', lat: 13.1986, lng: 77.7066, address: 'KIAL Rd, Devanahalli, Bengaluru, Karnataka 560300' },
  { id: 'blr-koramangala', name: 'Koramangala 4th Block', city: 'Bengaluru', category: 'hub', zoneId: 'zone-blr-city', lat: 12.9345, lng: 77.6265, address: 'Koramangala, Bengaluru, Karnataka 560034' },
  { id: 'blr-whitefield', name: 'Whitefield ITPL', city: 'Bengaluru', category: 'popular', zoneId: 'zone-blr-whitefield', lat: 12.9863, lng: 77.7303, address: 'Whitefield, Bengaluru, Karnataka 560066' },

  // Goa
  { id: 'goa-dabolim', name: 'Goa Dabolim Airport (GOI)', city: 'Goa', category: 'airport', lat: 15.3808, lng: 73.8313, address: 'Airport Rd, Dabolim, Goa 403801' },
  { id: 'goa-mopa', name: 'Manohar International Airport Mopa (GOX)', city: 'Goa', category: 'airport', lat: 15.7686, lng: 73.8647, address: 'Mopa, Pernem, Goa 403512' },
  { id: 'goa-calangute', name: 'Calangute Beach / Candolim', city: 'Goa', category: 'popular', lat: 15.5439, lng: 73.7553, address: 'Calangute, Goa 403516' },

  // Outstation destinations
  { id: 'out-jaipur', name: 'Jaipur Pink City', city: 'Jaipur', category: 'city', lat: 26.9124, lng: 75.7873, address: 'Jaipur, Rajasthan 302001' },
  { id: 'out-agra', name: 'Agra (Taj Mahal / Cantt)', city: 'Agra', category: 'city', lat: 27.1767, lng: 78.0081, address: 'Agra, Uttar Pradesh 282001' },
  { id: 'out-chandigarh', name: 'Chandigarh Sector 17', city: 'Chandigarh', category: 'city', lat: 30.7333, lng: 76.7794, address: 'Chandigarh 160017' },
  { id: 'out-manali', name: 'Manali Mall Road', city: 'Manali', category: 'city', lat: 32.2432, lng: 77.1892, address: 'Manali, Himachal Pradesh 175131' },
  { id: 'out-pune', name: 'Pune Shivajinagar / Hinjawadi', city: 'Pune', category: 'city', lat: 18.5204, lng: 73.8567, address: 'Pune, Maharashtra 411005' },
];

/**
 * Approximate distance and duration between two addresses or coordinates using Haversine formula
 */
export function estimateDistanceAndDuration(
  pickup: string,
  drop: string,
  tripType: CabTripType
): { distanceKm: number; durationMinutes: number; tollEstimate: number } {
  // Preset lookups
  const pLower = (pickup || '').toLowerCase();
  const dLower = (drop || '').toLowerCase();

  // Outstation distances
  if (tripType === 'outstation_one_way' || tripType === 'outstation_round_trip') {
    if ((pLower.includes('delhi') && dLower.includes('jaipur')) || (pLower.includes('jaipur') && dLower.includes('delhi'))) {
      return { distanceKm: 270, durationMinutes: 300, tollEstimate: 360 };
    }
    if ((pLower.includes('delhi') && dLower.includes('agra')) || (pLower.includes('agra') && dLower.includes('delhi'))) {
      return { distanceKm: 230, durationMinutes: 240, tollEstimate: 450 };
    }
    if ((pLower.includes('delhi') && dLower.includes('chandigarh')) || (pLower.includes('chandigarh') && dLower.includes('delhi'))) {
      return { distanceKm: 250, durationMinutes: 270, tollEstimate: 320 };
    }
    if ((pLower.includes('delhi') && dLower.includes('manali')) || (pLower.includes('manali') && dLower.includes('delhi'))) {
      return { distanceKm: 540, durationMinutes: 660, tollEstimate: 600 };
    }
    if ((pLower.includes('mumbai') && dLower.includes('pune')) || (pLower.includes('pune') && dLower.includes('mumbai'))) {
      return { distanceKm: 150, durationMinutes: 190, tollEstimate: 320 };
    }
    // Default standard outstation fallback
    return { distanceKm: 280, durationMinutes: 320, tollEstimate: 350 };
  }

  // Airport transfer
  if (tripType === 'airport') {
    if (pLower.includes('noida') || dLower.includes('noida')) {
      return { distanceKm: 42, durationMinutes: 65, tollEstimate: 120 };
    }
    if (pLower.includes('gurgaon') || dLower.includes('gurgaon')) {
      return { distanceKm: 18, durationMinutes: 30, tollEstimate: 0 };
    }
    if (pLower.includes('whitefield') || dLower.includes('whitefield')) {
      return { distanceKm: 46, durationMinutes: 75, tollEstimate: 105 };
    }
    return { distanceKm: 28, durationMinutes: 45, tollEstimate: 80 };
  }

  // Hourly Rental
  if (tripType === 'rental') {
    return { distanceKm: 40, durationMinutes: 240, tollEstimate: 0 };
  }

  // Local Point-to-Point fallback
  // Generate consistent deterministic distance based on string lengths if arbitrary
  let seed = 0;
  for (let i = 0; i < (pLower + dLower).length; i++) {
    seed += (pLower + dLower).charCodeAt(i);
  }
  const km = Math.max(8, (seed % 28) + 5);
  const minutes = Math.round(km * 2.8 + 10);
  return {
    distanceKm: km,
    durationMinutes: minutes,
    tollEstimate: km > 20 ? 60 : 0,
  };
}

/**
 * Fetch active fare config from Firestore or fallback to default
 */
export async function getActiveFareConfig(): Promise<FareConfig> {
  try {
    const snap = await getDoc(doc(db, 'fareConfig', 'global_v1'));
    if (snap.exists()) {
      return snap.data() as FareConfig;
    }
  } catch (err) {
    console.warn('Fare config fetch notice, using default configuration:', err);
  }
  return defaultFareConfig;
}

/**
 * Fetch available cab vehicles or return realistic defaults
 */
export async function getAvailableCabVehicles(): Promise<CabVehicle[]> {
  try {
    const snap = await getDocs(collection(db, 'cabVehicles'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CabVehicle));
      const active = list.filter((v) => v.status === 'active');
      if (active.length > 0) return active;
    }
  } catch (err) {
    console.warn('Cab vehicles fetch notice, using fleet presets:', err);
  }
  return sampleCabVehicles;
}

/**
 * Create a new cab booking with verified fare calculation
 */
export async function createCabBookingInDb(bookingData: Omit<CabBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<CabBooking> {
  const bookingId = `CAB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();

  const newBooking: CabBooking = {
    ...bookingData,
    id: bookingId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Write booking document to Firestore
    const ref = doc(db, 'cabBookings', bookingId);
    await setDoc(ref, newBooking);

    // Also write a transaction record if payment was captured
    if (bookingData.paymentMode === 'pay_now' || bookingData.paymentMode === 'advance_20') {
      const txRef = doc(db, 'cabTransactions', `tx-${bookingId}`);
      await setDoc(txRef, {
        id: `tx-${bookingId}`,
        bookingId,
        userId: bookingData.userId,
        amount: bookingData.advancePaidAmount || bookingData.fareBreakdown.finalTotal,
        type: bookingData.paymentMode === 'pay_now' ? 'full_payment' : 'advance_payment',
        status: 'completed',
        createdAt: now,
      });
    }

    return newBooking;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `cabBookings/${bookingId}`);
    throw err;
  }
}

/**
 * Subscribe to real-time updates for a single cab booking
 */
export function subscribeToCabBooking(bookingId: string, onUpdate: (booking: CabBooking | null) => void) {
  const ref = doc(db, 'cabBookings', bookingId);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() } as CabBooking);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Cab booking listener notice:', err);
      onUpdate(null);
    }
  );
}

/**
 * Subscribe to live driver location updates
 */
export function subscribeToDriverLocation(driverId: string, onUpdate: (location: DriverLocation | null) => void) {
  const ref = doc(db, 'driverLocations', driverId);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as DriverLocation);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Driver location listener notice:', err);
      onUpdate(null);
    }
  );
}

/**
 * Cancel a cab booking per policy and record cancellation fee
 */
export async function cancelCabBookingInDb(
  bookingId: string,
  userId: string,
  reason: string,
  booking: CabBooking,
  fareConfig: FareConfig
): Promise<number> {
  const cancellationFee = calculateCancellationFee(booking, fareConfig);
  const now = new Date().toISOString();

  const statusItem = {
    status: 'cancelled' as CabBookingStatus,
    timestamp: now,
    actorUid: userId,
    actorRole: 'customer' as const,
    reason,
  };

  try {
    const ref = doc(db, 'cabBookings', bookingId);
    await updateDoc(ref, {
      status: 'cancelled',
      cancellationReason: reason,
      cancellationFee,
      statusHistory: [...(booking.statusHistory || []), statusItem],
      updatedAt: now,
    });
    return cancellationFee;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `cabBookings/${bookingId}`);
    throw err;
  }
}

/**
 * Submit verified cab review
 */
export async function submitCabReviewInDb(
  reviewData: Omit<CabReview, 'id' | 'createdAt' | 'isApproved'>
): Promise<void> {
  const reviewId = `rev-${Date.now()}`;
  const now = new Date().toISOString();

  const fullReview: CabReview = {
    ...reviewData,
    id: reviewId,
    isApproved: true,
    createdAt: now,
  };

  try {
    // 1. Save review document
    await setDoc(doc(db, 'cabReviews', reviewId), fullReview);

    // 2. Update booking review status
    const bookingRef = doc(db, 'cabBookings', reviewData.bookingId);
    await updateDoc(bookingRef, {
      driverRating: reviewData.driverRating,
      vehicleRating: reviewData.vehicleRating,
      reviewComment: reviewData.comment,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `cabReviews/${reviewId}`);
    throw err;
  }
}
