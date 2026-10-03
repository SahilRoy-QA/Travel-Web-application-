import React, { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { Check, Star, Trash2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../services/firebase';
import { Review } from '../../types';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'reviews'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
      setReviews(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const toggleApproval = async (r: Review) => {
    try {
      await updateDoc(doc(db, 'reviews', r.id), {
        isApproved: !r.isApproved,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reviews/${r.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${id}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Customer Reviews Moderation
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Approve or delete ratings submitted by verified stay guests.
        </p>
      </div>

      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-sm">
        {reviews.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No reviews submitted yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {reviews.map((r) => (
              <div key={r.id} className="p-6 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{r.userName}</span>
                    <div className="flex items-center">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        r.isApproved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{r.comment}</p>
                  <p className="text-[10px] text-slate-400">
                    Booking Ref: {r.bookingId} · Submitted on {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => toggleApproval(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      r.isApproved
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {r.isApproved ? 'Unapprove' : 'Approve Review'}
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-xl transition"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
