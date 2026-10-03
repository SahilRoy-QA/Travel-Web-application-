# ILLUSION Theming & Design Tokens Guide

This document explains the production light and dark mode architecture for ILLUSION, how semantic design tokens work, and how to author new components that seamlessly support both modes.

---

## 1. Architecture Overview

- **Theme Modes Supported**:
  1. `light`: Pure light mode with clean pearl/white surfaces and rich slate typography.
  2. `dark`: Deep luxury navy/slate surfaces (`#0b1120`, `#0f172a`, `#1e293b`), soft off-white text (`#f8fafc`), and vivid sky/azure calls-to-action.
  3. `system` (Default): Automatically tracks user's operating system via `window.matchMedia('(prefers-color-scheme: dark)')` and updates live without reloading.

- **Persistence**:
  - **Guests**: Stored in browser `localStorage.getItem('illusion_theme')`.
  - **Logged-In Users**: Synchronized across devices to Firestore under `users/{uid}.preferences.theme`. Security rules strictly allow users to update their own `preferences.theme` (validated as `'light' | 'dark' | 'system'`) while barring any updates to security roles or status.

- **Zero Flash of Wrong Theme (FOUT)**:
  - An inline script in `<head>` of `index.html` resolves the stored or system theme **before** React renders.
  - Automatically applies `class="dark"` and `document.documentElement.style.colorScheme` so native form controls, date pickers, and scrollbars render in matching colors immediately.

- **Smooth 200ms Transitions**:
  - Color and background transitions run with `transition: background-color 200ms ease, color 200ms ease`.
  - Automatically disabled when `prefers-reduced-motion: reduce` is active for accessibility.

---

## 2. Design Tokens

The tokens are defined in `src/styles/tokens.ts` and `src/index.css`.

| Token Name | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-background` | `#ffffff` | `#0b1120` | Canvas and page background |
| `--bg-surface` | `#f8fafc` | `#0f172a` | Standard card and section backgrounds |
| `--bg-surface-elevated`| `#ffffff` | `#1e293b` | Modals, popovers, dropdowns, floating sheets |
| `--border-token` | `#e2e8f0` | `#1e293b` | Container and card borders |
| `--text-primary` | `#0f172a` | `#f8fafc` | Headings, titles, high-emphasis text |
| `--text-secondary` | `#475569` | `#94a3b8` | Subtitles, descriptions, secondary copy |
| `--text-muted` | `#94a3b8` | `#64748b` | Timestamps, metadata, placeholders |
| `--brand-primary` | Dynamic / `#0b1120` | Dynamic / `#38bdf8` | Brand mark and primary accents |
| `--brand-accent` | Dynamic / `#0284c7` | Dynamic / `#0284c7` | Main action buttons, active tabs, links |
| `--color-success` | `#10b981` | `#34d399` | Confirmed bookings, verified badges |
| `--color-warning` | `#f59e0b` | `#fbbf24` | Low inventory warnings, pending reviews |
| `--color-danger` | `#ef4444` | `#f87171` | Cancellations, error notices |
| `--ring-token` | `#0284c7` | `#38bdf8` | Keyboard focus ring |

---

## 3. How to Author New Components

When building new components or pages, follow these rules:

### A. Semantic Classes or Tailwind `dark:` Modifiers
Always provide light and dark styles. For example:

```tsx
// Card Component
<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
  <h3 className="text-base font-bold text-slate-900 dark:text-white">
    Card Heading
  </h3>
  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
    Secondary description text.
  </p>
  <button className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-sky-500">
    Action Button
  </button>
</div>
```

### B. Form Inputs
Always ensure form fields define transparent/dark backgrounds and matching borders:
```tsx
<input
  type="text"
  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
/>
```

### C. Shimmer Skeleton Loaders
Use matched pulse backgrounds:
```tsx
<div className="bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
```

### D. Image Dimming
Photos in dark mode are automatically given a subtle softening filter:
`html.dark img:not(.no-dim) { filter: brightness(0.92) contrast(1.02); }`
Add `.no-dim` to logos or diagrams if you want untouched brightness.

---

## 4. Admin Branding & Contrast Verification

1. Go to **Admin Console > Site Builder & Theme**.
2. Under the **Branding & Light/Dark Colors** tab:
   - Configure **Primary** and **Accent** colors for Light Mode.
   - Configure **Dark Primary** and **Dark Accent** overrides (or click **Auto-Compute Dark Palette**).
   - Real-time WCAG AA indicators will calculate the exact contrast ratio against `#ffffff` and `#0b1120`.
   - The **Live Dual-Theme Synchronous Preview** lets you compare how both themes look side-by-side!

---

## 5. Printing Vouchers & Invoices

- On-screen vouchers in `/trips` adapt to the active theme.
- When printing (`window.print()`), the global print stylesheet in `src/index.css` overrides all dark styles:
  ```css
  @media print {
    html, body, html.dark, html.dark body {
      background-color: #ffffff !important;
      color: #000000 !important;
      color-scheme: light !important;
    }
  }
  ```
  This ensures clean, high-contrast, ink-friendly printed vouchers without dark ink waste.

---

## 6. Developer Visual QA Route

Navigate to `/dev/theme-preview` in your browser to inspect all components, swatches, form states, alerts, and loaders in both light and dark mode simultaneously.
