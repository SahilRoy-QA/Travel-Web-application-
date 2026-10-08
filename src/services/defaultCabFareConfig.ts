import { FareConfig, RentalPackage, AirportZoneFare, CancellationSlab, CabVehicleType, VehicleFareConfig } from '../types/cab';

export const defaultVehicleFareConfigs: Record<CabVehicleType, VehicleFareConfig> = {
  hatchback: {
    vehicleType: 'hatchback',
    baseFare: 120, // covers first 4 km
    baseKm: 4,
    baseMinutes: 15,
    perKmRate: 13,
    perMinuteRate: 1.5,
    minimumFare: 100,
    freeWaitingMinutes: 10,
    waitingChargePerMinute: 2,
    nightSurcharge: {
      startHour: 23,
      endHour: 5,
      percentage: 25,
    },
    driverAllowancePerDay: 300,
    nightHaltCharge: 400,
    outstationMinKmPerDay: 250,
    outstationPerKmRate: 12,
    tollEstimatePerKm: 1.5,
  },
  sedan: {
    vehicleType: 'sedan',
    baseFare: 160, // covers first 4 km
    baseKm: 4,
    baseMinutes: 15,
    perKmRate: 16,
    perMinuteRate: 2,
    minimumFare: 140,
    freeWaitingMinutes: 10,
    waitingChargePerMinute: 2.5,
    nightSurcharge: {
      startHour: 23,
      endHour: 5,
      percentage: 25,
    },
    driverAllowancePerDay: 350,
    nightHaltCharge: 500,
    outstationMinKmPerDay: 250,
    outstationPerKmRate: 14.5,
    tollEstimatePerKm: 1.8,
  },
  suv: {
    vehicleType: 'suv',
    baseFare: 240, // covers first 4 km
    baseKm: 4,
    baseMinutes: 15,
    perKmRate: 21,
    perMinuteRate: 2.5,
    minimumFare: 220,
    freeWaitingMinutes: 10,
    waitingChargePerMinute: 3,
    nightSurcharge: {
      startHour: 23,
      endHour: 5,
      percentage: 25,
    },
    driverAllowancePerDay: 400,
    nightHaltCharge: 600,
    outstationMinKmPerDay: 300,
    outstationPerKmRate: 19,
    tollEstimatePerKm: 2.2,
  },
  premium_suv: {
    vehicleType: 'premium_suv',
    baseFare: 350, // covers first 4 km
    baseKm: 4,
    baseMinutes: 15,
    perKmRate: 28,
    perMinuteRate: 3.5,
    minimumFare: 300,
    freeWaitingMinutes: 15,
    waitingChargePerMinute: 4,
    nightSurcharge: {
      startHour: 23,
      endHour: 5,
      percentage: 25,
    },
    driverAllowancePerDay: 500,
    nightHaltCharge: 800,
    outstationMinKmPerDay: 300,
    outstationPerKmRate: 25,
    tollEstimatePerKm: 2.5,
  },
  tempo_traveller: {
    vehicleType: 'tempo_traveller',
    baseFare: 600, // covers first 5 km
    baseKm: 5,
    baseMinutes: 20,
    perKmRate: 36,
    perMinuteRate: 5,
    minimumFare: 550,
    freeWaitingMinutes: 15,
    waitingChargePerMinute: 5,
    nightSurcharge: {
      startHour: 23,
      endHour: 5,
      percentage: 25,
    },
    driverAllowancePerDay: 700,
    nightHaltCharge: 1000,
    outstationMinKmPerDay: 350,
    outstationPerKmRate: 32,
    tollEstimatePerKm: 3.5,
  },
};

export const defaultRentalPackages: RentalPackage[] = [
  {
    id: '4hr_40km',
    name: '4 Hours / 40 km',
    durationHours: 4,
    includedKm: 40,
    basePrice: {
      hatchback: 999,
      sedan: 1299,
      suv: 1899,
      premium_suv: 2799,
      tempo_traveller: 4199,
    },
    extraKmRate: {
      hatchback: 14,
      sedan: 17,
      suv: 22,
      premium_suv: 29,
      tempo_traveller: 38,
    },
    extraHourRate: {
      hatchback: 150,
      sedan: 190,
      suv: 260,
      premium_suv: 380,
      tempo_traveller: 550,
    },
  },
  {
    id: '8hr_80km',
    name: '8 Hours / 80 km',
    durationHours: 8,
    includedKm: 80,
    basePrice: {
      hatchback: 1799,
      sedan: 2299,
      suv: 3299,
      premium_suv: 4899,
      tempo_traveller: 7199,
    },
    extraKmRate: {
      hatchback: 14,
      sedan: 17,
      suv: 22,
      premium_suv: 29,
      tempo_traveller: 38,
    },
    extraHourRate: {
      hatchback: 150,
      sedan: 190,
      suv: 260,
      premium_suv: 380,
      tempo_traveller: 550,
    },
  },
  {
    id: '12hr_120km',
    name: '12 Hours / 120 km',
    durationHours: 12,
    includedKm: 120,
    basePrice: {
      hatchback: 2599,
      sedan: 3299,
      suv: 4699,
      premium_suv: 6999,
      tempo_traveller: 9999,
    },
    extraKmRate: {
      hatchback: 14,
      sedan: 17,
      suv: 22,
      premium_suv: 29,
      tempo_traveller: 38,
    },
    extraHourRate: {
      hatchback: 150,
      sedan: 190,
      suv: 260,
      premium_suv: 380,
      tempo_traveller: 550,
    },
  },
];

export const defaultAirportZones: AirportZoneFare[] = [
  {
    zoneId: 'delhi_igi_t3_central',
    zoneName: 'Central Delhi (Connaught Place / NDLS)',
    airportName: 'Indira Gandhi International Airport (DEL)',
    fares: {
      hatchback: 650,
      sedan: 850,
      suv: 1250,
      premium_suv: 1850,
      tempo_traveller: 2950,
    },
  },
  {
    zoneId: 'delhi_igi_t3_south',
    zoneName: 'South Delhi (Saket / Hauz Khas / Vasant Kunj)',
    airportName: 'Indira Gandhi International Airport (DEL)',
    fares: {
      hatchback: 550,
      sedan: 750,
      suv: 1100,
      premium_suv: 1650,
      tempo_traveller: 2600,
    },
  },
  {
    zoneId: 'delhi_igi_t3_gurgaon',
    zoneName: 'Gurugram (Cyber City / Golf Course Rd)',
    airportName: 'Indira Gandhi International Airport (DEL)',
    fares: {
      hatchback: 500,
      sedan: 700,
      suv: 1050,
      premium_suv: 1550,
      tempo_traveller: 2500,
    },
  },
  {
    zoneId: 'delhi_igi_t3_noida',
    zoneName: 'Noida (Sector 18 / Greater Noida Expressway)',
    airportName: 'Indira Gandhi International Airport (DEL)',
    fares: {
      hatchback: 850,
      sedan: 1100,
      suv: 1600,
      premium_suv: 2350,
      tempo_traveller: 3600,
    },
  },
  {
    zoneId: 'mumbai_bom_t2_south',
    zoneName: 'South Mumbai (Colaba / Nariman Point / Marine Drive)',
    airportName: 'Chhatrapati Shivaji Maharaj Airport (BOM)',
    fares: {
      hatchback: 700,
      sedan: 950,
      suv: 1400,
      premium_suv: 2100,
      tempo_traveller: 3200,
    },
  },
  {
    zoneId: 'blr_airport_city',
    zoneName: 'Bangalore Central (MG Road / Indiranagar / Koramangala)',
    airportName: 'Kempegowda International Airport (BLR)',
    fares: {
      hatchback: 950,
      sedan: 1250,
      suv: 1850,
      premium_suv: 2750,
      tempo_traveller: 4200,
    },
  },
];

export const defaultCancellationSlabs: CancellationSlab[] = [
  {
    hoursBeforePickup: 24, // > 24 hours before
    feePercent: 0,
    flatFee: 0,
  },
  {
    hoursBeforePickup: 6, // 6 to 24 hours before
    feePercent: 10,
    flatFee: 50,
  },
  {
    hoursBeforePickup: 2, // 2 to 6 hours before
    feePercent: 25,
    flatFee: 100,
  },
  {
    hoursBeforePickup: 0, // < 2 hours before
    feePercent: 50,
    flatFee: 200,
  },
];

export const defaultFareConfig: FareConfig = {
  id: 'current_config',
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  currencySymbol: '₹',
  gstPercent: 5,
  peakHourMultipliers: [
    {
      name: 'Morning Rush',
      startHour: 8,
      endHour: 11,
      multiplier: 1.2,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    {
      name: 'Evening Rush',
      startHour: 17,
      endHour: 21,
      multiplier: 1.25,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
  ],
  festivalMultiplier: {
    enabled: false,
    multiplier: 1.15,
    name: 'Festival Festive Peak',
  },
  ratesByVehicle: defaultVehicleFareConfigs,
  rentalPackages: defaultRentalPackages,
  airportZones: defaultAirportZones,
  cancellationSlabs: defaultCancellationSlabs,
};
