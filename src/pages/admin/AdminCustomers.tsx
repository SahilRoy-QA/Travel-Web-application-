import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import {
  Ban,
  CheckCircle,
  Mail,
  Phone,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';

export const AdminCustomers: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const toggleBlockStatus = async (user: UserProfile) => {
    if (user.role === 'super_admin') {
      alert('Super Admin cannot be blocked.');
      return;
    }
    const newBlocked = !user.isBlocked;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isBlocked: newBlocked,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleRoleChange = async (userId: string, newRole: any) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin can change user roles.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Customer & Account Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review customer profiles, access control tiers, and block suspicious activity.
        </p>
      </div>

      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-sm">
        {users.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No customers registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-900/60 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-4 px-4">User</th>
                  <th className="py-4 px-4">Email</th>
                  <th className="py-4 px-4">Phone</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-4">Account Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 text-slate-300">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-750 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center uppercase">
                          {u.displayName?.charAt(0) || u.email?.charAt(0) || 'U'}
                        </div>
                        <span className="font-bold text-white">{u.displayName || 'Traveler'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{u.email}</td>
                    <td className="py-4 px-4 text-slate-400">{u.phoneNumber || '—'}</td>
                    <td className="py-4 px-4">
                      {isSuperAdmin && u.role !== 'super_admin' ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                          className="bg-slate-900 text-slate-200 border border-slate-700 text-[10px] font-bold rounded-lg px-2 py-1 uppercase"
                        >
                          <option value="customer">Customer</option>
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md uppercase">
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {u.isBlocked ? (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md uppercase">
                          Blocked
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {u.role !== 'super_admin' && (
                        <button
                          onClick={() => toggleBlockStatus(u)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            u.isBlocked
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          }`}
                        >
                          {u.isBlocked ? 'Unblock' : 'Block User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
