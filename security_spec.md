# ILLUSION Security Specification & Audit

## 1. Data Invariants
1. **RBAC Invariant**: A user document cannot self-assign or escalate role to 'admin' or 'super_admin'. Only `roysahil579@gmail.com` is initial super admin bootstrap, or existing admin can promote.
2. **Booking Immutability**: Once created, a customer cannot alter financial fields (`totalAmount`, `basePrice`, `taxes`, `discountAmount`), `userId`, `bookingNumber`, or `paymentStatus`.
3. **Cancellation State Lock**: Customers can only change `bookingStatus` from 'confirmed'/'pending' to 'cancelled'. Once 'cancelled' or 'completed', terminal state locks prevent client mutation.
4. **Agent Data Isolation**: Tour agents can only create, update, or delete packages where `agentId == request.auth.uid`.
5. **Review Integrity**: Reviews can only be submitted for valid bookings with valid rating (1-5), and must be approved before appearing in public listings.
6. **Settings Protection**: Settings documents can only be written by authenticated administrators.

## 2. The Dirty Dozen Payloads (Expected: PERMISSION_DENIED)
1. **Self-Escalation**: Unauthenticated or normal user writes `role: 'super_admin'` into `users/{uid}`.
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
