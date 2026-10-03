import React, { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Check,
  CheckCircle,
  Mail,
  Phone,
  Plus,
  Shield,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../services/firebase';
import { Agent } from '../../types';

export const AdminAgents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'agents'), (snap) => {
      if (!snap.empty) {
        setAgents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agent)));
      } else {
        // Sample fallback agent
        setAgents([
          {
            id: 'ag_1',
            userId: 'usr_ag1',
            name: 'Vikram Joshi',
            agencyName: 'SpiceRoute Expeditions',
            email: 'vikram@spiceroute.com',
            phone: '+91 98111 22233',
            commissionPercent: 12,
            status: 'active',
            verified: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'ag_2',
            userId: 'usr_ag2',
            name: 'Rana Pratap Singh',
            agencyName: 'Rajputana Royal Tours',
            email: 'rana@rajputanatours.com',
            phone: '+91 98222 33344',
            commissionPercent: 15,
            status: 'active',
            verified: true,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    });

    return () => unsub();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(collection(db, 'agents'));
      await setDoc(docRef, {
        id: docRef.id,
        userId: 'manual_' + Date.now(),
        name,
        agencyName,
        email,
        phone,
        commissionPercent,
        status: 'active',
        verified: true,
        createdAt: new Date().toISOString(),
      });
      setModalOpen(false);
      setName('');
      setAgencyName('');
      setEmail('');
      setPhone('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'agents');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (agentId: string, status: 'active' | 'suspended') => {
    try {
      await updateDoc(doc(db, 'agents', agentId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `agents/${agentId}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Tour Agent Partners
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorize local operators, establish commission splits, and manage agency profiles.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tour Agent</span>
        </button>
      </div>

      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-900/60 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-4 px-4">Agent / Agency</th>
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-4">Commission</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-300">
              {agents.map((ag) => (
                <tr key={ag.id} className="hover:bg-slate-750 transition">
                  <td className="py-4 px-4">
                    <p className="font-bold text-white text-sm">{ag.agencyName}</p>
                    <p className="text-[10px] text-slate-400">{ag.name}</p>
                  </td>
                  <td className="py-4 px-4 space-y-0.5">
                    <p className="flex items-center gap-1.5 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ag.email}</span>
                    </p>
                    {ag.phone && (
                      <p className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <Phone className="w-3 h-3" />
                        <span>{ag.phone}</span>
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-4 font-bold text-white">{ag.commissionPercent}%</td>
                  <td className="py-4 px-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        ag.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {ag.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {ag.status === 'active' ? (
                      <button
                        onClick={() => updateStatus(ag.id, 'suspended')}
                        className="px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(ag.id, 'active')}
                        className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Tour Agency Partner</h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Agency Name *</label>
                <input
                  type="text"
                  required
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="e.g. Himalayan Highs Adventures"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Contact Person Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Commission Share (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl"
                >
                  {saving ? 'Saving...' : 'Add Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
