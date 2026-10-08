import { UserRole } from './index';

export type CabTripType =
  | 'airport'
  | 'point_to_point'
  | 'rental'
  | 'outstation_one_way'
  | 'outstation_round_trip';

export type CabVehicleType =
  | 'hatchback'
  | 'sedan'
  | 'suv'
  | 'premium_suv'
  | 'tempo_traveller';

export type CabBookingStatus =
  | 'requested'
  | 'confirmed'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'trip_started'
  | 'completed'
  | 'cancelled';

export type CabPaymentMode = 'pay_now' | 'advance_20' | 'pay_to_driver';

export type DriverStatus = 'online' | 'offline' | 'on_trip' | 'suspended';

export type DriverKycStatus = 'pending' | 'verified' | 'rejected';

export type VehicleStatus = 'active' | 'maintenance' | 'inactive';

// Rental package definition
export interface RentalPackage {
  id: string; // e.g. '4hr_40km', '8hr_80km', '12hr_120km'
  name: string;
  durationHours: number;
  includedKm: number;
  basePrice: Record<CabVehicleType, number>;
  extraKmRate: Record<CabVehicleType, number>;
  extraHourRate: Record<CabVehicleType, number>;
}

// Airport zone flat fare definition
export interface AirportZoneFare {
  zoneId: string;
  zoneName: string;
  airportName: string;
  fares: Record<CabVehicleType, number>;
}

// Cancellation fee slab
export interface CancellationSlab {
  hoursBeforePickup: number; // e.g. 24 -> more than 24h before
  feePercent: number; // percentage of base fare (0-100)
  flatFee?: number;
}

// Vehicle-specific fare configuration
export interface VehicleFareConfig {
  vehicleType: CabVehicleType;
  baseFare: number; // Base fee includes baseKm and baseMinutes
  baseKm: number;
  baseMinutes: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  freeWaitingMinutes: number;
  waitingChargePerMinute: number;
  nightSurcharge: {
    startHour: number; // 24-hr format (e.g. 23)
    endHour: number; // 24-hr format (e.g. 5)
    percentage: number; // e.g. 25 (%)
  };
  driverAllowancePerDay: number; // for outstation trips (e.g. 300)
  nightHaltCharge: number; // for overnight outstation stays (e.g. 500)
  outstationMinKmPerDay: number; // standard e.g. 250 km / day
  outstationPerKmRate: number;
  tollEstimatePerKm: number; // estimated average toll per km
}

// Global Fare Configuration
export interface FareConfig {
  id?: string;
  version: string;
  updatedAt: string;
  updatedBy?: string;
  currencySymbol: string;
  gstPercent: number; // default 5 for cabs in India
  peakHourMultipliers: Array<{
    name: string;
    startHour: number;
    endHour: number;
    multiplier: number; // e.g. 1.25
    daysOfWeek?: number[]; // 0=Sun, 6=Sat
  }>;
  festivalMultiplier: {
    enabled: boolean;
    multiplier: number;
    name: string;
  };
  ratesByVehicle: Record<CabVehicleType, VehicleFareConfig>;
  rentalPackages: RentalPackage[];
  airportZones: AirportZoneFare[];
  cancellationSlabs: CancellationSlab[];
}

// Input for Fare Calculation
export interface FareCalculationInput {
  tripType: CabTripType;
  vehicleType: CabVehicleType;
  distanceKm: number;
  durationMinutes: number;
  pickupDateTime: string; // ISO string
  returnDateTime?: string; // For outstation round-trip
  rentalPackageId?: string; // For rental
  extraRentalHours?: number;
  extraRentalKm?: number;
  airportZoneId?: string; // For airport transfer
  waitingMinutes?: number;
  tollAmountOverride?: number;
  addOns?: {
    childSeat?: boolean;
    luggageCarrier?: boolean;
    petFriendly?: boolean;
  };
  couponDiscountValue?: number;
  couponType?: 'percentage' | 'flat';
  couponMaxDiscount?: number;
}

// Itemised Fare Breakdown Snapshot
export interface FareBreakdown {
  tripType: CabTripType;
  vehicleType: CabVehicleType;
  baseFare: number;
  distanceKm: number;
  distanceFare: number;
  durationMinutes: number;
  durationFare: number;
  rentalPackageName?: string;
  rentalPackageFare?: number;
  rentalExtraKmFare?: number;
  rentalExtraHourFare?: number;
  airportFlatFare?: number;
  waitingCharge: number;
  nightSurcharge: number;
  isNightSurchargeApplied: boolean;
  peakHourMultiplier: number;
  driverAllowance: number;
  outstationDays: number;
  nightHaltCharge: number;
  tollEstimate: number;
  addOnsFare: number;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  taxableAmount: number;
  gstAmount: number; // 5% GST
  finalTotal: number;
  advanceAmount: number; // 20% if selected or full
  remainingAmount: number;
  configVersion: string;
}

// Status timeline entry
export interface CabStatusHistoryItem {
  status: CabBookingStatus;
  timestamp: string;
  actorUid: string;
  actorRole: UserRole | 'system';
  reason?: string;
  note?: string;
  location?: { lat: number; lng: number };
}

// Cab Booking Model
export interface CabBooking {
  id: string;
  bookingNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tripType: CabTripType;
  vehicleType: CabVehicleType;
  pickupAddress: string;
  dropAddress: string;
  pickupLocation?: { lat: number; lng: number };
  dropLocation?: { lat: number; lng: number };
  extraStops?: Array<{ address: string; lat?: number; lng?: number }>;
  pickupDateTime: string;
  returnDateTime?: string;
  isImmediate: boolean; // "Book now" vs "Schedule later"
  passengersCount: number;
  luggageCount: number;
  flightNumber?: string;
  specialInstructions?: string;
  addOns?: {
    childSeat?: boolean;
    luggageCarrier?: boolean;
    petFriendly?: boolean;
  };
  otp: string; // 4-digit start OTP
  status: CabBookingStatus;
  statusHistory: CabStatusHistoryItem[];
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPhotoUrl?: string;
  vehicleId?: string;
  vehicleRegistrationNumber?: string;
  vehicleModel?: string;
  fareBreakdown: FareBreakdown;
  fareConfigVersion: string;
  paymentMode: CabPaymentMode;
  paymentStatus: 'pending' | 'advance_paid' | 'paid' | 'refunded';
  advancePaidAmount?: number;
  balanceDue?: number;
  cancellationReason?: string;
  cancellationFee?: number;
  driverRating?: number;
  vehicleRating?: number;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

// Cab Vehicle Model
export interface CabVehicle {
  id: string;
  name: string;
  model: string;
  vehicleType: CabVehicleType;
  registrationNumber: string;
  seatingCapacity: number;
  luggageCapacity: number;
  hasAC: boolean;
  imageUrl: string;
  status: VehicleStatus;
  currentDriverId?: string;
  fuelType?: 'petrol' | 'diesel' | 'cng' | 'ev';
  color?: string;
  year?: number;
  documentExpiry: {
    insuranceExpiry: string;
    rcExpiry: string;
    fitnessExpiry: string;
    permitExpiry: string;
  };
  rating: number;
  totalTrips: number;
  createdAt: string;
  updatedAt: string;
}

// Driver Model
export interface Driver {
  id: string; // user UID
  displayName: string;
  phoneNumber: string;
  email: string;
  avatarUrl?: string;
  assignedVehicleId?: string;
  licenceNumber: string;
  licenceExpiry: string;
  badgeNumber?: string;
  kycDocuments: {
    licenceUrl?: string;
    rcUrl?: string;
    insuranceUrl?: string;
    policeVerificationUrl?: string;
  };
  kycStatus: DriverKycStatus;
  status: DriverStatus;
  commissionPercent: number;
  currentBookingId?: string;
  rating: number;
  totalTrips: number;
  lifetimeEarnings: number;
  pendingPayout: number;
  createdAt: string;
  updatedAt: string;
}

// Live Driver Location
export interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  isOnline: boolean;
  activeBookingId?: string;
  updatedAt: string;
}

// Cab Zone
export interface CabZone {
  id: string;
  name: string;
  code: string;
  city: string;
  type: 'airport' | 'city' | 'outstation';
  center?: { lat: number; lng: number };
  radiusKm?: number;
  airportFlatRates?: Record<CabVehicleType, number>;
  isActive: boolean;
}

// Cab Review
export interface CabReview {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  driverId: string;
  vehicleId: string;
  driverRating: number;
  vehicleRating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

// Cab Transaction / Payout
export interface CabTransaction {
  id: string;
  bookingId: string;
  driverId?: string;
  userId: string;
  amount: number;
  type: 'advance_payment' | 'full_payment' | 'driver_cash' | 'commission_deduction' | 'driver_payout' | 'refund';
  status: 'pending' | 'completed' | 'failed';
  paymentReference?: string;
  createdAt: string;
}
