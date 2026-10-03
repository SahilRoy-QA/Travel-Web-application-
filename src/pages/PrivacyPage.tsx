import React from 'react';
import { useSettings } from '../context/SettingsContext';

export const PrivacyPage: React.FC = () => {
  const { branding } = useSettings();

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs prose prose-slate">
        <h1 className="text-3xl font-black text-slate-900 mb-6">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Effective Date: October 2026</p>

        <section className="space-y-4 text-sm text-slate-600 leading-relaxed mt-6">
          <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            {branding.brandName} collects personal details such as your Name, Email Address, Contact Phone Number, and travel booking details solely to facilitate reservations, provide digital vouchers, and offer customer support.
          </p>

          <h2 className="text-lg font-bold text-slate-900">2. How We Protect Your Data</h2>
          <p>
            All user data and transactions are encrypted in transit using industry-standard TLS / 256-bit SSL encryption. We enforce zero-trust Attribute-Based Access Control on our Cloud Firestore database.
          </p>

          <h2 className="text-lg font-bold text-slate-900">3. Google Play Store & TWA Compliance</h2>
          <p>
            When utilizing our Android Trusted Web Activity application, device network states and offline service worker caches are managed locally without unauthorized third-party tracking.
          </p>

          <h2 className="text-lg font-bold text-slate-900">4. User Rights and Deletion</h2>
          <p>
            Users may request full deletion of their account profile and personal records at any time by emailing <strong>{branding.contactEmail}</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
