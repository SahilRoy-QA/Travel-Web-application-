export type UserRole = 'customer' | 'agent' | 'admin' | 'super_admin' | 'driver';

export * from './cab';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme?: ThemePreference;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: UserRole;
  isBlocked?: boolean;
  avatarUrl?: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt?: string;
}

export interface Destination {
  id: string;
  name: string;
  state?: string;
  country: string;
  description: string;
  image: string;
  popular: boolean;
  order: number;
  hotelCount?: number;
  packageCount?: number;
  createdAt?: string;
}

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  maxGuests: number;
  bedType: string;
  basePrice: number;
  amenities: string[];
  images: string[];
  totalInventory: number;
  isAvailable: boolean;
  createdAt?: string;
}

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  destinationId: string;
  destinationCity: string;
  starRating: number;
  propertyType: 'hotel' | 'resort' | 'villa' | 'homestay' | 'apartment';
  description: string;
  address: string;
  location?: { lat: number; lng: number };
  images: string[];
  amenities: string[];
  policies: {
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
    houseRules: string[];
  };
  isPublished: boolean;
  minPrice: number;
  featured: boolean;
  rooms?: RoomType[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomInventory {
  id: string; // `${hotelId}_${roomId}_${date}`
  hotelId: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  total: number;
  booked: number;
  blocked: number;
  priceOverride?: number;
}

export interface PackageItineraryDay {
  day: number;
  title: string;
  description: string;
  meals: string[];
  hotelStay?: string;
}

export interface TourPackage {
  id: string;
  title: string;
  slug: string;
  destinationId: string;
  destinationName: string;
  agentId?: string;
  agentName?: string;
  durationDays: number;
  durationNights: number;
  pricePerTraveller: number;
  originalPrice?: number;
  maxGroupSize: number;
  itinerary: PackageItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  departureDates: string[];
  images: string[];
  isPublished: boolean;
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  category: 'cab' | 'activity' | 'transfer';
  description: string;
  destinationId?: string;
  destinationCity?: string;
  price: number;
  image: string;
  duration?: string;
  inclusions: string[];
  isAvailable: boolean;
  createdAt?: string;
}

export interface BookingGuestDetails {
  primaryName: string;
  email: string;
  phone: string;
  specialRequests?: string;
  additionalGuests?: string[];
}

export interface Booking {
  id: string;
  bookingNumber: string;
  type: 'hotel' | 'package' | 'service';
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  hotelId?: string;
  roomId?: string;
  packageId?: string;
  serviceId?: string;
  itemTitle: string;
  itemImage: string;
  checkInDate?: string;
  checkOutDate?: string;
  departureDate?: string;
  nights?: number;
  guestsCount: number;
  roomsCount?: number;
  guestDetails: BookingGuestDetails;
  basePrice: number;
  taxes: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  paymentMode: 'pay_later' | 'online' | 'razorpay' | 'upi_qr' | 'demo_pay';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  razorpayPaymentId?: string;
  upiTransactionId?: string;
  paymentMethodDetails?: string;
  cancellationReason?: string;
  refundAmount?: number;
  refundStatus?: 'none' | 'requested' | 'processed';
  agentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minBookingAmount: number;
  maxDiscount?: number;
  expiryDate?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  badge?: string;
  isActive: boolean;
  order: number;
}

export interface Review {
  id: string;
  targetType: 'hotel' | 'package';
  targetId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  bookingId: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  agencyName: string;
  email: string;
  phone: string;
  commissionPercent: number;
  status: 'pending' | 'active' | 'suspended';
  address?: string;
  verified: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface BrandingSettings {
  brandName: string;
  tagline: string;
  logoUrl: string;
  logoUrlDark?: string;
  primaryColor: string;
  primaryColorDark?: string;
  accentColor: string;
  accentColorDark?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  footerLinks: {
    title: string;
    links: { label: string; url: string }[];
  }[];
}

export interface HomepageSection {
  id: string;
  name: string;
  type: 'hero' | 'trending_destinations' | 'featured_hotels' | 'popular_packages' | 'offers_banner' | 'testimonials' | 'why_choose_us';
  title: string;
  subtitle: string;
  enabled: boolean;
  order: number;
}

export interface FeatureFlags {
  enableOnlinePayment: boolean;
  enableReviews: boolean;
  enableAgents: boolean;
  maintenanceMode: boolean;
  bannerMessage?: string;
}

export interface PolicySettings {
  defaultCancellationHours: number;
  standardTaxPercent: number;
  currency: string;
  currencySymbol: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  timestamp: string;
}
