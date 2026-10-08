import {
  calculateFare,
  calculateCancellationFee,
  verifyBookingFare,
  isNightTime,
  getPeakMultiplier,
} from '../cabFareEngine';
import { defaultFareConfig } from '../defaultCabFareConfig';
import { FareCalculationInput, CabBooking } from '../../types/cab';

// Lightweight assertion runner for zero-dependency test execution
export function runCabFareEngineTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${testName}`);
    } else {
      failed++;
      const msg = `FAIL: ${testName} ${detail ? `- ${detail}` : ''}`;
      errors.push(msg);
      console.error(`  ✗ ${msg}`);
    }
  }

  console.log('\n--- Running Cab Fare Engine Unit Tests ---');

  // Test 1: Local Point-to-Point Standard Ride
  {
    const input: FareCalculationInput = {
      tripType: 'point_to_point',
      vehicleType: 'sedan',
      distanceKm: 14,
      durationMinutes: 40,
      pickupDateTime: '2026-10-15T14:30:00Z', // Afternoon (no night surcharge)
    };
    const fare = calculateFare(input, defaultFareConfig);

    // Sedan: baseFare = 160 (covers 4km, 15min)
    // Extra km = 10km * 16 = 160
    // Extra min = 25min * 2 = 50
    // Core run = 160 + 160 + 50 = 370
    // Toll = 14 * 1.8 = 25.2 -> 25
    // Subtotal = 370 + 25 = 395
    // GST = 5% of 395 = 20 (rounded)
    // Total = 415
    assert(fare.baseFare === 160, 'P2P: Sedan base fare is 160');
    assert(fare.distanceFare === 160, 'P2P: Distance fare for 14km is 160');
    assert(fare.durationFare === 50, 'P2P: Duration fare for 40min is 50');
    assert(fare.gstAmount === Math.round((fare.taxableAmount * 5) / 100), 'P2P: GST is 5%');
    assert(fare.finalTotal === fare.taxableAmount + fare.gstAmount, 'P2P: Final total equals taxable + GST');
    assert(fare.advanceAmount === Math.round(fare.finalTotal * 0.2), 'P2P: Advance amount is 20%');
  }

  // Test 2: Local Point-to-Point with Minimum Fare Enforcement
  {
    const input: FareCalculationInput = {
      tripType: 'point_to_point',
      vehicleType: 'hatchback',
      distanceKm: 1,
      durationMinutes: 5,
      pickupDateTime: '2026-10-15T14:00:00Z',
    };
    const fare = calculateFare(input, defaultFareConfig);
    // Minimum fare for hatchback is 100
    assert(fare.subtotal >= 100, 'P2P: Enforces minimum fare for short rides');
  }

  // Test 3: Airport Transfer with Flat Zone Fare
  {
    const input: FareCalculationInput = {
      tripType: 'airport',
      vehicleType: 'sedan',
      distanceKm: 28,
      durationMinutes: 50,
      pickupDateTime: '2026-10-15T15:00:00Z',
      airportZoneId: 'delhi_igi_t3_central', // flat fare 850 for sedan
    };
    const fare = calculateFare(input, defaultFareConfig);

    assert(fare.airportFlatFare === 850, 'Airport: Flat zone fare applied (850)');
    assert(fare.baseFare === 850, 'Airport: Base fare reflects zone rate');
    assert(fare.distanceFare === 0, 'Airport: Distance fare is 0 for flat zone');
  }

  // Test 4: Airport Transfer Fallback (No flat zone, custom distance)
  {
    const input: FareCalculationInput = {
      tripType: 'airport',
      vehicleType: 'suv',
      distanceKm: 35,
      durationMinutes: 60,
      pickupDateTime: '2026-10-15T15:00:00Z',
      // No airportZoneId provided
    };
    const fare = calculateFare(input, defaultFareConfig);

    assert(fare.airportFlatFare === 0, 'Airport: Fallback computes distance fare when zone is not set');
    assert(fare.distanceFare > 0, 'Airport: Distance fare computed');
  }

  // Test 5: Hourly Rental (4hr / 40km package with extra km & extra hour)
  {
    const input: FareCalculationInput = {
      tripType: 'rental',
      vehicleType: 'sedan',
      distanceKm: 55, // 15 km excess over 40 km
      durationMinutes: 300, // 5 hours -> 1 hour excess over 4 hours
      rentalPackageId: '4hr_40km',
      pickupDateTime: '2026-10-15T10:00:00Z',
    };
    const fare = calculateFare(input, defaultFareConfig);

    // Sedan 4hr_40km base: 1299
    // Extra 15 km * 17 = 255
    // Extra 1 hour * 190 = 190
    assert(fare.rentalPackageFare === 1299, 'Rental: Base package fare is 1299');
    assert(fare.rentalExtraKmFare === 255, 'Rental: Extra km fare is 255 (15km * 17)');
    assert(fare.rentalExtraHourFare === 190, 'Rental: Extra hour fare is 190 (1hr * 190)');
    assert(fare.rentalPackageName === '4 Hours / 40 km', 'Rental: Package name matched');
  }

  // Test 6: Outstation One-Way Trip
  {
    const input: FareCalculationInput = {
      tripType: 'outstation_one_way',
      vehicleType: 'sedan',
      distanceKm: 180, // Less than min 250km/day
      durationMinutes: 240,
      pickupDateTime: '2026-10-15T06:00:00Z',
    };
    const fare = calculateFare(input, defaultFareConfig);

    // Billable km is minimum 250 km
    // Sedan outstation rate = 14.5
    // Distance fare = 250 * 14.5 = 3625
    // Driver allowance = 1 day * 350 = 350
    assert(fare.outstationDays === 1, 'Outstation One-Way: Estimated 1 day');
    assert(fare.distanceFare === 250 * 14.5, 'Outstation One-Way: Enforces min 250km billing');
    assert(fare.driverAllowance === 350, 'Outstation One-Way: Driver allowance is 350');
  }

  // Test 7: Outstation Round-Trip (Multi-day with night halt)
  {
    const input: FareCalculationInput = {
      tripType: 'outstation_round_trip',
      vehicleType: 'suv',
      distanceKm: 300, // One-way distance -> round-trip is 600km
      durationMinutes: 720,
      pickupDateTime: '2026-10-15T06:00:00Z',
      returnDateTime: '2026-10-17T20:00:00Z', // 3 days trip
    };
    const fare = calculateFare(input, defaultFareConfig);

    // Days = 3 days
    // SUV min km = 3 days * 300 = 900 km. Journey = 600 km -> billable = 900 km
    // SUV rate = 19 -> distanceFare = 900 * 19 = 17100
    // Driver allowance = 3 days * 400 = 1200
    // Night halt = 2 nights * 600 = 1200
    assert(fare.outstationDays === 3, 'Outstation Round-Trip: 3 days calculated');
    assert(fare.driverAllowance === 1200, 'Outstation Round-Trip: Driver allowance for 3 days');
    assert(fare.nightHaltCharge === 1200, 'Outstation Round-Trip: Night halt charge for 2 nights');
  }

  // Test 8: Night Surcharge Detection and Fare Application
  {
    // 23:30 is night time
    const nightDate = new Date('2026-10-15T23:30:00');
    assert(isNightTime(nightDate, 23, 5) === true, 'Night time detection for 23:30');

    // 14:00 is not night time
    const dayDate = new Date('2026-10-15T14:00:00');
    assert(isNightTime(dayDate, 23, 5) === false, 'Day time detection for 14:00');

    // Calculate fare with night time
    const input: FareCalculationInput = {
      tripType: 'point_to_point',
      vehicleType: 'sedan',
      distanceKm: 10,
      durationMinutes: 20,
      pickupDateTime: '2026-10-15T23:30:00', // 23:30 local
    };
    const fare = calculateFare(input, defaultFareConfig);
    assert(fare.isNightSurchargeApplied === true, 'Night surcharge applied flag');
    assert(fare.nightSurcharge > 0, 'Night surcharge amount > 0');
  }

  // Test 9: Add-Ons (Child Seat + Luggage Carrier)
  {
    const input: FareCalculationInput = {
      tripType: 'point_to_point',
      vehicleType: 'sedan',
      distanceKm: 10,
      durationMinutes: 20,
      pickupDateTime: '2026-10-15T12:00:00Z',
      addOns: {
        childSeat: true,
        luggageCarrier: true,
      },
    };
    const fare = calculateFare(input, defaultFareConfig);
    assert(fare.addOnsFare === 350, 'Add-ons: Child seat (150) + Luggage carrier (200) = 350');
  }

  // Test 10: Coupon Deductions (Flat vs Percentage)
  {
    // Flat coupon: ₹100 off
    const inputFlat: FareCalculationInput = {
      tripType: 'point_to_point',
      vehicleType: 'sedan',
      distanceKm: 15,
      durationMinutes: 30,
      pickupDateTime: '2026-10-15T12:00:00Z',
      couponDiscountValue: 100,
      couponType: 'flat',
    };
    const fareFlat = calculateFare(inputFlat, defaultFareConfig);
    assert(fareFlat.discountAmount === 100, 'Coupon: Flat ₹100 discount applied');

    // Percentage coupon: 10% off with max cap of ₹150
    const inputPct: FareCalculationInput = {
      tripType: 'rental',
      vehicleType: 'suv',
      distanceKm: 40,
      durationMinutes: 240,
      rentalPackageId: '4hr_40km',
      pickupDateTime: '2026-10-15T12:00:00Z',
      couponDiscountValue: 10,
      couponType: 'percentage',
      couponMaxDiscount: 150,
    };
    const farePct = calculateFare(inputPct, defaultFareConfig);
    assert(farePct.discountAmount === 150, 'Coupon: 10% capped at maxDiscount ₹150');
  }

  // Test 11: Cancellation Fee Slabs
  {
    const sampleBooking = {
      id: 'cb_test_01',
      pickupDateTime: '2026-10-15T18:00:00Z',
      fareBreakdown: {
        baseFare: 500,
      },
    } as unknown as CabBooking;

    // 30 hours before -> 0% fee
    const cancel30h = new Date('2026-10-14T12:00:00Z');
    const fee30h = calculateCancellationFee(sampleBooking, defaultFareConfig, cancel30h);
    assert(fee30h === 0, 'Cancellation: >24 hours before is ₹0 fee');

    // 10 hours before -> 10% fee (50 INR)
    const cancel10h = new Date('2026-10-15T08:00:00Z');
    const fee10h = calculateCancellationFee(sampleBooking, defaultFareConfig, cancel10h);
    assert(fee10h === 50, 'Cancellation: 6-24 hours before is 10% (₹50)');

    // 1 hour before -> 50% fee (250 INR)
    const cancel1h = new Date('2026-10-15T17:00:00Z');
    const fee1h = calculateCancellationFee(sampleBooking, defaultFareConfig, cancel1h);
    assert(fee1h === 250, 'Cancellation: <2 hours before is 50% (₹250)');
  }

  // Test 12: Server-Side Fare Verification (Tamper Resistance)
  {
    const input: FareCalculationInput = {
      tripType: 'point_to_point',
      vehicleType: 'sedan',
      distanceKm: 20,
      durationMinutes: 45,
      pickupDateTime: '2026-10-15T12:00:00Z',
    };
    const correctFare = calculateFare(input, defaultFareConfig);

    // Legitimate price
    const legitimate = verifyBookingFare(correctFare.finalTotal, input, defaultFareConfig);
    assert(legitimate.isValid === true, 'Verification: Approves accurate calculated fare');

    // Tampered price (e.g. client attempts to pay ₹1)
    const tampered = verifyBookingFare(1, input, defaultFareConfig);
    assert(tampered.isValid === false, 'Verification: Rejects tampered client fare of ₹1');
  }

  console.log(`\nTest Summary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed, errors };
}
