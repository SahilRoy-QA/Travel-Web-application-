import React, { useState } from 'react';
import { Star, ThumbsUp, X } from 'lucide-react';
import { CabBooking } from '../../types/cab';
import { submitCabReviewInDb } from '../../services/cabService';
import { useAuth } from '../../context/AuthContext';

interface CabReviewModalProps {
  booking: CabBooking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CabReviewModal: React.FC<CabReviewModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [driverRating, setDriverRating] = useState<number>(5);
  const [vehicleRating, setVehicleRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to leave a review.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      await submitCabReviewInDb({
        bookingId: booking.id,
        userId: user.uid,
        userName: booking.customerName || user.displayName || 'Traveler',
        driverId: booking.driverId || 'driver-rajesh-1',
        vehicleId: booking.vehicleId || 'veh-sedan-1',
        driverRating,
        vehicleRating,
        comment: comment.trim(),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Review submit failed:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Rate Your Ride Experience
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Trip #{booking.bookingNumber || booking.id.slice(0, 10)}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Driver Rating */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-750">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Driver Rating ({booking.driverName || 'Driver'})
              </span>
              <span className="text-xs font-black text-amber-500">{driverRating} / 5</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setDriverRating(star)}
                  className="p-1 hover:scale-110 transition cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= driverRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Rating */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-750">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Vehicle Cleanliness & Comfort ({booking.vehicleModel || 'Cab'})
              </span>
              <span className="text-xs font-black text-amber-500">{vehicleRating} / 5</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setVehicleRating(star)}
                  className="p-1 hover:scale-110 transition cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= vehicleRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Feedback (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the driving, AC, route taken, and punctuality?"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/25 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
