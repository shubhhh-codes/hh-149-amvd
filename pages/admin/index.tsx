/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomepageCMS from '@/components/admin/HomepageCMS';
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
  phone?: string;
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
  const [activeTab, setActiveTab] = useState<'bookings' | 'users' | 'comedians' | 'payments' | 'cms'>('bookings');
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="antialiased bg-background text-on-surface font-body-md">
      {/* SideNavBar */}
      <aside className="flex flex-col h-screen fixed left-0 top-0 py-8 gap-4 bg-surface-container-low w-64 brutal-border border-r z-50">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container font-bold" style={{fontVariationSettings: "'FILL' 1"}}>theater_comedy</span>
            </div>
            <div>
              <h1 className="text-headline-sm font-headline-md text-primary tracking-tight leading-none">Admin Portal</h1>
              <p className="text-xs text-on-surface-variant font-label-caps mt-1">Manage Ahmedabad Scene</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2 px-2">
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all duration-200 ${activeTab === 'bookings' ? 'bg-primary-container text-on-primary-container opacity-90 scale-[0.98]' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined">calendar_today</span>
            <span className="text-body-md font-body-md">Event Bookings</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all duration-200 ${activeTab === 'users' ? 'bg-primary-container text-on-primary-container opacity-90 scale-[0.98]' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined">group</span>
            <span className="text-body-md font-body-md">User Accounts</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('comedians')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all duration-200 ${activeTab === 'comedians' ? 'bg-primary-container text-on-primary-container opacity-90 scale-[0.98]' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined">theater_comedy</span>
            <span className="text-body-md font-body-md">Comedian Apps</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all duration-200 ${activeTab === 'payments' ? 'bg-primary-container text-on-primary-container opacity-90 scale-[0.98]' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined">payments</span>
            <span className="text-body-md font-body-md">Payments</span>
          </button>

          <div className="pt-4 mt-2 border-t border-outline-variant mx-4"></div>

          <button 
            onClick={() => setActiveTab('cms')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all duration-200 ${activeTab === 'cms' ? 'bg-primary-container text-on-primary-container opacity-90 scale-[0.98]' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined">web</span>
            <span className="text-body-md font-body-md">Homepage CMS</span>
          </button>
        </nav>
        
        <div className="px-4 mt-auto">
          <div className="mt-6 pt-6 border-t border-outline-variant">
            <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-error-container hover:text-white rounded-lg mx-2 transition-all">
              <span className="material-symbols-outlined">logout</span>
              <span className="text-body-md font-body-md">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* TopNavBar */}
      <header className="flex justify-between items-center w-full px-margin-desktop h-20 fixed top-0 right-0 bg-background z-40 border-b border-surface-variant ml-64 pl-72">
        <div className="flex items-center flex-1">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input className="bg-[#080808] border border-outline-variant rounded-full pl-10 pr-4 py-2 w-full text-on-surface focus:outline-none focus:border-primary transition-colors font-body-md" placeholder="Search records..." type="text"/>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 border-l border-outline-variant pl-6">
            <div className="text-right">
              <p className="text-body-md font-headline-md text-on-surface leading-tight">Admin User</p>
              <p className="text-xs text-on-surface-variant font-label-caps">{session?.user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center bg-surface-variant text-primary font-bold">A</div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-64 pt-28 px-margin-desktop pb-20 relative overflow-hidden min-h-screen">
        <div className="spotlight-glow absolute top-0 left-1/4 w-[800px] h-[800px] -z-10 opacity-30"></div>
        <div className="max-w-container-max mx-auto space-y-12">
          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-display-lg font-headline-md text-on-surface tracking-tight">Admin Dashboard</h2>
              <p className="text-body-lg font-body-md text-on-surface-variant mt-2 max-w-xl">Real-time oversight of Ahmedabad's premiere comedy ecosystem and live performance logistics.</p>
            </div>
            <div className="text-right">
              <p className="text-label-caps text-primary mb-1">SYSTEM STATUS</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-body-md font-body-md text-on-surface">Cloud Engines Live</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center bg-error-container/20 border border-error-container p-4 rounded-md">
              <span className="material-symbols-outlined text-error mr-2">error</span>
              <p className="text-error">{error}</p>
            </div>
          )}

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
            <div className="bg-surface-container-low brutal-border p-6 group hover:border-primary transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">currency_rupee</span>
                </div>
              </div>
              <p className="text-label-caps text-on-surface-variant">Total Revenue</p>
              <h3 className="text-headline-md font-headline-md text-on-surface mt-1">{formatCurrency(paymentStats.totalAmount / 100)}</h3>
            </div>
            <div className="bg-surface-container-low brutal-border p-6 group hover:border-primary transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <span className="material-symbols-outlined">confirmation_number</span>
                </div>
              </div>
              <p className="text-label-caps text-on-surface-variant">Active Bookings</p>
              <h3 className="text-headline-md font-headline-md text-on-surface mt-1">{bookings.length}</h3>
            </div>
            <div className="bg-surface-container-low brutal-border p-6 group hover:border-primary transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded bg-primary-container/10 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <span className="text-xs font-label-caps text-primary-container">{comedians.filter(c => c.comedianProfile.status === 'pending').length} Req.</span>
              </div>
              <p className="text-label-caps text-on-surface-variant">Pending Apps</p>
              <h3 className="text-headline-md font-headline-md text-on-surface mt-1">{comedians.length}</h3>
            </div>
            <div className="bg-surface-container-low brutal-border p-6 group hover:border-primary transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
              </div>
              <p className="text-label-caps text-on-surface-variant">Total Users</p>
              <h3 className="text-headline-md font-headline-md text-on-surface mt-1">{users.length}</h3>
            </div>
          </div>

          {/* Dynamic Content Based on Tab */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-headline-sm font-headline-md text-on-surface uppercase tracking-widest">
                  {activeTab === 'bookings' && 'Booking Records'}
                  {activeTab === 'users' && 'User Accounts'}
                  {activeTab === 'comedians' && 'Comedian Applications'}
                  {activeTab === 'payments' && 'Payment Records'}
                  {activeTab === 'cms' && 'Homepage Content Management'}
                </h3>
              </div>
              
              {activeTab === 'payments' && (
                <div className="flex items-center gap-2 text-body-md font-headline-md text-primary">
                  <DownloadPaymentsButton payments={payments} className="!bg-transparent !text-primary !border-none !shadow-none hover:underline underline-offset-4 flex items-center gap-2" />
                </div>
              )}
            </div>

            {/* TAB CONTENT: BOOKINGS */}
            {activeTab === 'bookings' && (
              <div className="bg-surface-container-low brutal-border overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-variant/20 border-b border-outline-variant">
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Booking Date</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Customer Details</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Tickets</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Status</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {bookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-6 font-body-md text-on-surface">{new Date(booking.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-6">
                          <div className="space-y-0.5">
                            <p className="font-headline-md text-on-surface">{booking.fullName}</p>
                            <p className="text-xs text-on-surface-variant">{booking.email}</p>
                            <p className="text-xs text-on-surface-variant">{booking.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-0.5">
                            <p className="text-body-md font-headline-md text-on-surface">{booking.numberOfTickets} ticket(s)</p>
                            <p className="text-xs text-on-surface-variant">₹149 / ticket</p>
                            <p className="text-sm font-bold text-primary">Total: {formatCurrency((booking.numberOfTickets || 0) * 149)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          {booking.status === 'pending' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-widest border border-yellow-500/20">
                              PENDING
                            </span>
                          )}
                          {booking.status === 'approved' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                              APPROVED
                            </span>
                          )}
                          {booking.status === 'declined' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest border border-red-500/20">
                              DECLINED
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-6 text-right">
                          {booking.status === 'pending' ? (
                            <div className="flex justify-end gap-4">
                              <button onClick={() => handleStatusUpdate(booking._id, 'approved')} className="text-green-500 font-label-caps hover:brightness-125 transition-all flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">check</span>
                                Approve
                              </button>
                              <button onClick={() => handleStatusUpdate(booking._id, 'declined')} className="text-red-400 font-label-caps hover:brightness-125 transition-all flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">close</span>
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className="text-on-surface-variant text-xs font-label-caps">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT: USERS */}
            {activeTab === 'users' && (
              <div className="bg-surface-container-low brutal-border overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-variant/20 border-b border-outline-variant">
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">User Details</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Role</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Joined At</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-6">
                          <div className="space-y-0.5">
                            <p className="font-headline-md text-on-surface">{user.username}</p>
                            <p className="text-xs text-on-surface-variant">{user.email}</p>
                            <p className="text-xs text-on-surface-variant">{user.phone || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-6 font-body-md text-on-surface">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-6 py-6 text-right">
                          <button onClick={() => handleResetPassword(user)} className="text-primary font-label-caps hover:brightness-125 transition-all">
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT: COMEDIANS */}
            {activeTab === 'comedians' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {comedians.map((comedian) => (
                  <div key={comedian._id} className="bg-surface-container-low brutal-border p-1 group">
                    <div className="relative overflow-hidden aspect-[16/10] bg-surface-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-on-surface-variant/50">mic</span>
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 text-[10px] font-label-caps ${comedian.comedianProfile?.status === 'approved' ? 'bg-green-500 text-white' : comedian.comedianProfile?.status === 'declined' ? 'bg-red-500 text-white' : 'bg-primary text-on-primary'}`}>
                          {comedian.comedianProfile?.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-headline-sm font-headline-md text-on-surface">{comedian.username}</h4>
                          <p className="text-xs font-label-caps text-primary tracking-widest mt-1">{comedian.comedianProfile?.comedianType?.toUpperCase() || 'UNKNOWN'}</p>
                          <p className="text-xs text-on-surface-variant">{comedian.comedianProfile?.speciality || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-label-caps text-on-surface-variant">EXP.</p>
                          <p className="text-body-md font-bold text-on-surface">{comedian.comedianProfile?.experience || '0 yrs'}</p>
                        </div>
                      </div>
                      <p className="text-body-md font-body-md text-on-surface-variant line-clamp-3">{comedian.comedianProfile?.bio || 'No bio provided.'}</p>
                      
                      {comedian.comedianProfile?.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <button onClick={() => handleComedianStatusUpdate(comedian._id, 'approved')} className="w-full py-2 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white transition-all font-headline-md text-sm rounded">Approve</button>
                          <button onClick={() => handleComedianStatusUpdate(comedian._id, 'declined')} className="w-full py-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-headline-md text-sm rounded">Decline</button>
                        </div>
                      )}
                      {comedian.comedianProfile?.videoUrl && (
                        <a href={comedian.comedianProfile.videoUrl} target="_blank" rel="noopener noreferrer" className="block text-center mt-2 w-full py-2 border border-outline-variant hover:border-primary hover:text-primary transition-all font-headline-md text-sm">Watch Video</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: PAYMENTS */}
            {activeTab === 'payments' && (
              <div className="bg-surface-container-low brutal-border overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-variant/20 border-b border-outline-variant">
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Date & Time</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Customer</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Payment Info</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Booking Details</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Amount</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-6">
                          <p className="font-body-md text-on-surface">{new Date(payment.createdAt).toLocaleDateString('en-IN')}</p>
                          <p className="text-xs text-on-surface-variant">{new Date(payment.createdAt).toLocaleTimeString('en-IN')}</p>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-0.5">
                            <p className="font-headline-md text-on-surface">{payment.bookingDetails?.fullName || 'N/A'}</p>
                            <p className="text-xs text-on-surface-variant">{payment.user?.email || 'N/A'}</p>
                            <p className="text-xs text-on-surface-variant">{payment.bookingDetails?.phone || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-0.5">
                            <p className="text-body-md text-on-surface">{payment.paymentId}</p>
                            <p className="text-xs text-on-surface-variant">Order: {payment.orderId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-0.5">
                            <p className="text-body-md text-on-surface">
                              {payment.bookingDetails?.numberOfTickets ? `${payment.bookingDetails.numberOfTickets} ticket(s)` : 'No booking details'}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {payment.type === 'ticket_booking' ? 'Show Ticket' : payment.type}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <p className="font-bold text-primary">{formatCurrency(payment.amount / 100)}</p>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border 
                            ${payment.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                              payment.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                              'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT: CMS */}
            {activeTab === 'cms' && <HomepageCMS />}

          </section>
        </div>
      </main>

      {/* Password Reset Modal */}
      {passwordResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-surface-container-high brutal-border rounded-lg p-6 w-96">
            <h2 className="text-xl font-headline-md text-on-surface mb-4">Reset Password</h2>
            <p className="text-body-md text-on-surface-variant mb-4">For user: {selectedUser.username}</p>
            <div className="mb-6">
              <label htmlFor="newPassword" className="block text-sm font-label-caps text-on-surface-variant mb-2">
                NEW PASSWORD
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#080808] px-3 py-2 border border-outline-variant rounded focus:outline-none focus:border-primary text-on-surface"
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setPasswordResetModal(false);
                  setNewPassword('');
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetUserPassword}
                className="px-4 py-2 bg-primary-container text-on-primary-container rounded hover:brightness-110 transition-colors font-headline-md"
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
