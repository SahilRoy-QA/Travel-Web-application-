import React, { useState } from 'react';
import { Check, Database, Save, Settings, ShieldCheck } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { seedAllDemoData } from '../../services/dbInit';

export const AdminSettings: React.FC = () => {
  const { policies, updatePolicies } = useSettings();
  const [form, setForm] = useState(policies);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setForm(policies);
  }, [policies]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePolicies(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // Handled
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('Seed all demo hotels, packages, services, coupons, and destinations?')) return;
    setSeeding(true);
    try {
      await seedAllDemoData((msg) => setSeedMsg(msg));
      setTimeout(() => {
        setSeeding(false);
        setSeedMsg(null);
        window.location.reload();
      }, 1500);
    } catch {
      setSeeding(false);
      setSeedMsg('Seeding failed.');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Platform Settings & Policies
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure financial tax thresholds, cancellation windows, and platform data seeding.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400">
          ✓ Policies updated and synced live across checkout screens.
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-500" />
          <span>Financial Rules & Cancellation Policy</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Standard GST / Tax Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={form.standardTaxPercent}
              onChange={(e) => setForm({ ...form, standardTaxPercent: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white"
            />
            <span className="text-[10px] text-slate-400">Applied automatically at review step</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Free Cancellation Window (Hours)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={form.defaultCancellationHours}
              onChange={(e) => setForm({ ...form, defaultCancellationHours: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white"
            />
            <span className="text-[10px] text-slate-400">Hours before check-in time for 100% refund</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Currency Code</label>
            <input
              type="text"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Currency Symbol</label>
            <input
              type="text"
              value={form.currencySymbol}
              onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-bold"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700/60 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            {saving ? 'Updating...' : 'Save Policies'}
          </button>
        </div>
      </form>

      {/* Demo Data Seeder Box */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Bootstrap Demo Dataset</h3>
            <p className="text-xs text-slate-400">
              Populate Cloud Firestore with verified hotels, room categories, tour packages, coupons, and destination guides.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-750 border border-slate-700 text-orange-400 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            <span>{seeding ? (seedMsg || 'Seeding Database...') : 'Seed Demo Data Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
