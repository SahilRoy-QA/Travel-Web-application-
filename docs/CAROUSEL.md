# Hero Photo Carousel Management Guide

This document describes how to manage the full-bleed background photo carousel on the ILLUSION homepage using the Admin Carousel Editor (`/admin/carousel`).

---

## 1. Overview & Architecture

The hero section uses a 4-layer composition:
1. **Background Photo Carousel (`z-0`)**: Dynamic high-resolution rotating travel photography with crossfade, slide, or Ken Burns slow zoom.
2. **Readability Gradient Scrim (`z-[1]`)**: Darkened gradient at the bottom-left ensuring all headline copy, search widget tabs, and inputs meet WCAG AA contrast against any photograph in both Light and Dark mode.
3. **Decorative Dotted Pattern (`z-[2]`)**: Radial dot grid overlay rendered with the brand primary CSS variable (`var(--brand-primary)`) at customizable opacity.
4. **Interactive Hero Content (`z-[3]`)**: Search widget, tabs, destination chips, and quick filters.

---

## 2. Managing Slides in the Admin Console

Navigate to **Admin Console > Carousel Editor** (`/admin/carousel`) in your sidebar.

### A. Adding New Photos
1. Switch to the **Upload Photos** tab.
2. Drag and drop single or multiple JPG, PNG, or WebP files (up to 10 MB each).
3. The platform will automatically:
   - Resize and compress to **1920px Desktop WebP** (approx. 180–300 KB).
   - Generate a portrait-friendly **800px Mobile WebP** crop for smartphones.
   - Generate a small **300px Thumbnail**.
   - Upload them to Firebase Storage (with an instant client-side WebP fallback).
4. New slides appear immediately in the **Manage Slides** list.

### B. Setting the Image Focal Point
Different screen sizes crop photos differently. To ensure the key subject (e.g. a palace arch, infinity pool, or mountain peak) remains in view:
1. Click **Edit** on any slide card.
2. Under **Focal Point Picker**, click directly on the area of interest in the photo.
3. Check the **Desktop Preview (16:9)** and **Mobile Preview (Portrait)** live crop boxes below to verify the framing.
4. Click **Save Slide**.

### C. Reordering Slides
- Use the **Up (↑)** and **Down (↓)** arrows on each slide card.
- Reordering is saved in real time via batched Firestore updates and updates customer homepages live without reloading.

### D. Replacing a Photo
- To swap the image of an existing slide without losing its caption, link target, or scheduling dates:
  1. Click **Edit** on the slide.
  2. Click **Replace Photo** at the top right of the modal.
  3. Select the new image file. It will be compressed and swapped in place.

### E. Scheduling Seasonal or Festive Banners
- In the slide editor, enter a **Publish Start Date** and/or **Publish End Date**.
- The slide will only appear in the customer hero during that active date window.
- Status badges will clearly indicate `Scheduled` or `Expired`.

---

## 3. Global Engine & Timing Settings

Under the **Carousel Timings & Overlay** tab:
- **Master Toggle**: Enable or disable the background carousel entirely.
- **Rotation Interval**: Adjust slider between 2.0s and 15.0s (default: 5.0s).
- **Animation Curve**: Select **Crossfade**, **Slide Right**, or **Ken Burns Zoom**.
- **Animation Duration**: Adjust duration slider from 300ms to 2000ms.
- **Scrim Opacity**: Fine-tune contrast for Light Mode (default: 45%) and Dark Mode (default: 65%).
- **Brand Dotted Pattern**: Enable/disable and adjust opacity (default: 20%).
- **Interactive Controls**: Toggle Caption Chip, Dot Indicators, and Arrow Buttons.

---

## 4. Live Preview & QA Controls

At the top of the Carousel Editor:
- **Desktop / Mobile Toggle**: Switch between full 16:9 desktop viewport and simulated smartphone portrait frame.
- **Light / Dark Mode Toggle**: Verify text contrast and scrim strength in both color schemes.
- **Unsaved Changes Bar**: Preview any tweaks live, then click **Save & Publish Live** or **Discard**.

---

## 5. Performance & Core Web Vitals (LCP)
- The first slide is preloaded with `fetchpriority="high"` and `loading="eager"` to guarantee **Largest Contentful Paint (LCP) < 2.5s**.
- Subsequent slides are loaded lazily.
- The next slide is preloaded right before each rotation to eliminate white/blank flashes.
- Automatic pause when the browser tab is hidden (Page Visibility API) or when the user has `prefers-reduced-motion: reduce`.
- Cached in `localStorage` so offline PWA users and repeat visitors see background photos instantly.

---

## 6. Manual Steps Outside AI Studio (Optional)

1. **Firebase Storage Bucket (Production Deploy)**:
   - Ensure Firebase Storage is enabled in the Firebase Console under **Build > Storage**.
   - Copy the rules from `/storage.rules` to **Storage > Rules** tab.
2. **Firestore Compound Indexes**:
   - If querying active slides sorted by order, deploy the index specified in `/firestore.indexes.json` using the Firebase CLI:
     ```bash
     firebase deploy --only firestore:indexes,storage
     ```
