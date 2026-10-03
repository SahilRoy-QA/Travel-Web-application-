# ILLUSION — Travel & Hotel Booking Platform

ILLUSION is a dynamic, high-performance travel and accommodation booking web platform inspired by MakeMyTrip, with a BookMyShow-style card-and-step checkout flow.

## 🌟 Deliverables Included

1. **Public Customer Web App**:
   - Dynamic Hero Search (Hotels, Tour Packages, Mobility/Cabs).
   - Real-time catalog filtering, sorting, and URL query preservation.
   - Live Room Inventory & Pricing (with Firestore real-time `onSnapshot` listeners).
   - Card-and-Step Booking Flow: Summary → Guest Contact → Price Review & Coupon Validation → Payment Abstraction → Instant Confirmation Voucher with QR Code.
   - Double-booking prevention via Cloud Firestore transactions.
   - My Trips reservation hub with in-policy cancellations.
   - Verified guest review system.

2. **Secure Admin Back-Office Panel (`/admin`)**:
   - Real-time KPI cards (Gross Revenue, Total Bookings, Occupancy %, Registered Customers).
   - Site Builder: Dynamic branding (logo, primary/accent colors applied through CSS variables at runtime), homepage section reordering/visibility toggles, and feature flags.
   - Accommodations Manager: Full CRUD for hotels, room categories, base prices, photos, and inventory blockers.
   - Holiday Packages Manager: Day-wise interactive itinerary builder, departure dates, inclusions/exclusions, pricing.
   - Tour Agents Manager: Partner onboarding, commission %, approval & suspension.
   - Mobility & Services Manager: Airport cabs, scuba diving, and yacht transfers.
   - Reservations & Sales Table: Status updates, refund tracking, and 1-click CSV export.
   - Customer Management: RBAC tiers and block/unblock controls.
   - Offers & Coupons: Promo codes with min-booking rules and homepage banner cards.
   - Reviews Moderation.
   - Platform Settings & Demo Data Seeder ("Load Demo Data").

3. **Installable PWA & Google Play Store Trusted Web Activity (TWA)**:
   - Web App Manifest (`/manifest.webmanifest`) with shortcuts (`My Trips`, `Search Hotels`) and 192px/512px/maskable icons.
   - Service Worker via Workbox caching app shell, images, and fonts with offline fallback page (`/offline`).
   - Digital Asset Links template (`public/.well-known/assetlinks.json`).
   - Pre-configured Bubblewrap CLI manifest (`/android-twa/twa-manifest.json`).
   - Full Play Store submission guide (`/docs/PLAYSTORE.md`).

---

## 🔑 Bootstrapped Super Admin & Roles

- **Super Admin**: The user account registered or signed into with the email address `roysahil579@gmail.com` is automatically elevated to `super_admin` role in Firestore and security rules.
- **Roles in `users/{uid}.role`**:
  - `customer`: Default role for all new users.
  - `agent`: Certified tour agency partner who can create, edit, and view their own packages and bookings.
  - `admin` and `super_admin`: Full access to the platform back-office at `/admin`.
- **Security Invariant**: Clients cannot self-escalate roles. Hardened rules prevent unauthorized role or status edits.

---

## 🚀 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Generate PWA Icons** (optional, already pre-generated in `/public`):
   ```bash
   npm run pwa:icons
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Verify TypeScript & Build**:
   ```bash
   npm run lint
   npm run build
   ```

---

## 🌐 Firebase & Deployment Configuration

### Firestore Security Rules
The production rules are defined in `firestore.rules` and deployed to your Cloud Firestore instance.

### Firebase Hosting Configuration (`firebase.json`)
For optimal PWA and TWA support, ensure SPA rewrites and proper header definitions:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/.well-known/assetlinks.json",
        "headers": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ]
      },
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

---

## 📱 Google Play Store Wrapper Guide

For step-by-step instructions on generating the Android release `.aab` using Bubblewrap CLI, keystore creation, and Google Play Console checklist, see:
👉 **[/docs/PLAYSTORE.md](/docs/PLAYSTORE.md)**
