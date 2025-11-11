/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency } from '@/utils/format';
import {
  UserCircleIcon,
  UsersIcon,
  TicketIcon,
  CurrencyDollarIcon,
  MicrophoneIcon,
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  StarIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import DownloadPaymentsButton from '@/components/UserDownloadPDF';

interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  role: string;
}

interface Booking {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'declined';
  numberOfTickets?: number;
  createdAt: string;
}

interface ComedianProfile {
  _id: string;
  username: string;
  email: string;
  phone: string;
  createdAt: string;
  comedianProfile: {
    comedianType: string;
    speciality: string;
    experience: string;
    bio: string;
    videoUrl: string;
    status: 'pending' | 'approved' | 'declined';
  };
}

interface Payment {
  _id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  status: string;
  type: string;
  createdAt: string;
  bookingDetails?: {
    numberOfTickets: number;
    fullName: string;
    phone: string;
  };
  user?: {
    email: string;
    username: string;
  };
}

interface PaymentStats {
  totalAmount: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'bookings' | 'users' | 'comedians' | 'payments'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [comedians, setComedians] = useState<ComedianProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalAmount: 0,
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [passwordResetModal, setPasswordResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email || session.user.email !== 'admin@humorshub.com') {
      router.push('/');
      return;
    }
    if (activeTab === 'comedians') {
      fetchComedians();
    } else {
      fetchData();
    }
  }, [session, status, router, activeTab]);

  useEffect(() => {
    if (activeTab === 'comedians') {
      fetchComedians();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'bookings') {
        await fetchBookings();
      } else if (activeTab === 'users') {
        await fetchUsers();
      } else if (activeTab === 'comedians') {
        await fetchComedians();
      } else if (activeTab === 'payments') {
        await fetchPayments();
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    const res = await fetch('/api/admin/bookings');
    if (!res.ok) throw new Error('Failed to fetch bookings');
    const data = await res.json();
    setBookings(data.bookings);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    setUsers(data.users);
  };

  const fetchComedians = async () => {
    try {
      const response = await fetch('/api/admin/comedians');
      if (!response.ok) throw new Error('Failed to fetch comedians');
      const data = await response.json();
      setComedians(data.comedians);
    } catch (error) {
      console.error('Fetch comedians error:', error);
      setError('Failed to load comedians');
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments');
      if (!res.ok) throw new Error('Failed to fetch payments');
      const data = await res.json();
      setPayments(data.payments);
      setPaymentStats(data.stats);
    } catch (err) {
      console.error('Fetch payments error:', err);
      setError('Failed to load payments');
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Booking status updated successfully');
      fetchBookings();
    } catch (err) {
      console.error('Update status error:', err);
      toast.error('Failed to update booking status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete user');
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      toast.error('Failed to delete user');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error('Failed to update user role');
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (err) {
      console.error('Update role error:', err);
      toast.error('Failed to update user role');
    }
  };

  const handleComedianStatusUpdate = async (comedianId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/comedians', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comedianId, status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update comedian status');
      }

      toast.success('Comedian status updated successfully');
      fetchComedians();
    } catch (error: any) {
      console.error('Update comedian status error:', error);
      toast.error(error.message || 'Failed to update comedian status');
    }
  };

  const handleResetUserPassword = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser._id,
          newPassword: newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Password reset successfully');
        setPasswordResetModal(false);
        setNewPassword('');
        setSelectedUser(null);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      toast.error('An error occurred while resetting password');
    }
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setPasswordResetModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <UserCircleIcon className="w-6 h-6 text-purple-600" />
            <span className="text-gray-600">{session?.user?.email}</span>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex flex-col md:flex-row p-2 space-y-2 md:space-y-0 md:space-x-2">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center justify-center md:justify-start space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'bookings' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <TicketIcon className="w-5 h-5" />
              <span>Bookings</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center justify-center md:justify-start space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'users' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <UsersIcon className="w-5 h-5" />
              <span>Users</span>
            </button>
            <button
              onClick={() => setActiveTab('comedians')}
              className={`flex items-center justify-center md:justify-start space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'comedians' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <MicrophoneIcon className="w-5 h-5" />
              <span>Comedians</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center justify-center md:justify-start space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'payments' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <CurrencyDollarIcon className="w-5 h-5" />
              <span>Payments</span>
            </button>
          </div>
        </div>

        {/* Payment Stats Cards */}
        {activeTab === 'payments' && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Payment Records</h2>
                <DownloadPaymentsButton 
                  payments={payments}
                  className="text-sm shadow-md hover:shadow-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Total Revenue</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(paymentStats.totalAmount / 100)}
                      </p>
                    </div>
                    <ChartBarIcon className="w-12 h-12 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Successful</p>
                      <p className="text-2xl font-bold mt-1">{paymentStats.successfulPayments}</p>
                    </div>
                    <CheckCircleIcon className="w-12 h-12 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100">Pending</p>
                      <p className="text-2xl font-bold mt-1">
                        {paymentStats.totalPayments - paymentStats.successfulPayments}
                      </p>
                    </div>
                    <ClockIcon className="w-12 h-12 text-yellow-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Total Transactions</p>
                      <p className="text-2xl font-bold mt-1">{paymentStats.totalPayments}</p>
                    </div>
                    <CurrencyDollarIcon className="w-12 h-12 text-blue-200" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Date & Time</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-1">
                          <UserCircleIcon className="w-4 h-4" />
                          <span>Customer Details</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-1">
                          <CurrencyDollarIcon className="w-4 h-4" />
                          <span>Payment Info</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-1">
                          <TicketIcon className="w-4 h-4" />
                          <span>Booking Details</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-1">
                          <CurrencyDollarIcon className="w-4 h-4" />
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
                          <div className="text-sm font-medium text-gray-900">
                            {payment.bookingDetails?.fullName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{payment.user?.email || 'N/A'}</div>
                          <div className="text-xs text-gray-400">
                            {payment.bookingDetails?.phone || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payment.paymentId}</div>
                          <div className="text-xs text-gray-500">Order: {payment.orderId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payment.bookingDetails?.numberOfTickets 
                              ? `${payment.bookingDetails.numberOfTickets} ticket${payment.bookingDetails.numberOfTickets > 1 ? 's' : ''}`
                              : 'No booking details'
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.type === 'ticket_booking' ? 'Show Ticket' : payment.type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount / 100)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${payment.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : payment.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Content Sections */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Bookings Table */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Booking Records</h2>
                  <div className="flex space-x-4">
                    <div className="flex items-center bg-green-100 px-4 py-2 rounded-lg">
                      <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-xs text-green-600">Approved</p>
                        <p className="text-lg font-bold text-green-700">
                          {bookings.filter(b => b.status === 'approved').length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-lg">
                      <ClockIcon className="w-5 h-5 text-yellow-600 mr-2" />
                      <div>
                        <p className="text-xs text-yellow-600">Pending</p>
                        <p className="text-lg font-bold text-yellow-700">
                          {bookings.filter(b => b.status === 'pending').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

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
                            <UserCircleIcon className="w-4 h-4" />
                            <span>Customer Details</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <TicketIcon className="w-4 h-4" />
                            <span>Tickets</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Status</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{booking.fullName}</div>
                            <div className="text-sm text-gray-500">{booking.email}</div>
                            <div className="text-xs text-gray-400">{booking.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {booking.numberOfTickets} ticket(s)
                            </div>
                            <div className="text-xs text-gray-500">
                            ₹149 per ticket
                            </div>
                            <div className="text-sm font-medium text-purple-600">
                              Total: {formatCurrency((booking.numberOfTickets || 0) * 69)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${booking.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                booking.status === 'declined' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                              {booking.status === 'pending' ? 'pending - Awaiting payment confirmation' : booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              {booking.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(booking._id, 'approved')}
                                    className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(booking._id, 'declined')}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Table */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                  <div className="bg-blue-50 px-4 py-2 rounded-lg flex items-center">
                    <UsersIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-xs text-blue-600">Total Users</p>
                      <p className="text-lg font-bold text-blue-700">{users.length}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <UserCircleIcon className="w-4 h-4" />
                            <span>Username</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <EnvelopeIcon className="w-4 h-4" />
                            <span>Email</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <ShieldCheckIcon className="w-4 h-4" />
                            <span>Role</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>Created At</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <UserCircleIcon className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleResetPassword(user)}
                              className="text-purple-600 hover:text-purple-900 font-medium"
                            >
                              Reset Password
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Comedians Grid */}
            {activeTab === 'comedians' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Comedian Applications</h2>
                  <div className="flex space-x-4">
                    <div className="flex items-center bg-green-100 px-4 py-2 rounded-lg">
                      <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-xs text-green-600">Approved</p>
                        <p className="text-lg font-bold text-green-700">
                          {comedians.filter(c => c.comedianProfile.status === 'approved').length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-lg">
                      <ClockIcon className="w-5 h-5 text-yellow-600 mr-2" />
                      <div>
                        <p className="text-xs text-yellow-600">Pending</p>
                        <p className="text-lg font-bold text-yellow-700">
                          {comedians.filter(c => c.comedianProfile.status === 'pending').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {comedians.map((comedian) => (
                    <div key={comedian._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{comedian.username}</h3>
                            <p className="text-sm text-gray-500">{comedian.email}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                            ${comedian.comedianProfile.status === 'approved' ? 'bg-green-100 text-green-800' :
                              comedian.comedianProfile.status === 'declined' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'}`}>
                            {comedian.comedianProfile.status}
                          </span>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center text-sm">
                            <MicrophoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-700">{comedian.comedianProfile.comedianType}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">{comedian.comedianProfile.experience} Experience</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <StarIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">{comedian.comedianProfile.speciality}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{comedian.comedianProfile.bio}</p>

                        {comedian.comedianProfile.status === 'pending' && (
                          <div className="flex justify-end space-x-2 pt-4 border-t">
                            <button
                              onClick={() => handleComedianStatusUpdate(comedian._id, 'approved')}
                              className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleComedianStatusUpdate(comedian._id, 'declined')}
                              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
      {/* Password Reset Modal */}
      {passwordResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Reset Password for {selectedUser.username}</h2>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => {
                  setPasswordResetModal(false);
                  setNewPassword('');
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleResetUserPassword}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
