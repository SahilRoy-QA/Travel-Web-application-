# ILLUSION Security Specification & Audit

## 1. Data Invariants
1. **RBAC Invariant**: A user document cannot self-assign or escalate role to 'admin' or 'super_admin'. Only `roysahil579@gmail.com` is initial super admin bootstrap, or existing admin can promote.
2. **Booking Immutability**: Once created, a customer cannot alter financial fields (`totalAmount`, `basePrice`, `taxes`, `discountAmount`), `userId`, `bookingNumber`, or `paymentStatus`.
3. **Cancellation State Lock**: Customers can only change `bookingStatus` from 'confirmed'/'pending' to 'cancelled'. Once 'cancelled' or 'completed', terminal state locks prevent client mutation.
4. **Agent Data Isolation**: Tour agents can only create, update, or delete packages where `agentId == request.auth.uid`.
5. **Review Integrity**: Reviews can only be submitted for valid bookings with valid rating (1-5), and must be approved before appearing in public listings.
6. **Settings Protection**: Settings documents can only be written by authenticated administrators.

7. **Cab Booking Access Isolation**: Customers can read only their own cab bookings (`userId == auth.uid`), drivers can read only bookings assigned to them (`driverId == auth.uid`), and admins have full access.
8. **Cab Price Integrity**: Cab fares cannot be altered post-booking or tampered with by clients; fares must match the server-side fare engine calculation based on `fareConfig`.
9. **Driver Status Lockdown**: Drivers can transition booking status only forward through allowed states (`driver_arriving` -> `trip_started` -> `completed`) and cannot change fares, customer information, or reassign trips.
10. **Driver GPS Isolation**: Drivers can publish location telemetry only to their own document `/driverLocations/{driverId}` where `request.auth.uid == driverId`.
11. **Driver KYC Privacy**: Driver KYC documents (licence, RC, insurance) in storage are strictly confidential and accessible only by the driver owner and administrators.
12. **Double Booking Invariant**: A driver or vehicle cannot have two active concurrent trips in overlapping execution windows.

## 2. The Dirty Dozen Payloads (Expected: PERMISSION_DENIED)
1. **Self-Escalation**: Unauthenticated or normal user writes `role: 'super_admin'` or `role: 'admin'` into `users/{uid}`.
2. **Ghost User Injection**: Authenticated user attempts to write profile with UID different from `request.auth.uid`.
3. **Price Manipulation in Booking**: Client attempts to tamper `totalAmount: 1` during checkout.
4. **Post-Booking Alteration**: Customer attempts to modify `bookingStatus: 'confirmed'` to a fake payment status.
5. **Cross-User Booking Read**: User A attempts to read booking belonging to User B.
6. **Agent Hijack**: Agent A attempts to update tour package owned by Agent B.
7. **Public Settings Poisoning**: Anonymous user attempts to update branding or banner in `settings/branding`.
8. **Negative / Arbitrary Review Score**: Customer submits `rating: 100` or `rating: -5`.
9. **Fake Document ID Flooding**: Malicious user passes a 2KB junk string as document ID.
10. **Coupon Creation by Customer**: Customer writes a 99% off coupon into `/coupons`.
11. **Inventory Override by Customer**: Non-admin attempts to block rooms in `/roomInventory`.
12. **Terminal State Break**: Attempt to modify a booking that is already in terminal state ('cancelled' or 'completed').
13. **Cab Price Manipulation**: Malicious customer attempts to submit a cab booking with `fareBreakdown.finalTotal: 10`.
14. **Unauthorized Driver Assignment**: Customer or rogue driver attempts to self-assign a booking by setting `driverId`.
15. **Driver Location Spoofing**: User A attempts to write GPS coordinates into `/driverLocations/{userB}`.
16. **Driver KYC Espionage**: User A attempts to read driver B's driver licence or police verification from `/driverKYC/{driverB}/...`.
17. **Cab Fare Config Tampering**: Non-admin attempts to lower per-km rates in `/fareConfig/current_config`.
