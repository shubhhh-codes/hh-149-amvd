/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Booking } from '@/types';
import { formatCurrency } from '@/utils/format';
import {
  UserCircleIcon,
  TicketIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  CreditCardIcon,
  IdentificationIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';
import { generateTicketPDF, createAndSaveTicket } from '@/components/TicketPDF';

interface Payment {
  _id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  status: 'pending' | 'approved' | 'declined' | 'cancel' | 'completed';
  type: string;
  createdAt: string;
  bookingDetails: {
    numberOfTickets: number;
    fullName: string;
  };
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0
  });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'payments'>('bookings');

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to cancel booking');
      }

      setBookings(prev => prev.filter(booking => booking._id !== bookingId));

      setStats(prev => ({
        total: prev.total - 1,
        pending: prev.pending - 1,
        approved: prev.approved
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  const downloadTicket = async (booking: Booking) => {
    try {
      await createAndSaveTicket({
        ticketNumber: booking._id,
        userEmail: session?.user?.email || 'N/A',
        userName: booking.fullName || 'User',
        userPhone: booking.phone || 'N/A',
        numberOfTickets: booking.numberOfTickets,
        showDetails: {
          name: 'Stand Up Evening',
          date: '23 November 2025',
          time: '5:00 PM',
          venue: 'Mishty Studio Campus, Brts, \n 132 Feet Ring Rd, beside Kaizen Hospital, \n opp. Valinath, Saurabh Society, Naranpura, Ahmedabad'
        },
        paymentId: booking?.paymentId,
        paymentTime: booking?.createdAt
      });
    } catch (err) {
      console.error('Failed to generate ticket:', err);
    }
  };

  useEffect(() => {
    async function fetchBookings() {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(`/api/bookings/user?email=${session.user.email}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch bookings');
        }

        setBookings(data.bookings);

        // Calculate stats
        const stats = data.bookings.reduce((acc: any, booking: Booking) => {
          acc.total++;
          if (booking.status === 'approved') acc.approved++;
          if (booking.status === 'pending') acc.pending++;
          return acc;
        }, { total: 0, approved: 0, pending: 0 });

        setStats(stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookings();
  }, [session]);

  useEffect(() => {
    async function fetchPayments() {
      if (!session?.user?.email) return;

      try {
        const res = await fetch('/api/payments/user');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setPayments(data.payments);
      } catch (err) {
        console.error('Failed to fetch payments:', err);
      }
    }

    if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [session, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-purple-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {session?.user?.name || session?.user?.email?.split('@')[0] || 'Guest'}! 👋
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your bookings and payments all in one place.
              </p>
            </div>
            <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-10 w-10 text-purple-600" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Bookings</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <TicketIcon className="w-12 h-12 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Approved</p>
                  <p className="text-3xl font-bold mt-1">{stats.approved}</p>
                </div>
                <CheckCircleIcon className="w-12 h-12 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Pending</p>
                  <p className="text-3xl font-bold mt-1">{stats.pending}</p>
                </div>
                <ClockIcon className="w-12 h-12 text-yellow-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeTab === 'bookings'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <TicketIcon className="w-5 h-5 mr-2" />
              <span>My Bookings</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeTab === 'payments'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <CreditCardIcon className="w-5 h-5 mr-2" />
              <span>Payment History</span>
            </button>
          </nav>
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {activeTab === 'bookings' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Booking Date</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <TicketIcon className="w-4 h-4" />
                        <span>Event Details</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Status</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <TicketIcon className="w-4 h-4" />
                        <span>Download Ticket</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.filter(booking => booking.status === 'approved').map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(booking.createdAt).toLocaleTimeString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {booking.isComedianBooking ? (
                          <div>
                            <span className="text-sm font-medium text-gray-900">Comedian Registration</span>
                            <p className="text-sm text-gray-500">{booking.comedianProfile?.comedianType}</p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-sm font-medium text-gray-900">Show Tickets</span>
                            <div className="flex items-center mt-1">
                              <TicketIcon className="w-4 h-4 text-purple-500 mr-1" />
                              <span className="text-sm text-gray-600">{booking.numberOfTickets} ticket(s)</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                            booking.status === 'declined' ? 'bg-red-100 text-red-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'cancelled' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-yellow-100 text-yellow-800'}`}>
                          {booking.status === 'pending' ? 'Pending — Awaiting approval' :
                            booking.status === 'declined' ? 'Declined' :
                              booking.status === 'approved' ? 'Approved' :
                                booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => downloadTicket(booking)} className="bg-[#793de6] text-white px-4 py-2 rounded-lg">Download Ticket</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Date</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <IdentificationIcon className="w-4 h-4" />
                        <span>Payment ID</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <TicketIcon className="w-4 h-4" />
                        <span>Details</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <CurrencyRupeeIcon className="w-4 h-4" />
                        <span>Amount</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Status</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleTimeString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.paymentId}</div>
                        <div className="text-xs text-gray-500">Order: {payment.orderId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.bookingDetails.numberOfTickets} ticket(s) × ₹149
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          Total: {formatCurrency(payment.amount / 100)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
