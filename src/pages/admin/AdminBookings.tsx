import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
} from 'firebase/firestore';
import {
  CheckCircle,
  Clock,
  Download,
  Filter,
  Luggage,
  Search,
  XCircle,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../services/firebase';
import { useSettings } from '../../context/SettingsContext';
import { Booking } from '../../types';

export const AdminBookings: React.FC = () => {
  const { policies } = useSettings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'bookings'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleUpdateStatus = async (bookingId: string, newStatus: any) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        bookingStatus: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
    }
  };

  const handleExportCSV = () => {
    if (bookings.length === 0) return;

    const headers = [
      'Booking ID',
      'Type',
      'Guest Name',
      'Guest Email',
      'Phone',
      'Item Title',
      'Dates',
      'Nights',
      'Guests',
      'Base Price',
      'Taxes',
      'Discount',
      'Total Amount',
      'Payment Mode',
      'Booking Status',
      'Booking Date',
    ];

    const rows = bookings.map((b) => [
      `"${b.bookingNumber}"`,
      `"${b.type}"`,
      `"${b.userName}"`,
      `"${b.userEmail}"`,
      `"${b.userPhone || ''}"`,
      `"${b.itemTitle.replace(/"/g, '""')}"`,
      `"${b.checkInDate || b.departureDate || ''} to ${b.checkOutDate || ''}"`,
      b.nights || 1,
      b.guestsCount || 1,
      b.basePrice || 0,
      b.taxes || 0,
      b.discountAmount || 0,
      b.totalAmount || 0,
      `"${b.paymentMode}"`,
      `"${b.bookingStatus}"`,
      `"${new Date(b.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `illusion_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.bookingStatus !== statusFilter) return false;
    if (
      searchTerm &&
      !b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !b.userName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !b.itemTitle.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Bookings & Reservations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time management of stays, holiday packages, payment settlements, and cancellations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={bookings.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-orange-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search booking ID, customer name, hotel..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(['all', 'confirmed', 'pending', 'completed', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                statusFilter === s
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No booking records found matching current query filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-900/60 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-4 px-4">Booking ID</th>
                  <th className="py-4 px-4">Guest Details</th>
                  <th className="py-4 px-4">Reserved Item</th>
                  <th className="py-4 px-4">Dates</th>
                  <th className="py-4 px-4">Total Amount</th>
                  <th className="py-4 px-4">Payment</th>
                  <th className="py-4 px-4">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 text-slate-300">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-750 transition">
                    <td className="py-4 px-4 font-mono font-bold text-white whitespace-nowrap">
                      {b.bookingNumber}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-white">{b.userName}</p>
                      <p className="text-[10px] text-slate-400">{b.userEmail}</p>
                      {b.userPhone && <p className="text-[10px] text-slate-400">{b.userPhone}</p>}
                    </td>
                    <td className="py-4 px-4 max-w-[200px]">
                      <span className="font-bold text-white block truncate">{b.itemTitle}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{b.type}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <p className="text-slate-200">{b.checkInDate || b.departureDate}</p>
                      {b.checkOutDate && <p className="text-[10px] text-slate-400">to {b.checkOutDate}</p>}
                    </td>
                    <td className="py-4 px-4 font-black text-white whitespace-nowrap">
                      {policies.currencySymbol}{(b.totalAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-md block w-fit">
                        {b.paymentMode === 'pay_later' ? 'Pay upon arrival' : 'Paid Online'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={b.bookingStatus}
                        onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                        className={`text-[11px] font-bold rounded-xl px-2.5 py-1.5 border-none focus:ring-0 cursor-pointer ${
                          b.bookingStatus === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : b.bookingStatus === 'cancelled'
                            ? 'bg-red-500/10 text-red-400'
                            : b.bookingStatus === 'completed'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        <option value="confirmed" className="bg-slate-900 text-white">Confirmed</option>
                        <option value="pending" className="bg-slate-900 text-white">Pending</option>
                        <option value="completed" className="bg-slate-900 text-white">Completed</option>
                        <option value="cancelled" className="bg-slate-900 text-white">Cancelled</option>
                      </select>
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
