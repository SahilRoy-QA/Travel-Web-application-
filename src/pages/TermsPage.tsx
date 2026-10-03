import React from 'react';
import { useSettings } from '../context/SettingsContext';

export const TermsPage: React.FC = () => {
  const { branding, policies } = useSettings();

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs prose prose-slate">
        <h1 className="text-3xl font-black text-slate-900 mb-6">Terms and Conditions of Service</h1>
        <p className="text-xs text-slate-400">Effective Date: October 2026</p>

        <section className="space-y-4 text-sm text-slate-600 leading-relaxed mt-6">
          <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            Welcome to {branding.brandName}. By accessing or using our website, mobile application, or Progressive Web App (PWA), you agree to be bound by these Terms and Conditions.
          </p>

          <h2 className="text-lg font-bold text-slate-900">2. Bookings and Real-Time Availability</h2>
          <p>
            All hotel accommodations, holiday tour packages, and travel mobility services booked via {branding.brandName} are subject to real-time verification and confirmed directly with property management.
          </p>

          <h2 className="text-lg font-bold text-slate-900">3. Cancellation & Refund Policy</h2>
          <p>
            Cancellations requested at least {policies.defaultCancellationHours} hours prior to scheduled check-in or package departure are eligible for a full refund. Refunds for online transactions are credited back to the original payment source within 5 to 7 business days.
          </p>

          <h2 className="text-lg font-bold text-slate-900">4. Payment Options</h2>
          <p>
            Guests may select "Pay at Hotel / Pay Later" or "Pay Online". In test/demo mode, no physical funds are deducted from bank cards.
          </p>

          <h2 className="text-lg font-bold text-slate-900">5. Contact Information</h2>
          <p>
            For any queries or assistance, contact our 24/7 support desk at <strong>{branding.contactEmail}</strong> or call <strong>{branding.contactPhone}</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
