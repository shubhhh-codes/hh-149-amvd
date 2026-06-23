import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SiteCMS from '@/components/admin/SiteCMS';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency } from '@/utils/format';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'users' | 'comedians' | 'payments' | 'cms'>('dashboard');
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
    fetchData();
  }, [session, status, router, activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'dashboard') {
        await Promise.all([fetchBookings(), fetchUsers(), fetchComedians(), fetchPayments()]);
      } else if (activeTab === 'bookings') {
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

  const handleStatusUpdate = async (bookingId: string, bookingStatus: string) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: bookingStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Booking status updated successfully');
      fetchBookings();
    } catch (err) {
      console.error('Update status error:', err);
      toast.error('Failed to update booking status');
    }
  };

  const handleComedianStatusUpdate = async (comedianId: string, comedianStatus: string) => {
    try {
      const response = await fetch('/api/admin/comedians', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comedianId, status: comedianStatus }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update comedian status');
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
        body: JSON.stringify({ userId: selectedUser._id, newPassword }),
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
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-[#e5e2e1] font-body-md overflow-x-hidden">
      <style jsx>{`
        .brutalist-card {
            border: 1px solid rgba(255, 255, 255, 0.07);
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .stagger-row {
            opacity: 0;
            animation: fadeInUp 0.4s ease-out forwards;
        }
        .stagger-row:nth-child(1) { animation-delay: 0.04s; }
        .stagger-row:nth-child(2) { animation-delay: 0.08s; }
        .stagger-row:nth-child(3) { animation-delay: 0.12s; }
        .stagger-row:nth-child(4) { animation-delay: 0.16s; }
        .stagger-row:nth-child(5) { animation-delay: 0.20s; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0A0A0A; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #353534; border-radius: 10px; }
      `}</style>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#0D0D0D] flex flex-col py-8 z-50 border-r border-white/5">
        <div className="px-6 mb-10">
          <h1 className="text-primary-container font-headline-md text-[24px] tracking-tight leading-tight uppercase font-bold">The Humours<br/>Hub</h1>
          <p className="text-[10px] text-on-surface-variant/50 font-label-caps mt-2 uppercase">Admin Portal</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-primary-container text-[#0A0A0A]' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>dashboard</span>
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('bookings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ${activeTab === 'bookings' ? 'bg-primary-container text-[#0A0A0A]' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>calendar_today</span>
            <span className="text-sm font-medium">Bookings</span>
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ${activeTab === 'users' ? 'bg-primary-container text-[#0A0A0A]' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>group</span>
            <span className="text-sm font-medium">Users</span>
          </button>
          <button onClick={() => setActiveTab('comedians')} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ${activeTab === 'comedians' ? 'bg-primary-container text-[#0A0A0A]' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>theater_comedy</span>
            <span className="text-sm font-medium">Comedian Apps</span>
          </button>
          <button onClick={() => setActiveTab('payments')} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ${activeTab === 'payments' ? 'bg-primary-container text-[#0A0A0A]' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>payments</span>
            <span className="text-sm font-medium">Payments</span>
          </button>
          <button onClick={() => setActiveTab('cms')} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 ${activeTab === 'cms' ? 'bg-primary-container text-[#0A0A0A]' : 'text-on-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>settings_suggest</span>
            <span className="text-sm font-medium">CMS</span>
          </button>
        </nav>
        <div className="px-3 mt-auto border-t border-white/5 pt-6">
          <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-3 px-4 py-3 rounded text-error hover:bg-error/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 ml-[220px] min-h-screen flex flex-col">
        {/* TopNavBar */}
        <header className="h-20 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 md:px-margin-desktop sticky top-0 z-40">
          <div className="flex items-center gap-6 w-1/2">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">search</span>
              <input className="w-full bg-[#080808] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-primary-container focus:outline-none transition-colors" placeholder="Global Search (Commands, Bookings, Events...)" type="text" />
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 bg-[#353534]/20 px-3 py-1.5 rounded-full border border-white/5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[11px] font-label-caps text-on-surface tracking-widest uppercase">Cloud Engines Live</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold font-headline-md leading-none">Admin Hub</p>
                  <p className="text-[10px] text-on-surface-variant/60 font-medium mt-1">{session?.user?.email}</p>
                </div>
                <div className="w-10 h-10 rounded-lg brutalist-card bg-primary/10 flex items-center justify-center text-primary font-bold">
                  A
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* View Containers */}
        <div className="p-8 md:p-margin-desktop space-y-10 custom-scrollbar overflow-y-auto flex-1">
          {error && (
            <div className="bg-error-container/20 border border-error p-4 rounded-lg flex items-center gap-2 text-error">
              <span className="material-symbols-outlined">error</span>
              <p>{error}</p>
            </div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <section className="space-y-10 animate-enter">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#141414] p-6 brutalist-card border-l-[3px] border-l-primary-container hover:translate-y-[-4px] transition-transform duration-300">
                  <p className="text-on-surface-variant/60 text-[12px] font-label-caps mb-1 uppercase">Total Revenue</p>
                  <h3 className="text-[24px] font-headline-md font-bold text-on-surface">{formatCurrency(paymentStats.totalAmount / 100)}</h3>
                </div>
                <div className="bg-[#141414] p-6 brutalist-card border-l-[3px] border-l-primary-container hover:translate-y-[-4px] transition-transform duration-300">
                  <p className="text-on-surface-variant/60 text-[12px] font-label-caps mb-1 uppercase">Active Bookings</p>
                  <h3 className="text-[24px] font-headline-md font-bold text-on-surface">{bookings.length}</h3>
                </div>
                <div className="bg-[#141414] p-6 brutalist-card border-l-[3px] border-l-primary-container hover:translate-y-[-4px] transition-transform duration-300">
                  <p className="text-on-surface-variant/60 text-[12px] font-label-caps mb-1 uppercase">Pending Apps</p>
                  <h3 className="text-[24px] font-headline-md font-bold text-on-surface">{comedians.filter(c => c.comedianProfile?.status === 'pending').length}</h3>
                </div>
                <div className="bg-[#141414] p-6 brutalist-card border-l-[3px] border-l-primary-container hover:translate-y-[-4px] transition-transform duration-300">
                  <p className="text-on-surface-variant/60 text-[12px] font-label-caps mb-1 uppercase">Total Users</p>
                  <h3 className="text-[24px] font-headline-md font-bold text-on-surface">{users.length}</h3>
                </div>
              </div>

              <div className="bg-[#141414] p-8 brutalist-card">
                 <h2 className="text-[24px] font-headline-md font-bold mb-4">Welcome to The Humours Hub Admin Portal</h2>
                 <p className="text-on-surface-variant">Select a tab on the left to manage Bookings, Users, Comedian Applications, Payments, or update the Homepage CMS.</p>
              </div>
            </section>
          )}

          {/* BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <section className="space-y-6 animate-enter">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-[32px] font-headline-md font-bold">Event Bookings</h2>
              </div>
              <div className="bg-[#141414] brutalist-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0A0A0A] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Date</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Customer</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Tickets</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Amount</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Status</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bookings.map((booking) => (
                      <tr key={booking._id} className="stagger-row hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-medium">{new Date(booking.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold">{booking.fullName}</span>
                            <span className="text-[11px] text-on-surface-variant/60">{booking.email} | {booking.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{booking.numberOfTickets} ticket(s)</td>
                        <td className="px-6 py-4 font-headline-md font-bold">{formatCurrency((booking.numberOfTickets || 0) * 149)}</td>
                        <td className="px-6 py-4">
                          {booking.status === 'pending' && <span className="border border-yellow-500/50 text-yellow-500 px-2 py-0.5 rounded text-[10px] font-label-caps uppercase tracking-widest">Pending</span>}
                          {booking.status === 'approved' && <span className="border border-green-500/50 text-green-500 px-2 py-0.5 rounded text-[10px] font-label-caps uppercase tracking-widest">Approved</span>}
                          {booking.status === 'declined' && <span className="border border-red-500/50 text-red-500 px-2 py-0.5 rounded text-[10px] font-label-caps uppercase tracking-widest">Declined</span>}
                        </td>
                        <td className="px-6 py-4">
                          {booking.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleStatusUpdate(booking._id, 'approved')} className="text-green-500 hover:text-green-400 font-bold text-xs uppercase">Approve</button>
                              <button onClick={() => handleStatusUpdate(booking._id, 'declined')} className="text-red-500 hover:text-red-400 font-bold text-xs uppercase">Decline</button>
                            </div>
                          ) : (
                            <span className="text-on-surface-variant/60 text-xs">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <section className="space-y-6 animate-enter">
              <h2 className="text-[32px] font-headline-md font-bold">User Accounts</h2>
              <div className="bg-[#141414] brutalist-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0A0A0A] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">User Details</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Role</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Joined At</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user._id} className="stagger-row hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold font-headline-md text-lg">{user.username}</span>
                            <span className="text-[11px] text-on-surface-variant/60">{user.email} | {user.phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="border border-primary-container/50 text-primary-container px-2 py-0.5 rounded text-[10px] font-label-caps uppercase tracking-widest">{user.role}</span>
                        </td>
                        <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleResetPassword(user)} className="text-primary-container hover:underline font-label-caps text-xs">Reset Password</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* COMEDIANS TAB */}
          {activeTab === 'comedians' && (
            <section className="space-y-6 animate-enter">
              <h2 className="text-[32px] font-headline-md font-bold">Comedian Applications</h2>
              <div className="bg-[#141414] brutalist-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0A0A0A] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Name</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Art Form</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Experience & Bio</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Status</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {comedians.map((comedian) => (
                      <tr key={comedian._id} className="stagger-row hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold">{comedian.username}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold">{comedian.comedianProfile?.comedianType || 'Unknown'}</span>
                            <span className="text-[11px] text-on-surface-variant/60">{comedian.comedianProfile?.speciality || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col max-w-xs">
                            <span className="text-xs font-bold text-primary-container">{comedian.comedianProfile?.experience || '0 yrs'}</span>
                            <span className="text-[11px] text-on-surface-variant/60 line-clamp-2">{comedian.comedianProfile?.bio}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {comedian.comedianProfile?.status === 'pending' && <span className="border border-yellow-500/50 text-yellow-500 px-2 py-0.5 rounded text-[10px] font-label-caps uppercase tracking-widest">In Review</span>}
                          {comedian.comedianProfile?.status === 'approved' && <span className="border border-green-500/50 text-green-500 px-2 py-0.5 rounded text-[10px] font-label-caps uppercase tracking-widest">Approved</span>}
                          {comedian.comedianProfile?.status === 'declined' && <span className="border border-red-500/50 text-red-500 px-2 py-0.5 rounded text-[10px] font-label-caps uppercase tracking-widest">Declined</span>}
                        </td>
                        <td className="px-6 py-4">
                          {comedian.comedianProfile?.status === 'pending' ? (
                            <div className="flex flex-col gap-2">
                               <button onClick={() => handleComedianStatusUpdate(comedian._id, 'approved')} className="bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded text-xs font-bold hover:bg-green-500 hover:text-white transition-colors">Approve</button>
                               <button onClick={() => handleComedianStatusUpdate(comedian._id, 'declined')} className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">Decline</button>
                            </div>
                          ) : (
                            <span className="text-on-surface-variant/60 text-xs">Processed</span>
                          )}
                          {comedian.comedianProfile?.videoUrl && (
                             <a href={comedian.comedianProfile.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-[10px] text-primary hover:underline">Watch Video</a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <section className="space-y-8 animate-enter">
              <div className="flex justify-between items-center">
                 <h2 className="text-[32px] font-headline-md font-bold">Payments Records</h2>
                 <DownloadPaymentsButton payments={payments} className="!bg-transparent !text-primary-container !border-none !shadow-none hover:underline underline-offset-4 flex items-center gap-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#141414] p-6 brutalist-card">
                  <p className="text-[10px] font-label-caps text-on-surface-variant/60 uppercase">Total Processed</p>
                  <h4 className="text-[24px] font-headline-md font-bold">{formatCurrency(paymentStats.totalAmount / 100)}</h4>
                </div>
                <div className="bg-[#141414] p-6 brutalist-card">
                  <p className="text-[10px] font-label-caps text-on-surface-variant/60 text-green-400 uppercase">Successful Payments</p>
                  <h4 className="text-[24px] font-headline-md font-bold">{paymentStats.successfulPayments}</h4>
                </div>
                <div className="bg-[#141414] p-6 brutalist-card">
                  <p className="text-[10px] font-label-caps text-on-surface-variant/60 text-error uppercase">Failed Payments</p>
                  <h4 className="text-[24px] font-headline-md font-bold">{paymentStats.failedPayments}</h4>
                </div>
              </div>
              <div className="bg-[#141414] brutalist-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0A0A0A] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">ID</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Customer</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Amount</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Razorpay ID</th>
                      <th className="px-6 py-4 font-label-caps text-xs text-on-surface-variant/60 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((payment) => (
                      <tr key={payment._id} className="stagger-row hover:bg-white/5 transition-colors border-b border-white/5">
                        <td className="px-6 py-4 font-mono text-[11px] text-on-surface-variant">Order: {payment.orderId}</td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="font-bold">{payment.bookingDetails?.fullName || 'N/A'}</span>
                                <span className="text-[11px] text-on-surface-variant/60">{payment.user?.email || 'N/A'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-primary-container">{formatCurrency(payment.amount / 100)}</td>
                        <td className="px-6 py-4 text-on-surface-variant/60 font-mono text-xs">{payment.paymentId}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${payment.status === 'completed' ? 'bg-green-500/20 text-green-400' : payment.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                             {payment.status === 'completed' ? 'SUCCESS' : payment.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* CMS TAB */}
          {activeTab === 'cms' && (
            <section className="space-y-10 animate-enter">
              <h2 className="text-[32px] font-headline-md font-bold">Homepage Content Management</h2>
              <SiteCMS />
            </section>
          )}
        </div>

        <footer className="p-8 border-t border-white/5 bg-[#0A0A0A] text-[11px] font-label-caps text-on-surface-variant/30 flex justify-between uppercase">
          <span>© 2024 THE HUMOURS HUB • BY SHUBHHH</span>
          <span>HUMOURS HUB 1.0.0-DEV</span>
        </footer>
      </main>

      {/* Password Reset Modal */}
      {passwordResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-[#141414] brutalist-card rounded-lg p-8 w-96">
            <h2 className="text-[24px] font-headline-md font-bold text-on-surface mb-2">Reset Password</h2>
            <p className="text-sm text-on-surface-variant mb-6">For user: <span className="font-bold">{selectedUser.username}</span></p>
            <div className="mb-6">
              <label htmlFor="newPassword" className="block text-[10px] font-label-caps text-on-surface-variant mb-2 uppercase">
                NEW PASSWORD
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#080808] px-4 py-3 border border-white/10 rounded-lg focus:outline-none focus:border-primary-container text-on-surface transition-colors"
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
                className="px-6 py-2 border border-white/10 text-on-surface-variant rounded font-bold text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetUserPassword}
                className="px-6 py-2 bg-primary-container text-[#0A0A0A] rounded font-bold text-sm hover:opacity-90 transition-opacity uppercase tracking-wider"
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
