# ILLUSION: Google Play Store TWA (Bubblewrap) Deployment Guide

This guide details how to bundle the ILLUSION Progressive Web App into a native Android Application Package (APK) and Android App Bundle (AAB) for Google Play Store publication using the **Bubblewrap CLI** (Trusted Web Activity).

---

## 1. Prerequisites

Before running Bubblewrap locally on your development machine, ensure you have:
1. **Node.js**: v18.0+ or v20.0+ (`node -v`)
2. **Java Development Kit (JDK 17)**: OpenJDK 17 or Oracle JDK 17 installed and configured in your `JAVA_HOME`.
3. **Android SDK Command-Line Tools & Platform Tools**: Installed (via Android Studio or standalone).
4. **Deployed HTTPS URL**: The production domain hosting your web app (e.g., `https://your-domain.web.app` or your Cloud Run URL).

Test your environment with:
```bash
npx @bubblewrap/cli doctor
```
Follow any prompts to configure JDK and Android SDK paths.

---

## 2. Bubblewrap Installation & Initialization

Install Bubblewrap CLI globally:
```bash
npm install -g @bubblewrap/cli
```

Initialize your TWA project using your deployed manifest URL:
```bash
bubblewrap init --manifest=https://[YOUR_DEPLOYED_DOMAIN]/manifest.webmanifest
```

When prompted by the wizard, enter:
- **Application ID**: `com.illusion.travel`
- **App Name**: `ILLUSION Travel & Hotels`
- **Launcher Name**: `ILLUSION`
- **Display Mode**: `standalone`
- **Status Bar Color (Light)**: `#FFFFFF`
- **Status Bar Color (Dark)**: `#0B1120` (`themeColorDark` in `twa-manifest.json`)
- **Navigation Bar Color (Light)**: `#FFFFFF`
- **Navigation Bar Color (Dark)**: `#0B1120` (`navigationColorDark` in `twa-manifest.json`)
- **Icon URL**: `https://[YOUR_DEPLOYED_DOMAIN]/pwa-512x512.png`
- **Maskable Icon URL**: `https://[YOUR_DEPLOYED_DOMAIN]/pwa-maskable-512x512.png`
- **Start URL**: `/`
- **Splash Screen Fade-out**: `300ms`
- **Notifications**: Enabled

### Android TWA Dark Mode & Manifest Trade-Off
- **Web App Manifest Specification Constraint**: The W3C Web App Manifest spec currently allows only a single static `theme_color` and `background_color`. To ensure the native splash screen never flashes bright white when the user's Android system is set to Dark Mode, `backgroundColor` in `twa-manifest.json` is set to the neutral luxury deep tone `#0B1120`.
- **Bubblewrap Dynamic Dark Mode Support**: Bubblewrap CLI natively supports `themeColorDark`, `navigationColorDark`, and `navigationDividerColorDark` in `twa-manifest.json`. The native Android Chrome Custom Tab automatically switches the system status bar and navigation bar to `#0B1120` when Android is in Dark Mode, and to `#FFFFFF` in Light Mode!
- **Runtime PWA Synchronization**: In standard browser and PWA windows, `<meta name="theme-color">` dynamically updates between `#FFFFFF` and `#0B1120` when the user toggles between Light, Dark, or System mode.

> **Tip**: A ready-to-use template is already generated at `/android-twa/twa-manifest.json`. You can place it in your local folder and run `bubblewrap build` directly!

---

## 3. Creating & Securing Your Signing Keystore

Run the following command to generate a production Android release keystore:
```bash
keytool -genkey -v -keystore illusion-keystore.jks -alias illusion-twa -keyalg RSA -keysize 2048 -validity 10000
```
- Store the keystore and password in a secure password manager.
- **NEVER commit the keystore or passwords to git.** The `.gitignore` has already been configured to exclude `*.jks`, `*.keystore`, and `android-twa/` secrets.

---

## 4. Building the APK and Play Store AAB

Build the release bundle:
```bash
bubblewrap build
```
This generates:
- `app-release-bundle.aab`: The Android App Bundle to upload to **Google Play Console**.
- `app-release-signed.apk`: The test APK to install directly on physical Android test devices.

To test directly on an attached Android device via USB debugging:
```bash
bubblewrap install
```

---

## 5. Digital Asset Links Verification (Eliminate URL Bar)

For a Trusted Web Activity to render seamlessly without the browser URL bar, Google requires cryptographically matching Digital Asset Links.

1. Retrieve the SHA-256 fingerprint from your local keystore:
   ```bash
   bubblewrap fingerprint
   ```
   Or:
   ```bash
   keytool -list -v -keystore illusion-keystore.jks -alias illusion-twa
   ```
2. When you enable **Play App Signing** in Google Play Console (under **Release > Setup > App integrity**), copy Google's **App signing key SHA-256 fingerprint**.
3. Update `public/.well-known/assetlinks.json` in your repository with **both** SHA-256 fingerprints:
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.illusion.travel",
         "sha256_cert_fingerprints": [
           "YOUR_LOCAL_KEYSTORE_SHA256_FINGERPRINT",
           "GOOGLE_PLAY_APP_SIGNING_SHA256_FINGERPRINT"
         ]
       }
     }
   ]
   ```
4. Deploy the updated `assetlinks.json`. Verify it at:
   `https://[YOUR_DOMAIN]/.well-known/assetlinks.json`
   (must serve `Content-Type: application/json` without HTTP-to-HTTPS redirect loops).
5. Test using the Google Asset Links Tool:
   https://developers.google.com/digital-asset-links/tools/generator

---

## 6. Google Play Console Checklist

1. **Google Play Developer Account**: Ensure active console account ($25 one-time registration).
2. **Store Listing Assets**:
   - App Icon: 512x512 PNG (provided in `/public/pwa-512x512.png`).
   - Feature Graphic: 1024x500 JPG/PNG.
   - Phone & Tablet Screenshots: Minimum 2 phone screenshots (portrait 1080x1920 recommended).
3. **Legal URLs**:
   - Privacy Policy: `https://[YOUR_DOMAIN]/privacy` (live in the ILLUSION app)
   - Terms of Service: `https://[YOUR_DOMAIN]/terms` (live in the ILLUSION app)
4. **Data Safety Form**:
   - ILLUSION collects: Name, Email Address, Phone Number (Account management & booking confirmation), Purchase History (Travel bookings), Device/Network status (offline detection).
   - Data is encrypted in transit via HTTPS / TLS.
   - Users can delete their data by contacting support.
5. **Content Rating**: Complete the IARC questionnaire (Travel category: All Ages / Everyone).
6. **Target Audience**: Target age 18+.
7. **Release Tracks**: Upload `app-release-bundle.aab` to **Internal testing** first, verify on device, then promote to **Production**.

---

## 7. Zero-Downtime Over-The-Air (OTA) Updates

- **Web Updates Ship Instantly**: Any UI changes, booking features, styling, or dynamic settings updated on the website reflect **instantly** in the installed Android app without requiring a new Play Store release!
- **Dynamic Hero Photo Carousel**: New carousel background photos, seasonal scheduling, focal points, and animation timing adjustments published in the Admin Carousel Editor (`/admin/carousel`) sync live to all installed Android TWA users over-the-air with **no new AAB compilation needed**.
- **When a new AAB is required**: Only when updating native Android permissions, splash screen, launcher icons, or the Android package ID.
- To update the native wrapper:
  1. Increment `appVersionCode` (e.g., from 1 to 2) and `appVersionName` (e.g., to "1.0.1") in `twa-manifest.json`.
  2. Run `bubblewrap update`.
  3. Run `bubblewrap build`.
  4. Upload the new `.aab` to Play Console.

---

## 8. Payments Policy Compliance Note

Under Google Play Policy section 3 (Monetization and Ads):
- Physical goods and real-world travel accommodations/transportation services (flights, hotels, tour packages, taxi cabs) are **exempt from Google Play Billing** (In-App Purchases).
- Travel booking platforms can and should process payments through real-world payment gateways (Razorpay, Stripe, Pay at Hotel) without paying Google Play's 15-30% digital goods fee.
- Always review the latest Google Play Payments policy before publication.

---

## 9. Convenience NPM Scripts

The repository includes pre-configured helper commands:
```bash
npm run pwa:icons    # Regenerate all PWA PNG icons and SVGs
npm run twa:init     # Run bubblewrap init against the deployed manifest
npm run twa:build    # Build release AAB and APK
npm run twa:update   # Update native TWA project after manifest changes
```
