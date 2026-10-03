import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  addDoc,
} from 'firebase/firestore';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Heart,
  Info,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { sampleHotels } from '../services/seedData';
import { Hotel, Review, RoomType } from '../types';

export const HotelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { policies, branding } = useSettings();
  const { user, userProfile } = useAuth();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [roomQuantity, setRoomQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Dates state
  const [checkIn, setCheckIn] = useState(() => {
    return searchParams.get('checkIn') || new Date().toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState(() => {
    if (searchParams.get('checkOut')) return searchParams.get('checkOut')!;
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [guestsCount, setGuestsCount] = useState(2);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Calculate nights
  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  // Live real-time Firestore listeners for hotel, rooms, and reviews
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // 1. Hotel Document Listener
    const hotelRef = doc(db, 'hotels', id);
    const unsubHotel = onSnapshot(
      hotelRef,
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Hotel;
          setHotel(data);
          if (data.images?.[0]) setSelectedImage(data.images[0]);
          document.title = `${data.name} - ${branding.brandName}`;
        } else {
          // Check sample fallback
          const sample = sampleHotels.find((h) => h.id === id);
          if (sample) {
            setHotel(sample);
            setRooms(sample.rooms || []);
            setSelectedRoom(sample.rooms?.[0] || null);
            if (sample.images?.[0]) setSelectedImage(sample.images[0]);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Hotel listener notice:', err.message);
        const sample = sampleHotels.find((h) => h.id === id);
        if (sample) {
          setHotel(sample);
          setRooms(sample.rooms || []);
          setSelectedRoom(sample.rooms?.[0] || null);
        }
        setLoading(false);
      }
    );

    // 2. Live Rooms Listener (Real-Time Inventory)
    const qRooms = query(collection(db, 'rooms'), where('hotelId', '==', id));
    const unsubRooms = onSnapshot(
      qRooms,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RoomType));
          setRooms(list);
          if (!selectedRoom && list.length > 0) {
            setSelectedRoom(list[0]);
          }
        }
      },
      () => {}
    );

    // 3. Live Reviews Listener
    const qReviews = query(
      collection(db, 'reviews'),
      where('targetId', '==', id),
      where('isApproved', '==', true)
    );
    const unsubReviews = onSnapshot(
      qReviews,
      (snap) => {
        if (!snap.empty) {
          setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));
        }
      },
      () => {}
    );

    return () => {
      unsubHotel();
      unsubRooms();
      unsubReviews();
    };
  }, [id, branding.brandName]);

  const handleStartBooking = () => {
    if (!selectedRoom) return;

    // Navigate to step booking checkout
    const params = new URLSearchParams({
      type: 'hotel',
      itemId: hotel?.id || '',
      roomId: selectedRoom.id,
      checkIn,
      checkOut,
      nights: nights.toString(),
      roomsCount: roomQuantity.toString(),
      guestsCount: guestsCount.toString(),
    });

    navigate(`/book?${params.toString()}`);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hotel) return;
    setSubmittingReview(true);

    try {
      await addDoc(collection(db, 'reviews'), {
        targetType: 'hotel',
        targetId: hotel.id,
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || 'Verified Guest',
        bookingId: 'BK-' + Date.now().toString().slice(-6),
        rating: reviewRating,
        comment: reviewComment,
        isApproved: true,
        createdAt: new Date().toISOString(),
      });
      setReviewSuccess(true);
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccess(false);
        setReviewComment('');
      }, 1500);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 rounded-md w-1/4" />
        <div className="h-96 bg-slate-200 rounded-3xl" />
        <div className="h-40 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Hotel Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The property you are looking for is unavailable.</p>
        <Link to="/hotels" className="px-5 py-2.5 bg-orange-600 text-white font-bold text-sm rounded-xl">
          Browse All Hotels
        </Link>
      </div>
    );
  }

  // Price math for sticky card
  const baseRoomRate = (selectedRoom?.basePrice || hotel.minPrice) * roomQuantity * nights;
  const taxAmount = Math.round((baseRoomRate * policies.standardTaxPercent) / 100);
  const totalEstimated = baseRoomRate + taxAmount;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link to="/" className="hover:text-slate-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/hotels" className="hover:text-slate-900">Hotels</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-semibold truncate">{hotel.name}</span>
        </div>

        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 font-extrabold text-xs px-2 py-0.5 rounded-lg border border-amber-200/60">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{hotel.starRating} Star Luxury {hotel.propertyType}</span>
              </div>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-emerald-600">✓ Free Cancellation Available</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900">{hotel.name}</h1>
            <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mt-1">
              <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
              <span>{hotel.address}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: hotel.name, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
              title="Share Property"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-red-500 hover:bg-slate-50 transition cursor-pointer"
              title="Save to Wishlist"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* High-Resolution Photo Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
          <div className="lg:col-span-2 aspect-16/10 rounded-3xl overflow-hidden shadow-md bg-slate-900 relative">
            <img
              src={selectedImage || hotel.images?.[0]}
              alt={hotel.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            {hotel.images?.slice(0, 3).map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative aspect-16/10 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedImage === img ? 'border-orange-500 shadow-md' : 'border-transparent opacity-85 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`${hotel.name} preview`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Content & Sticky Booking Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Details (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Overview & Description */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-3">About The Property</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{hotel.description}</p>

              {/* Amenities Grid */}
              <h3 className="text-sm font-bold text-slate-900 mt-6 mb-3">Popular Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.amenities?.map((a, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Selection with LIVE Inventory */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs" id="rooms">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Select Your Room</h2>
                  <p className="text-xs text-slate-500">Live inventory and rates updated directly from property systems.</p>
                </div>
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time availability</span>
                </div>
              </div>

              {rooms.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading room inventory...</div>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => {
                    const isSelected = selectedRoom?.id === room.id;
                    const isLowInventory = room.totalInventory <= 3;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col sm:flex-row justify-between gap-4 ${
                          isSelected
                            ? 'border-orange-600 bg-orange-50/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{room.name}</h3>
                            {isLowInventory && (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                                Only {room.totalInventory} left!
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{room.description}</p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-3">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              Max {room.maxGuests} Guests
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{room.bedType}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-slate-500">
                            {room.amenities?.map((ram, i) => (
                              <span key={i} className="bg-slate-100 px-2 py-0.5 rounded-md">
                                {ram}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="sm:text-right flex sm:flex-col justify-between sm:justify-end items-end shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div>
                            <span className="text-xl font-black text-slate-900">
                              {policies.currencySymbol}{room.basePrice.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400 block font-medium">/ night</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoom(room);
                            }}
                            className={`mt-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                              isSelected
                                ? 'bg-orange-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? '✓ Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hotel Policies */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Policies & House Rules</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Check-In Time</span>
                  <p className="text-sm font-bold text-slate-800">{hotel.policies?.checkInTime || '14:00'}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Check-Out Time</span>
                  <p className="text-sm font-bold text-slate-800">{hotel.policies?.checkOutTime || '11:00'}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2">
                <p><strong>Cancellation:</strong> {hotel.policies?.cancellationPolicy}</p>
                <div>
                  <strong>House Rules:</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {hotel.policies?.houseRules?.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Guest Reviews Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Guest Ratings & Reviews</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 font-extrabold text-xs px-2 py-0.5 rounded-lg border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{hotel.starRating}.0 / 5.0</span>
                    </div>
                    <span className="text-xs text-slate-500">Based on verified stays</span>
                  </div>
                </div>

                {user && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {reviews.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Be the first verified guest to leave a review for this property!
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="border-b border-slate-100 pb-4 last:border-none">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800">{rev.userName}</span>
                        <div className="flex items-center">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Verified Stay · {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Summary & Booking Card (4 cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-2xl font-black text-slate-900">
                    {policies.currencySymbol}
                    {(selectedRoom?.basePrice || hotel.minPrice).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-medium"> / night</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{hotel.starRating}.0</span>
                </div>
              </div>

              {/* Date & Guest Pickers */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Check-In</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                    />
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Check-Out</label>
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Rooms Quantity</span>
                    <span className="text-[11px] text-slate-400">Total rooms required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={roomQuantity <= 1}
                      onClick={() => setRoomQuantity(roomQuantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="font-bold w-4 text-center">{roomQuantity}</span>
                    <button
                      disabled={roomQuantity >= (selectedRoom?.totalInventory || 5)}
                      onClick={() => setRoomQuantity(roomQuantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>
                    {policies.currencySymbol}{(selectedRoom?.basePrice || hotel.minPrice).toLocaleString()} × {nights} Nights × {roomQuantity} Room
                  </span>
                  <span className="font-semibold text-slate-900">
                    {policies.currencySymbol}{baseRoomRate.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Taxes & Service Fees ({policies.standardTaxPercent}%)</span>
                  <span>{policies.currencySymbol}{taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span className="text-orange-600 text-base">
                    {policies.currencySymbol}{totalEstimated.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Instant Book CTA */}
              <button
                type="button"
                onClick={handleStartBooking}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to Booking</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero cancellation fees · Instant booking confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Rate Your Stay</h3>
              <button onClick={() => setShowReviewModal(false)} className="p-1">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {reviewSuccess ? (
              <div className="p-6 text-center text-emerald-600 text-sm font-bold">
                ✓ Thank you! Your review has been submitted.
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= reviewRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Experience</label>
                  <textarea
                    rows={4}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe the rooms, food, staff, and overall experience..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
