import {
  FareConfig,
  FareCalculationInput,
  FareBreakdown,
  CabBooking,
  CabVehicleType,
  VehicleFareConfig,
  CancellationSlab,
} from '../types/cab';
import { defaultFareConfig } from './defaultCabFareConfig';

/**
 * Checks if a given timestamp falls into the night surcharge window.
 */
export function isNightTime(
  dateIsoOrObj: string | Date,
  startHour: number = 23,
  endHour: number = 5
): boolean {
  const date = typeof dateIsoOrObj === 'string' ? new Date(dateIsoOrObj) : dateIsoOrObj;
  const hours = date.getHours();
  // e.g. 23 to 5 means hour >= 23 OR hour < 5
  if (startHour > endHour) {
    return hours >= startHour || hours < endHour;
  }
  return hours >= startHour && hours < endHour;
}

/**
 * Gets active peak hour multiplier if applicable.
 */
export function getPeakMultiplier(
  dateIsoOrObj: string | Date,
  config: FareConfig
): number {
  const date = typeof dateIsoOrObj === 'string' ? new Date(dateIsoOrObj) : dateIsoOrObj;
  const hour = date.getHours();
  const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat

  // Check festival multiplier first
  if (config.festivalMultiplier?.enabled) {
    return config.festivalMultiplier.multiplier;
  }

  // Check peak hour slots
  if (config.peakHourMultipliers && config.peakHourMultipliers.length > 0) {
    for (const slot of config.peakHourMultipliers) {
      const matchDay = !slot.daysOfWeek || slot.daysOfWeek.includes(dayOfWeek);
      const matchHour =
        slot.startHour <= slot.endHour
          ? hour >= slot.startHour && hour < slot.endHour
          : hour >= slot.startHour || hour < slot.endHour;

      if (matchDay && matchHour) {
        return slot.multiplier;
      }
    }
  }

  return 1.0;
}

/**
 * Calculates calendar days difference between two dates. Minimum 1 day.
 */
export function calculateTripDays(
  pickupIso: string,
  returnIso?: string,
  minKmPerDay: number = 250,
  distanceKm: number = 0
): number {
  if (returnIso) {
    const start = new Date(pickupIso);
    const end = new Date(returnIso);
    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, days);
  }
  // If no return date provided for outstation, estimate from distance
  return Math.max(1, Math.ceil(distanceKm / minKmPerDay));
}

/**
 * Add-on pricing catalog in INR.
 */
export const ADD_ON_PRICING = {
  childSeat: 150,
  luggageCarrier: 200,
  petFriendly: 200,
};

/**
 * Pure, unit-testable fare engine for all trip types.
 */
export function calculateFare(
  input: FareCalculationInput,
  config: FareConfig = defaultFareConfig
): FareBreakdown {
  const vehicleType: CabVehicleType = input.vehicleType || 'sedan';
  const vConfig: VehicleFareConfig =
    config.ratesByVehicle[vehicleType] || config.ratesByVehicle.sedan;

  const pickupDate = new Date(input.pickupDateTime || Date.now());
  const nightActive = isNightTime(
    pickupDate,
    vConfig.nightSurcharge.startHour,
    vConfig.nightSurcharge.endHour
  );
  const peakMultiplier = getPeakMultiplier(pickupDate, config);

  let baseFare = 0;
  let distanceFare = 0;
  let durationFare = 0;
  let rentalPackageFare = 0;
  let rentalExtraKmFare = 0;
  let rentalExtraHourFare = 0;
  let rentalPackageName: string | undefined;
  let airportFlatFare = 0;
  let waitingCharge = 0;
  let nightSurcharge = 0;
  let driverAllowance = 0;
  let nightHaltCharge = 0;
  let outstationDays = 0;
  let tollEstimate = 0;

  // 1. Calculate base components based on trip type
  switch (input.tripType) {
    case 'airport': {
      // Look for airport flat fare zone
      const zone = input.airportZoneId
        ? config.airportZones.find((z) => z.zoneId === input.airportZoneId)
        : null;

      if (zone && zone.fares[vehicleType]) {
        airportFlatFare = zone.fares[vehicleType];
        baseFare = airportFlatFare;
        // In flat zones, distance/time are included in the flat rate
      } else {
        // Fallback distance-based airport ride
        baseFare = vConfig.baseFare;
        const extraKm = Math.max(0, input.distanceKm - vConfig.baseKm);
        distanceFare = extraKm * vConfig.perKmRate;
        const extraMinutes = Math.max(0, input.durationMinutes - vConfig.baseMinutes);
        durationFare = extraMinutes * vConfig.perMinuteRate;
      }

      // Waiting charges
      if (input.waitingMinutes && input.waitingMinutes > vConfig.freeWaitingMinutes) {
        waitingCharge =
          (input.waitingMinutes - vConfig.freeWaitingMinutes) * vConfig.waitingChargePerMinute;
      }

      // Airport parking / toll handling
      tollEstimate =
        input.tollAmountOverride !== undefined
          ? input.tollAmountOverride
          : Math.round(input.distanceKm * vConfig.tollEstimatePerKm);
      break;
    }

    case 'point_to_point': {
      baseFare = vConfig.baseFare;
      const extraKm = Math.max(0, input.distanceKm - vConfig.baseKm);
      distanceFare = extraKm * vConfig.perKmRate;

      const extraMinutes = Math.max(0, input.durationMinutes - vConfig.baseMinutes);
      durationFare = extraMinutes * vConfig.perMinuteRate;

      // Waiting charge
      if (input.waitingMinutes && input.waitingMinutes > vConfig.freeWaitingMinutes) {
        waitingCharge =
          (input.waitingMinutes - vConfig.freeWaitingMinutes) * vConfig.waitingChargePerMinute;
      }

      // Enforce minimum fare before surcharges
      const rawRunFare = baseFare + distanceFare + durationFare;
      if (rawRunFare < vConfig.minimumFare) {
        baseFare = vConfig.minimumFare;
        distanceFare = 0;
        durationFare = 0;
      }

      tollEstimate =
        input.tollAmountOverride !== undefined
          ? input.tollAmountOverride
          : Math.round(input.distanceKm * vConfig.tollEstimatePerKm);
      break;
    }

    case 'rental': {
      // Look up rental package
      const pkg =
        config.rentalPackages.find((p) => p.id === input.rentalPackageId) ||
        config.rentalPackages[0];

      rentalPackageName = pkg.name;
      rentalPackageFare = pkg.basePrice[vehicleType];
      baseFare = rentalPackageFare;

      // Extra km
      const extraKm =
        input.extraRentalKm !== undefined
          ? input.extraRentalKm
          : Math.max(0, input.distanceKm - pkg.includedKm);
      rentalExtraKmFare = extraKm * pkg.extraKmRate[vehicleType];

      // Extra hours
      const extraHours =
        input.extraRentalHours !== undefined
          ? input.extraRentalHours
          : Math.max(
              0,
              Math.ceil((input.durationMinutes - pkg.durationHours * 60) / 60)
            );
      rentalExtraHourFare = extraHours * pkg.extraHourRate[vehicleType];

      tollEstimate =
        input.tollAmountOverride !== undefined
          ? input.tollAmountOverride
          : Math.round(input.distanceKm * vConfig.tollEstimatePerKm);
      break;
    }

    case 'outstation_one_way': {
      outstationDays = calculateTripDays(
        input.pickupDateTime,
        undefined,
        vConfig.outstationMinKmPerDay,
        input.distanceKm
      );

      // Minimum billable km
      const billableKm = Math.max(input.distanceKm, vConfig.outstationMinKmPerDay);
      distanceFare = billableKm * vConfig.outstationPerKmRate;
      baseFare = vConfig.baseFare;

      driverAllowance = outstationDays * vConfig.driverAllowancePerDay;

      // Night halt charge if multi-day
      if (outstationDays > 1) {
        nightHaltCharge = (outstationDays - 1) * vConfig.nightHaltCharge;
      }

      tollEstimate =
        input.tollAmountOverride !== undefined
          ? input.tollAmountOverride
          : Math.round(billableKm * vConfig.tollEstimatePerKm);
      break;
    }

    case 'outstation_round_trip': {
      outstationDays = calculateTripDays(
        input.pickupDateTime,
        input.returnDateTime,
        vConfig.outstationMinKmPerDay,
        input.distanceKm
      );

      // Round trip distance is 2x one-way unless distanceKm is already full journey
      const journeyDistance = input.distanceKm * 2;
      const minRequiredKm = outstationDays * vConfig.outstationMinKmPerDay;
      const billableKm = Math.max(journeyDistance, minRequiredKm);

      distanceFare = billableKm * vConfig.outstationPerKmRate;
      baseFare = vConfig.baseFare;

      driverAllowance = outstationDays * vConfig.driverAllowancePerDay;

      // Night halt charge for each night stayed
      if (outstationDays > 1) {
        nightHaltCharge = (outstationDays - 1) * vConfig.nightHaltCharge;
      }

      tollEstimate =
        input.tollAmountOverride !== undefined
          ? input.tollAmountOverride
          : Math.round(billableKm * vConfig.tollEstimatePerKm);
      break;
    }
  }

  // 2. Base running fare
  const coreRunningFare =
    baseFare +
    distanceFare +
    durationFare +
    rentalExtraKmFare +
    rentalExtraHourFare +
    waitingCharge;

  // 3. Night Surcharge calculation (if pickup is during night window)
  if (nightActive) {
    nightSurcharge = Math.round(
      (coreRunningFare * vConfig.nightSurcharge.percentage) / 100
    );
  }

  // 4. Peak multiplier impact on ride
  let peakSurgeFare = 0;
  if (peakMultiplier > 1.0) {
    peakSurgeFare = Math.round((coreRunningFare + nightSurcharge) * (peakMultiplier - 1.0));
  }

  // 5. Add-ons pricing
  let addOnsFare = 0;
  if (input.addOns) {
    if (input.addOns.childSeat) addOnsFare += ADD_ON_PRICING.childSeat;
    if (input.addOns.luggageCarrier) addOnsFare += ADD_ON_PRICING.luggageCarrier;
    if (input.addOns.petFriendly) addOnsFare += ADD_ON_PRICING.petFriendly;
  }

  // 6. Subtotal before taxes & coupons
  const subtotal = Math.round(
    coreRunningFare +
      nightSurcharge +
      peakSurgeFare +
      driverAllowance +
      nightHaltCharge +
      tollEstimate +
      addOnsFare
  );

  // 7. Coupon Discount
  let discountAmount = 0;
  if (input.couponDiscountValue && input.couponDiscountValue > 0) {
    if (input.couponType === 'flat') {
      discountAmount = Math.min(input.couponDiscountValue, subtotal);
    } else {
      const pct = (subtotal * input.couponDiscountValue) / 100;
      const cap = input.couponMaxDiscount || Infinity;
      discountAmount = Math.min(Math.min(pct, cap), subtotal);
    }
    discountAmount = Math.round(discountAmount);
  }

  // 8. Taxes (GST - 5% default for transport services)
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstPercent = config.gstPercent !== undefined ? config.gstPercent : 5;
  const gstAmount = Math.round((taxableAmount * gstPercent) / 100);

  // 9. Final Grand Total
  const finalTotal = taxableAmount + gstAmount;

  // 10. Advance Amount (20% option rounded to nearest rupee)
  const advanceAmount = Math.round(finalTotal * 0.2);
  const remainingAmount = finalTotal - advanceAmount;

  return {
    tripType: input.tripType,
    vehicleType,
    baseFare: Math.round(baseFare),
    distanceKm: input.distanceKm,
    distanceFare: Math.round(distanceFare),
    durationMinutes: input.durationMinutes,
    durationFare: Math.round(durationFare),
    rentalPackageName,
    rentalPackageFare: Math.round(rentalPackageFare),
    rentalExtraKmFare: Math.round(rentalExtraKmFare),
    rentalExtraHourFare: Math.round(rentalExtraHourFare),
    airportFlatFare: Math.round(airportFlatFare),
    waitingCharge: Math.round(waitingCharge),
    nightSurcharge,
    isNightSurchargeApplied: nightActive,
    peakHourMultiplier: peakMultiplier,
    driverAllowance: Math.round(driverAllowance),
    outstationDays,
    nightHaltCharge: Math.round(nightHaltCharge),
    tollEstimate: Math.round(tollEstimate),
    addOnsFare,
    subtotal,
    discountAmount,
    taxableAmount,
    gstAmount,
    finalTotal,
    advanceAmount,
    remainingAmount,
    configVersion: config.version,
  };
}

/**
 * Calculates cancellation fee based on slabs and time before pickup.
 */
export function calculateCancellationFee(
  booking: CabBooking,
  config: FareConfig = defaultFareConfig,
  cancelTime: Date = new Date()
): number {
  const pickupTime = new Date(booking.pickupDateTime).getTime();
  const nowTime = cancelTime.getTime();
  const diffHours = (pickupTime - nowTime) / (1000 * 60 * 60);

  // If already past pickup time
  if (diffHours <= 0) {
    return Math.round(booking.fareBreakdown.baseFare * 0.75);
  }

  // Sort slabs descending by hoursBeforePickup
  const slabs: CancellationSlab[] = [...config.cancellationSlabs].sort(
    (a, b) => b.hoursBeforePickup - a.hoursBeforePickup
  );

  for (const slab of slabs) {
    if (diffHours >= slab.hoursBeforePickup) {
      const pctFee = (booking.fareBreakdown.baseFare * slab.feePercent) / 100;
      const fee = Math.max(pctFee, slab.flatFee || 0);
      return Math.round(fee);
    }
  }

  return 0;
}

/**
 * Server-side / transaction fare verification.
 * Recomputes fare and checks if the client-submitted final total matches within allowable tolerance.
 */
export function verifyBookingFare(
  clientTotal: number,
  input: FareCalculationInput,
  config: FareConfig = defaultFareConfig,
  tolerance = 2
): { isValid: boolean; expectedFare: FareBreakdown; diff: number } {
  const expectedFare = calculateFare(input, config);
  const diff = Math.abs(clientTotal - expectedFare.finalTotal);
  return {
    isValid: diff <= tolerance,
    expectedFare,
    diff,
  };
}
