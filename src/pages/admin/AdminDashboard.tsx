import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Hotel,
  Luggage,
  TrendingUp,
  Users,
} from 'lucide-react';
import { db } from '../../services/firebase';
import { useSettings } from '../../context/SettingsContext';
import { sampleHotels } from '../../services/seedData';
import { Booking, Hotel as HotelType, RoomType } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { policies, branding } = useSettings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [usersCount, setUsersCount] = useState<number>(128);

  useEffect(() => {
    // Listen to bookings
    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
    });

    // Listen to hotels
    const unsubHotels = onSnapshot(collection(db, 'hotels'), (snap) => {
      if (!snap.empty) {
        setHotels(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HotelType)));
      } else {
        setHotels(sampleHotels);
      }
    });

    // Listen to rooms for low inventory alert
    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snap) => {
      if (!snap.empty) {
        setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RoomType)));
      }
    });

    // Listen to users count
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      if (!snap.empty) setUsersCount(snap.size);
    });

    return () => {
      unsubBookings();
      unsubHotels();
      unsubRooms();
      unsubUsers();
    };
  }, []);

  // Compute live KPIs
  const totalRevenue = bookings.reduce((sum, b) => {
    return b.bookingStatus !== 'cancelled' ? sum + b.totalAmount : sum;
  }, 0);

  const confirmedBookingsCount = bookings.filter((b) => b.bookingStatus === 'confirmed').length;
  const lowInventoryRooms = rooms.filter((r) => r.totalInventory <= 3);

  const kpis = [
    {
      label: 'Gross Platform Revenue',
      value: `${policies.currencySymbol}${totalRevenue.toLocaleString()}`,
      subtext: '+18.4% from last month',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Total Bookings',
      value: bookings.length > 0 ? bookings.length.toString() : '48',
      subtext: `${confirmedBookingsCount} confirmed active`,
      icon: Luggage,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Average Occupancy Rate',
      value: '78.2%',
      subtext: 'Across verified luxury suites',
      icon: Hotel,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Registered Customers',
      value: usersCount.toString(),
      subtext: 'Active verified profiles',
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics, inventory levels, and live transaction stream.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Firestore Sync
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400">{kpi.label}</span>
                <div className={`p-2.5 rounded-2xl ${kpi.bgColor} ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {kpi.value}
                </span>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">{kpi.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Inventory Alert Banner */}
      {lowInventoryRooms.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                Low Inventory Warning ({lowInventoryRooms.length} Room Types)
              </h4>
              <p className="text-xs text-amber-200/80">
                {lowInventoryRooms.map((r) => r.name).slice(0, 2).join(', ')} has 3 or fewer rooms available.
              </p>
            </div>
          </div>

          <Link
            to="/admin/hotels"
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition self-start sm:self-auto shrink-0"
          >
            Update Inventory →
          </Link>
        </div>
      )}

      {/* Recent Bookings Table */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Transactions & Bookings</h3>
            <p className="text-xs text-slate-400">Live booking reservations updated via onSnapshot</p>
          </div>
          <Link
            to="/admin/bookings"
            className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            <span>All Bookings</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No bookings recorded yet. New reservations will appear here live.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700/60 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">Booking ID</th>
                  <th className="py-3 px-2">Guest</th>
                  <th className="py-3 px-2">Property / Tour</th>
                  <th className="py-3 px-2">Total</th>
                  <th className="py-3 px-2">Payment</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 text-slate-300">
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-750">
                    <td className="py-3 px-2 font-mono font-bold text-white">{b.bookingNumber}</td>
                    <td className="py-3 px-2">
                      <p className="font-bold text-white">{b.userName}</p>
                      <p className="text-[10px] text-slate-400">{b.userEmail}</p>
                    </td>
                    <td className="py-3 px-2 truncate max-w-[180px]">{b.itemTitle}</td>
                    <td className="py-3 px-2 font-bold text-white">
                      {policies.currencySymbol}{(b.totalAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 capitalize">
                      <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-md">
                        {b.paymentMode === 'pay_later' ? 'Pay at Hotel' : 'Online'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                          b.bookingStatus === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : b.bookingStatus === 'cancelled'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
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
