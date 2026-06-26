import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { startRegistration } from '@simplewebauthn/browser';
import SiteCMS from '@/components/admin/SiteCMS';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency } from '@/utils/format';
import DownloadPaymentsButton from '@/components/UserDownloadPDF';
import Image from 'next/image';
import QRScanner from '@/components/admin/QRScanner';

interface Booking {
  _id: string;
  bookingId: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'cancelled';
  bookingType: 'paid' | 'complimentary';
  numberOfTickets?: number;
  checkedInCount?: number;
  attended?: boolean;
  attendedAt?: string;
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
    experience: number;
    bio: string;
    videoUrl: string;
    status: 'pending' | 'approved' | 'declined';
    isFeatured?: boolean;
    tagline?: string;
    instagramUrl?: string;
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
  bookingId?: string;
  bookingDetails?: {
    numberOfTickets: number;
    fullName: string;
    phone: string;
    email: string;
  };
}

interface ContactMessage {
  _id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
}

interface PaymentStats {
  totalAmount: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
}

interface Feedback {
  _id: string;
  fullName: string;
  email: string;
  category: string;
  vibe: string;
  comment: string;
  createdAt: string;
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner' | 'bookings' | 'comedians' | 'payments' | 'messages' | 'cms' | 'feedbacks'>('scanner');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [comedians, setComedians] = useState<ComedianProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalAmount: 0,
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Complimentary booking modal
  const [showCompModal, setShowCompModal] = useState(false);
  const [compForm, setCompForm] = useState({ fullName: '', email: '', phone: '', numberOfTickets: 1 });

  // Add Comedian modal
  const [showAddComedianModal, setShowAddComedianModal] = useState(false);
  const [comedianForm, setComedianForm] = useState<{
    id?: string;
    username: string;
    email: string;
    phone: string;
    speciality: string;
    tagline: string;
    instagramUrl: string;
    isFeatured: boolean;
    imageFile?: File | null;
  }>({
    username: '',
    email: '',
    phone: '',
    speciality: '',
    tagline: '',
    instagramUrl: '',
    isFeatured: false,
    imageFile: null,
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');

  const fetchBookings = useCallback(async () => {
    const res = await fetch('/api/admin/bookings');
    if (!res.ok) throw new Error('Failed to fetch bookings');
    const data = await res.json();
    setBookings(data.bookings);
  }, []);

  const fetchComedians = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/comedians');
      if (!response.ok) throw new Error('Failed to fetch comedians');
      const data = await response.json();
      setComedians(data.comedians);
    } catch (error) {
      console.error('Fetch comedians error:', error);
      setError('Failed to load comedians');
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payments');
      if (!res.ok) throw new Error('Failed to fetch payments');
      const data = await res.json();
      setPayments(data.payments);
      setPaymentStats(data.stats);
    } catch (err) {
      console.error('Fetch payments error:', err);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contact-messages');
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data.messages);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  }, []);

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/feedbacks');
      if (!res.ok) throw new Error('Failed to fetch feedbacks');
      const data = await res.json();
      setFeedbacks(data.feedbacks);
    } catch (err) {
      console.error('Fetch feedbacks error:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      if (activeTab === 'dashboard') {
        await Promise.all([fetchBookings(), fetchComedians(), fetchPayments(), fetchMessages(), fetchFeedbacks()]);
      } else if (activeTab === 'bookings') {
        await fetchBookings();
      } else if (activeTab === 'comedians') {
        await fetchComedians();
      } else if (activeTab === 'payments') {
        await fetchPayments();
      } else if (activeTab === 'messages') {
        await fetchMessages();
      } else if (activeTab === 'feedbacks') {
        await fetchFeedbacks();
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchBookings, fetchComedians, fetchPayments, fetchMessages, fetchFeedbacks]);

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.role !== 'admin') {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [session, status, router, activeTab, fetchData]);

  // Intercept hardware/browser back button for the Comedians tab
  useEffect(() => {
    if (activeTab === 'comedians') {
      window.history.pushState({ internalTab: true }, '');
    }

    const handlePopState = (e: PopStateEvent) => {
      if (activeTab === 'comedians') {
        setActiveTab('cms');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  const handleRegisterPasskey = async () => {
    try {
      const resp = await fetch('/api/auth/webauthn/register-options', { method: 'POST' });
      if (!resp.ok) throw new Error('Failed to fetch registration options');
      const { options, challengeId } = await resp.json();
      
      const authResponse = await startRegistration(options);
      
      const verifyResp = await fetch('/api/auth/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: authResponse, challengeId }),
      });

      if (verifyResp.ok) {
        toast.success('Passkey registered successfully! You can now use it to log in.');
      } else {
        throw new Error('Verification failed');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Passkey registration failed');
    }
  };

  const handleTriggerCron = async () => {
    try {
      toast.info('Triggering Daily Digest...');
      const res = await fetch('/api/cron/daily-digest');
      if (!res.ok) throw new Error('Failed to trigger daily digest');
      toast.success('Daily Digest sent to Slack successfully!');
    } catch (err: any) {
      console.error('Cron error:', err);
      toast.error('Failed to trigger Daily Digest. Is your Slack webhook configured?');
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

  const handleAttendanceToggle = async (bookingId: string, currentAttended: boolean) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, attended: !currentAttended }),
      });

      if (!res.ok) throw new Error('Failed to update attendance');
      toast.success(`Attendance ${!currentAttended ? 'marked' : 'unmarked'}`);
      fetchBookings();
    } catch (err) {
      console.error('Attendance error:', err);
      toast.error('Failed to update attendance');
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

  const handleComedianFeatureToggle = async (comedianId: string, currentFeatured: boolean) => {
    try {
      const response = await fetch('/api/admin/comedians', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comedianId, isFeatured: !currentFeatured }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update featured status');
      }

      toast.success(!currentFeatured ? 'Comedian featured on homepage' : 'Comedian removed from homepage');
      fetchComedians();
    } catch (error: any) {
      console.error('Feature toggle error:', error);
      toast.error(error.message || 'Failed to update featured status');
    }
  };

  const handleCreateCompBooking = async () => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(`Complimentary booking created: ${data.bookingId}`);
      setShowCompModal(false);
      setCompForm({ fullName: '', email: '', phone: '', numberOfTickets: 1 });
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create booking');
    }
  };

  const handleMessageStatusUpdate = async (messageId: string, status: 'read' | 'unread') => {
    try {
      const res = await fetch('/api/admin/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, status })
      });
      if (!res.ok) throw new Error('Failed to update message status');
      fetchMessages();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleMessageDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`/api/admin/contact-messages?messageId=${messageId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete message');
      toast.success('Message deleted');
      fetchMessages();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveComedian = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let photoId = undefined;
      
      if (comedianForm.imageFile) {
        const formData = new FormData();
        formData.append('file', comedianForm.imageFile);
        const uploadRes = await fetch('/api/admin/cms/upload', {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) throw new Error('Failed to upload image');
        const uploadData = await uploadRes.json();
        photoId = uploadData.url.split('/').pop();
      }

      const payload: any = { ...comedianForm };
      delete payload.imageFile;
      if (photoId) payload.photoId = photoId;
      if (payload.id) {
        payload.name = payload.username; // PUT endpoint expects 'name'
      }

      const url = payload.id ? `/api/admin/comedians/${payload.id}` : '/api/admin/comedians';
      const method = payload.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(payload.id ? 'Comedian updated successfully' : 'Comedian added successfully');
      setShowAddComedianModal(false);
      setComedianForm({ username: '', email: '', phone: '', speciality: '', tagline: '', instagramUrl: '', isFeatured: false, imageFile: null });
      fetchComedians();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save comedian');
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'PENDING' && b.status !== 'pending') return false;
      if (filterStatus === 'CONFIRMED' && b.status !== 'approved') return false;
      if (filterStatus === 'CANCELLED' && b.status !== 'cancelled') return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.bookingId?.toLowerCase().includes(q) ||
      b.fullName?.toLowerCase().includes(q) ||
      b.email?.toLowerCase().includes(q) ||
      b.phone?.includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', short: 'DASH' },
    { id: 'scanner', label: 'QR Scanner', icon: 'document_scanner', short: 'SCAN' },
    { id: 'bookings', label: 'Bookings', icon: 'calendar_today', short: 'BOOK' },
    { id: 'cms', label: 'CMS', icon: 'widgets', short: 'CMS' },
    { id: 'messages', label: 'Messages', icon: 'mail', short: 'MSG' },
    { id: 'payments', label: 'Payments', icon: 'payments', short: 'PAY' },
  ];

  return (
    <div className="bg-[#0e0e0e] text-[#e5e2e1] font-body-md antialiased overflow-hidden flex h-screen w-full">
      
      {/* Mobile Top App Bar */}
      <header className="md:hidden flex justify-between items-center w-full px-5 h-20 bg-[#131313] border-b border-white/5 fixed top-0 left-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container font-bold">
            HH
          </div>
          <h1 className="text-lg font-headline-sm text-primary-container tracking-tight font-bold uppercase">The Humours Hub</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRegisterPasskey}
            className="w-10 h-10 rounded-full bg-[#353534] hover:bg-primary-container/20 text-on-surface hover:text-primary-container flex items-center justify-center transition-colors border border-white/5"
            aria-label="Register Passkey"
          >
            <span className="material-symbols-outlined text-lg">fingerprint</span>
          </button>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-10 h-10 rounded-full brutalist-border overflow-hidden bg-[#353534] shrink-0 flex items-center justify-center font-bold text-error hover:bg-error/20 transition-colors"
            aria-label="Logout"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </header>

      {/* Desktop Side Navigation */}
      <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 py-8 gap-4 bg-[#1c1b1b] border-r border-white/5 w-64 z-40 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary-container/20 border border-white/5 flex items-center justify-center text-primary-container font-bold text-xl">
            HH
          </div>
          <div>
            <h1 className="text-xl font-headline-sm text-primary-container font-bold uppercase tracking-wide">Admin Portal</h1>
            <p className="text-[10px] text-on-surface/50 uppercase tracking-wider">Manage Platform</p>
          </div>
        </div>
        
        {/* Nav Links */}
        <div className="flex-1 flex flex-col gap-2 px-4">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === link.id 
                  ? 'bg-primary-container text-[#0A0A0A] shadow-[0_0_15px_rgba(255,107,26,0.3)] font-bold' 
                  : 'text-on-surface/70 hover:bg-white/5 hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined" style={{fontVariationSettings: activeTab === link.id ? "'FILL' 1" : "'FILL' 0"}}>
                {link.icon}
              </span>
              <span className="font-body-md text-sm">{link.label}</span>
            </button>
          ))}
        </div>
        
        {/* Footer */}
        <div className="mt-auto px-4">
          <button 
            onClick={handleRegisterPasskey}
            className="w-full flex items-center gap-3 px-4 py-3 text-primary-container hover:bg-white/5 rounded-lg transition-all duration-200"
          >
            <span className="material-symbols-outlined">fingerprint</span>
            <span className="font-body-md text-sm font-medium">Register Passkey</span>
          </button>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })} 
            className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-white/5 rounded-lg transition-all duration-200"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-body-md text-sm font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pt-24 md:pt-0 pb-24 md:pb-0 h-screen overflow-y-auto relative bg-[#0e0e0e]">
        <div className="absolute inset-0 spotlight-glow pointer-events-none z-0"></div>
        <div className="relative z-10 max-w-container-max mx-auto px-5 md:px-12 py-8 md:py-12">
          
          {error && (
            <div className="bg-error-container/20 border border-error p-4 rounded-lg flex items-center gap-2 text-error mb-8">
              <span className="material-symbols-outlined">error</span>
              <p>{error}</p>
            </div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <section className="space-y-6 animate-enter">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#131313] p-4 rounded brutalist-border flex flex-col justify-between min-h-[100px]">
                  <span className="font-label-caps text-[10px] text-on-surface/50 tracking-widest uppercase">Total Revenue</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="font-headline-md text-3xl font-bold leading-none text-primary-container">{formatCurrency(paymentStats.totalAmount / 100)}</span>
                  </div>
                </div>
                <div className="bg-[#131313] p-4 rounded brutalist-border flex flex-col justify-between min-h-[100px]">
                  <span className="font-label-caps text-[10px] text-on-surface/50 tracking-widest uppercase">Active Bookings</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="font-headline-md text-3xl font-bold leading-none">{bookings.filter(b => b.status !== 'cancelled').length}</span>
                  </div>
                </div>
                <div className="bg-[#131313] p-4 rounded brutalist-border flex flex-col justify-between min-h-[100px]">
                  <span className="font-label-caps text-[10px] text-on-surface/50 tracking-widest uppercase">Pending Apps</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="font-headline-md text-3xl font-bold leading-none text-primary-container">{comedians.filter(c => c.comedianProfile?.status === 'pending').length}</span>
                  </div>
                </div>
                <div className="bg-[#131313] p-4 rounded brutalist-border flex flex-col justify-between min-h-[100px]">
                  <span className="font-label-caps text-[10px] text-on-surface/50 tracking-widest uppercase">Total Tickets</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="font-headline-md text-3xl font-bold leading-none">{bookings.filter(b => b.status === 'approved').reduce((sum, b) => sum + (b.numberOfTickets || 0), 0)}</span>
                  </div>
                </div>
                <div className="bg-[#131313] p-4 rounded brutalist-border flex flex-col justify-between min-h-[100px]">
                  <span className="font-label-caps text-[10px] text-on-surface/50 tracking-widest uppercase">Total Feedbacks</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="font-headline-md text-3xl font-bold leading-none text-primary-container">{feedbacks.length}</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#131313] p-6 rounded brutalist-border mt-4 flex justify-between items-center">
                 <div>
                   <h2 className="text-xl font-headline-md font-bold mb-2 uppercase tracking-wide">Welcome to Admin Portal</h2>
                   <p className="text-on-surface/70 text-sm">Use the navigation to manage Bookings, Comedian Applications, Payments, or update the Content Management System.</p>
                 </div>
                 <button 
                   onClick={handleTriggerCron}
                   className="bg-primary-container text-[#0A0A0A] px-6 py-3 rounded-lg font-bold text-sm tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-2 brutalist-border"
                 >
                   <span className="material-symbols-outlined">send</span>
                   Send Daily Digest
                 </button>
              </div>
            </section>
          )}

          {/* SCANNER TAB */}
          {activeTab === 'scanner' && (
            <section className="space-y-6 animate-enter min-h-[60vh] flex flex-col justify-center">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-headline-md font-bold uppercase tracking-wide">Ticket Scanner</h2>
                <p className="text-on-surface/50 text-sm mt-2">Point the camera at the customer's QR code to verify and check-in.</p>
              </div>
              <QRScanner />
            </section>
          )}

          {/* BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <>
              <section className="pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#131313] p-4 rounded brutalist-border flex flex-col justify-between min-h-[100px]">
                    <span className="font-label-caps text-[10px] text-on-surface/50 tracking-widest uppercase">Pending Approval</span>
                    <div className="flex items-end justify-between mt-2">
                      <span className="font-headline-md text-3xl font-bold leading-none text-primary-container">{bookings.filter(b => b.status === 'pending').length}</span>
                      <span className="material-symbols-outlined text-primary-container/50 text-xl">hourglass_empty</span>
                    </div>
                  </div>
                  <div className="bg-[#131313] p-4 rounded brutalist-border flex flex-col justify-between min-h-[100px]">
                    <span className="font-label-caps text-[10px] text-on-surface/50 tracking-widest uppercase">Today's Sales</span>
                    <div className="flex items-end justify-between mt-2">
                      <span className="font-headline-md text-3xl font-bold leading-none">{bookings.filter(b => b.status === 'approved' && new Date(b.createdAt).toDateString() === new Date().toDateString()).reduce((sum, b) => sum + (b.numberOfTickets || 0), 0)}</span>
                      <span className="material-symbols-outlined text-on-surface/30 text-xl">confirmation_number</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-center md:justify-end">
                  <button
                    onClick={() => setShowCompModal(true)}
                    className="bg-primary-container text-[#0A0A0A] px-4 py-2 font-headline-sm text-sm font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 uppercase tracking-wider"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Create Complimentary Booking
                  </button>
                </div>
              </section>

              <section className="pb-6 sticky top-0 md:top-[-48px] z-30 bg-[#0e0e0e]/95 backdrop-blur-sm pt-2">
                <div className="relative w-full h-12 flex items-center rounded brutalist-border bg-[#1c1b1b] focus-within:border-primary-container transition-colors overflow-hidden">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface/50">search</span>
                  <input 
                    className="w-full h-full bg-transparent border-none pl-11 pr-4 text-sm focus:ring-0 placeholder:text-on-surface/30 text-on-surface font-body-md outline-none" 
                    placeholder="Search ID, Name, or Event..." 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                  {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'].map((status) => (
                    <button 
                      key={status}
                      onClick={() => setFilterStatus(status as any)}
                      className={`shrink-0 px-4 py-1.5 rounded-full font-label-caps text-xs transition-colors ${
                        filterStatus === status 
                          ? 'bg-[#e5e2e1] text-[#0e0e0e]' 
                          : 'brutalist-border text-[#e5e2e1]/70 hover:bg-white/5'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </section>

              <div className="flex flex-col gap-4">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12 text-on-surface/50">No bookings found.</div>
                ) : (
                  filteredBookings.map((booking) => (
                    <article key={booking._id} className={`bg-[#131313] brutalist-border rounded p-4 relative overflow-hidden flex flex-col gap-5 ${booking.status === 'cancelled' ? 'opacity-60' : ''}`}>
                      <div className={`absolute top-0 left-0 w-1 h-full ${booking.status === 'pending' ? 'bg-primary-container' : booking.status === 'approved' ? 'bg-white/20' : 'bg-red-500'}`}></div>
                      <div className="flex justify-between items-start pl-3">
                        <div>
                          <div className="font-label-caps text-on-surface/50 text-[10px] mb-1">ID #{booking.bookingId}</div>
                          <h2 className="font-headline-sm text-lg leading-tight uppercase font-bold">{booking.fullName}</h2>
                          <div className="text-xs text-on-surface/70 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">mail</span>
                            {booking.email}
                          </div>
                          {booking.phone && (
                            <div className="text-xs text-on-surface/70 mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">call</span>
                              {booking.phone}
                            </div>
                          )}
                        </div>
                        <span className={`font-label-caps px-2 py-1 rounded text-[10px] brutalist-border ${
                          booking.status === 'pending' ? 'bg-primary-container/10 text-primary-container border-primary-container/30' :
                          booking.status === 'approved' ? 'bg-[#201f1f] text-on-surface/70' :
                          'bg-red-500/10 text-red-500 border-red-500/30'
                        }`}>
                          {booking.status === 'approved' ? 'CONFIRMED' : booking.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-4 gap-x-4 pl-3 border-t border-white/5 pt-4">
                        <div>
                          <div className="font-label-caps text-on-surface/40 text-[10px] mb-1">TYPE</div>
                          <div className="text-sm font-medium uppercase">{booking.bookingType}</div>
                        </div>
                        <div>
                          <div className="font-label-caps text-on-surface/40 text-[10px] mb-1">DATE</div>
                          <div className="text-sm">{new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                        <div>
                          <div className="font-label-caps text-on-surface/40 text-[10px] mb-1">TICKETS</div>
                          <div className="text-sm">{booking.numberOfTickets} x General Admin</div>
                        </div>
                        <div>
                          <div className="font-label-caps text-on-surface/40 text-[10px] mb-1">ATTENDANCE</div>
                          <div className="text-sm font-headline-sm">
                            <span className={booking.attended ? "text-green-400" : (booking.checkedInCount && booking.checkedInCount > 0) ? "text-primary-container" : "text-on-surface/50"}>
                              {booking.checkedInCount || 0} / {booking.numberOfTickets} Checked In
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pl-3 pt-2">
                        {booking.status === 'pending' ? (
                          <>
                            <button onClick={() => handleStatusUpdate(booking.bookingId, 'approved')} className="flex-1 bg-primary-container text-[#0e0e0e] font-headline-sm text-sm h-12 rounded-xl flex items-center justify-center active:scale-[0.98] transition-transform uppercase">APPROVE</button>
                            <button onClick={() => handleStatusUpdate(booking.bookingId, 'cancelled')} className="flex-1 bg-transparent brutalist-border text-[#e5e2e1] font-headline-sm text-sm h-12 rounded-xl flex items-center justify-center active:bg-[#201f1f] transition-colors uppercase">DECLINE</button>
                          </>
                        ) : booking.status === 'approved' ? (
                          <button 
                            onClick={() => handleAttendanceToggle(booking.bookingId, !!booking.attended)}
                            className={`w-full brutalist-border text-sm h-12 rounded-xl flex items-center justify-center gap-2 transition-colors uppercase font-bold tracking-wide ${booking.attended ? 'bg-[#201f1f] text-[#e5e2e1]' : 'bg-[#e5e2e1] text-[#0e0e0e]'}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {booking.attended ? 'check_circle' : 'how_to_reg'}
                            </span>
                            {booking.attended ? 'UNMARK ATTENDANCE' : 'MARK ATTENDANCE'}
                          </button>
                        ) : (
                          <div className="w-full text-center text-error font-label-caps text-xs py-2">CANCELLED</div>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          )}

          {/* FEEDBACKS TAB */}
          {activeTab === 'feedbacks' && (
            <section className="space-y-6 animate-enter mb-24">
              <button 
                type="button"
                onClick={() => setActiveTab('cms')}
                className="flex w-fit items-center gap-2 px-4 py-2 bg-[#201f1f] brutalist-border rounded-lg text-sm font-label-caps tracking-widest text-on-surface/80 hover:text-on-surface hover:bg-[#2a2a2a] transition-colors uppercase mt-2 mb-4"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back to Hub
              </button>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-headline-md font-bold uppercase tracking-wide">User Feedbacks</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {feedbacks.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-on-surface/50">No feedback submitted yet.</div>
                ) : (
                  feedbacks.map((fb) => {
                    const vibeIcon = fb.vibe === 'hilarious' ? 'sentiment_very_satisfied' :
                                     fb.vibe === 'great' ? 'theater_comedy' :
                                     fb.vibe === 'good' ? 'sentiment_satisfied' :
                                     fb.vibe === 'needs-work' ? 'build' : 'sentiment_dissatisfied';
                    const vibeScore = fb.vibe === 'hilarious' ? 5 :
                                      fb.vibe === 'great' ? 4 :
                                      fb.vibe === 'good' ? 3 :
                                      fb.vibe === 'needs-work' ? 2 : 1;
                    return (
                      <article key={fb._id} className="bg-[#131313] brutalist-border rounded-xl p-5 relative overflow-hidden flex flex-col gap-4">
                         <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-4 sm:gap-0">
                            <div className="min-w-0 flex-1 pr-0 sm:pr-4">
                              <h2 className="font-headline-sm text-lg leading-tight uppercase font-bold break-words">{fb.fullName}</h2>
                              <div className="text-xs text-on-surface/70 mt-1 flex items-start gap-1">
                                <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">mail</span>
                                <span className="break-all">{fb.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                               <span className="font-headline font-bold text-xl text-primary">{vibeScore}/5</span>
                               <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 shrink-0">
                                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{vibeIcon}</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-sm bg-surface-container-low p-3 rounded border border-white/5 text-on-surface/90 italic">
                            "{fb.comment}"
                         </div>
                         <div className="flex justify-between items-end mt-auto pt-2 border-t border-white/5">
                            <div>
                               <span className="font-label-caps text-[10px] text-on-surface/50">CATEGORY</span>
                               <div className="text-xs uppercase tracking-wide font-bold text-on-surface/80">{fb.category}</div>
                            </div>
                            <div className="text-right">
                               <span className="font-label-caps text-[10px] text-on-surface/50">DATE</span>
                               <div className="text-xs">{new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                         </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* COMEDIANS TAB */}
          {activeTab === 'comedians' && (
            <section className="space-y-6 animate-enter mb-24">
              <button 
                type="button"
                onClick={() => {
                  setActiveTab('cms');
                  if (window.history.state?.internalTab) {
                    window.history.back();
                  }
                }}
                className="flex w-fit items-center gap-2 px-4 py-2 bg-[#201f1f] brutalist-border rounded-lg text-sm font-label-caps tracking-widest text-on-surface/80 hover:text-on-surface hover:bg-[#2a2a2a] transition-colors uppercase mt-2 mb-4"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back to Hub
              </button>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-headline-md font-bold uppercase tracking-wide">Comedian Apps</h2>
                <button
                  onClick={() => setShowAddComedianModal(true)}
                  className="bg-primary-container text-[#0A0A0A] px-4 py-2 font-headline-sm text-sm font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Add Comedian
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {comedians.map((comedian) => (
                  <article key={comedian._id} className="bg-[#131313] brutalist-border rounded p-4 relative overflow-hidden flex flex-col gap-4">
                     <div className={`absolute top-0 left-0 w-1 h-full ${comedian.comedianProfile?.status === 'pending' ? 'bg-primary-container' : comedian.comedianProfile?.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                     <div className="flex justify-between items-start pl-3">
                        <div>
                          <h2 className="font-headline-sm text-lg leading-tight uppercase font-bold">{comedian.username}</h2>
                          <div className="text-xs text-on-surface/70 mt-1 flex flex-col gap-1">
                            <span className="uppercase tracking-wider">{comedian.comedianProfile?.comedianType} • {comedian.comedianProfile?.speciality}</span>
                            {comedian.email && (
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mail</span>{comedian.email}</span>
                            )}
                            {comedian.phone && (
                              <a href={`https://wa.me/${comedian.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary-container transition-colors w-fit"><span className="material-symbols-outlined text-[14px]">chat</span>{comedian.phone}</a>
                            )}
                          </div>
                        </div>
                        <span className={`font-label-caps px-2 py-1 rounded text-[10px] brutalist-border ${
                          comedian.comedianProfile?.status === 'pending' ? 'bg-primary-container/10 text-primary-container border-primary-container/30' :
                          comedian.comedianProfile?.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                          'bg-red-500/10 text-red-500 border-red-500/30'
                        }`}>
                          {comedian.comedianProfile?.status?.toUpperCase()}
                        </span>
                     </div>
                     <div className="pl-3 text-sm text-on-surface/80">
                        <p className="mb-2"><strong className="text-primary-container uppercase tracking-wide text-xs">{comedian.comedianProfile?.experience} Stage Experience</strong></p>
                        <p className="line-clamp-3">{comedian.comedianProfile?.bio}</p>
                     </div>
                     <div className="flex flex-wrap gap-2 pl-3 pt-2">
                        {comedian.comedianProfile?.status === 'pending' && (
                          <>
                            <button onClick={() => handleComedianStatusUpdate(comedian._id, 'approved')} className="px-4 py-2 bg-green-500 text-black font-headline-sm text-xs rounded-lg flex items-center justify-center active:scale-[0.98] transition-transform uppercase tracking-wider whitespace-nowrap">APPROVE</button>
                            <button onClick={() => handleComedianStatusUpdate(comedian._id, 'declined')} className="px-4 py-2 bg-transparent brutalist-border text-red-500 font-headline-sm text-xs rounded-lg flex items-center justify-center active:bg-[#201f1f] transition-colors uppercase tracking-wider whitespace-nowrap">DECLINE</button>
                          </>
                        )}
                        {comedian.comedianProfile?.status === 'approved' && (
                          <button 
                            onClick={() => handleComedianFeatureToggle(comedian._id, !!comedian.comedianProfile?.isFeatured)} 
                            className={`px-4 py-2 font-headline-sm text-xs rounded-lg flex items-center justify-center transition-colors uppercase tracking-wider whitespace-nowrap ${comedian.comedianProfile?.isFeatured ? 'bg-primary-container text-black' : 'bg-transparent brutalist-border text-primary-container'}`}
                          >
                            {comedian.comedianProfile?.isFeatured ? 'UNFEATURE' : 'FEATURE'}
                          </button>
                        )}
                        {comedian.comedianProfile?.videoUrl && (
                          <a href={comedian.comedianProfile.videoUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#201f1f] brutalist-border text-[#e5e2e1] font-headline-sm text-xs rounded-lg flex items-center justify-center transition-colors uppercase tracking-wider whitespace-nowrap">WATCH VIDEO</a>
                        )}
                        <button 
                           onClick={() => {
                             setComedianForm({
                               id: comedian._id,
                               username: comedian.username,
                               email: comedian.email,
                               phone: comedian.phone || '',
                               speciality: comedian.comedianProfile?.speciality || '',
                               tagline: comedian.comedianProfile?.tagline  || '',
                               instagramUrl: comedian.comedianProfile?.instagramUrl || '',
                               isFeatured: !!comedian.comedianProfile?.isFeatured,
                               imageFile: null
                             });
                             setShowAddComedianModal(true);
                           }} 
                           className="px-4 py-2 bg-transparent brutalist-border text-[#e5e2e1] font-headline-sm text-xs rounded-lg flex items-center justify-center transition-colors uppercase tracking-wider hover:bg-white/5 whitespace-nowrap"
                        >
                          EDIT
                        </button>
                     </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <section className="space-y-6 animate-enter">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-headline-md font-bold uppercase tracking-wide">Payments</h2>
                 <DownloadPaymentsButton payments={payments} className="!bg-[#201f1f] !text-[#e5e2e1] !text-xs !px-3 !py-1 !rounded brutalist-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#131313] p-4 rounded brutalist-border flex flex-col justify-between min-h-[100px]">
                    <span className="font-label-caps text-[10px] text-on-surface/50 tracking-widest uppercase">Total Processed</span>
                    <div className="flex items-end justify-between mt-2">
                      <span className="font-headline-md text-2xl font-bold leading-none text-primary-container">{formatCurrency(paymentStats.totalAmount / 100)}</span>
                    </div>
                  </div>
                  <div className="bg-[#131313] p-4 rounded brutalist-border flex flex-col justify-between min-h-[100px]">
                    <span className="font-label-caps text-[10px] text-on-surface/50 tracking-widest uppercase text-green-400">Successful</span>
                    <div className="flex items-end justify-between mt-2">
                      <span className="font-headline-md text-2xl font-bold leading-none">{paymentStats.successfulPayments}</span>
                    </div>
                  </div>
              </div>
              <div className="flex flex-col gap-4 mt-4">
                {payments.map((payment) => (
                  <article key={payment._id} className="bg-[#131313] brutalist-border rounded p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                       <div>
                          <div className="font-mono text-primary-container text-xs mb-1">{payment.bookingId || payment.orderId}</div>
                          <h2 className="font-headline-sm text-base leading-tight font-bold uppercase">{payment.bookingDetails?.fullName || 'Guest'}</h2>
                       </div>
                       <span className="font-headline-md font-bold">{formatCurrency(payment.amount / 100)}</span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-xs text-on-surface/50 font-mono">{payment.paymentId}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${payment.status === 'completed' ? 'bg-green-500/20 text-green-400' : payment.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                         {payment.status === 'completed' ? 'SUCCESS' : payment.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <section className="space-y-6 animate-enter">
              <h2 className="text-2xl font-headline-md font-bold mb-4 uppercase tracking-wide">Messages Inbox</h2>
              <div className="flex flex-col gap-4">
                {messages.length === 0 ? (
                  <div className="bg-[#131313] brutalist-border rounded p-8 text-center text-on-surface/50">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">inbox</span>
                    <p>No messages found.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <article key={msg._id} className={`bg-[#131313] brutalist-border rounded p-4 relative overflow-hidden flex flex-col gap-3 ${msg.status === 'unread' ? 'border-primary-container/30' : 'opacity-70'}`}>
                      {msg.status === 'unread' && <div className="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>}
                      <div className="flex justify-between items-start pl-3">
                        <div>
                          <h3 className="font-headline-sm text-lg font-bold">{msg.name}</h3>
                          <div className="text-xs text-on-surface/70 mt-1 flex gap-3">
                            <span><span className="material-symbols-outlined text-[14px] align-middle mr-1">chat</span>{msg.phone}</span>
                            <span>{new Date(msg.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <span className={`font-label-caps px-2 py-1 rounded text-[10px] brutalist-border ${msg.status === 'unread' ? 'bg-primary-container/10 text-primary-container border-primary-container/30' : 'bg-white/5 text-white/50 border-white/10'}`}>
                          {msg.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="pl-3 mt-2">
                        <div className="text-xs font-label-caps text-on-surface/40 mb-1 tracking-widest uppercase">Subject: {msg.subject}</div>
                        <p className="text-sm font-body bg-black/20 p-3 rounded">{msg.message}</p>
                      </div>
                      <div className="flex gap-2 pl-3 mt-2">
                        {msg.status === 'unread' ? (
                          <button onClick={() => handleMessageStatusUpdate(msg._id, 'read')} className="px-4 py-2 bg-primary-container text-black font-headline-sm text-xs rounded-lg active:scale-[0.98] transition-transform uppercase tracking-wider">Mark as Read</button>
                        ) : (
                          <button onClick={() => handleMessageStatusUpdate(msg._id, 'unread')} className="px-4 py-2 bg-[#201f1f] brutalist-border text-white font-headline-sm text-xs rounded-lg active:scale-[0.98] transition-transform uppercase tracking-wider">Mark as Unread</button>
                        )}
                        <button onClick={() => handleMessageDelete(msg._id)} className="px-4 py-2 bg-transparent brutalist-border text-red-500 font-headline-sm text-xs rounded-lg hover:bg-red-500/10 active:bg-red-500/20 transition-colors uppercase tracking-wider ml-auto">Delete</button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {/* CMS TAB */}
          {activeTab === 'cms' && (
            <section className="animate-enter">
              <SiteCMS 
                onNavigateToApps={() => setActiveTab('comedians')} 
                onNavigateToFeedbacks={() => setActiveTab('feedbacks')}
              />
            </section>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-20 bg-surface-container-low border-t border-[rgba(255,255,255,0.05)] z-50 px-2 flex justify-around items-center pb-safe">
        {navLinks.map((link) => {
          if (link.id === 'cms') {
            return (
              <div key={link.id} className="relative -top-5">
                <button 
                  onClick={() => setActiveTab('cms')}
                  className={`w-14 h-14 rounded-xl shadow-[0_8px_16px_rgba(255,107,26,0.3)] flex items-center justify-center hover:scale-95 active:scale-90 transition-transform ${
                    activeTab === 'cms' ? 'bg-primary-container text-on-primary-container' : 'bg-[#2a2a2a] text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[28px]" style={{fontVariationSettings: activeTab === 'cms' ? "'FILL' 1" : "'FILL' 0"}}>{link.icon}</span>
                </button>
              </div>
            );
          }
          return (
            <button 
              key={link.id}
              onClick={() => setActiveTab(link.id as any)}
              className={`flex flex-col items-center justify-center min-w-[52px] h-16 gap-1 transition-colors shrink-0 ${
                activeTab === link.id ? 'text-primary-container' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: activeTab === link.id ? "'FILL' 1" : "'FILL' 0"}}>{link.icon}</span>
              <span className="text-[10px] font-label-caps uppercase tracking-wider">{link.short}</span>
            </button>
          );
        })}
      </nav>

      {/* Complimentary Booking Modal */}
      {showCompModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm px-4">
          <div className="bg-[#131313] brutalist-border rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-headline-md font-bold text-[#e5e2e1] mb-2 uppercase tracking-wide">Complimentary Booking</h2>
            <p className="text-xs text-[#e5e2e1]/70 mb-6">Create a free booking for a guest.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-label-caps text-[#e5e2e1]/70 mb-1 uppercase">Full Name</label>
                <input
                  type="text"
                  value={compForm.fullName}
                  onChange={e => setCompForm(p => ({ ...p, fullName: e.target.value }))}
                  className="w-full bg-[#0e0e0e] px-4 py-3 brutalist-border rounded-lg focus:outline-none focus:border-primary-container text-sm transition-colors"
                  placeholder="Guest full name"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-label-caps text-[#e5e2e1]/70 mb-1 uppercase">Email</label>
                <input
                  type="email"
                  value={compForm.email}
                  onChange={e => setCompForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-[#0e0e0e] px-4 py-3 brutalist-border rounded-lg focus:outline-none focus:border-primary-container text-sm transition-colors"
                  placeholder="guest@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-label-caps text-[#e5e2e1]/70 mb-1 uppercase">Phone</label>
                <div className="flex items-stretch bg-[#0e0e0e] brutalist-border rounded-lg focus-within:border-primary-container transition-colors overflow-hidden">
                  <div className="flex items-center gap-2 pl-3 pr-2 border-r border-[rgba(255,255,255,0.05)] bg-white/[0.02] text-white/50 select-none">
                    <span className="material-symbols-outlined text-[16px]">phone</span>
                    <span className="font-label-caps text-xs pt-[1px]">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={compForm.phone}
                    onChange={e => setCompForm(p => ({ ...p, phone: e.target.value.replace(/^\+91/, '').replace(/[^0-9]/g, '').slice(0, 10) }))}
                    className="w-full bg-transparent px-3 py-3 focus:outline-none text-sm border-none placeholder-white/20 focus:ring-0"
                    placeholder="XXXXXXXXXX"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-label-caps text-[#e5e2e1]/70 mb-1 uppercase">Tickets</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={compForm.numberOfTickets}
                  onChange={e => setCompForm(p => ({ ...p, numberOfTickets: Number(e.target.value) }))}
                  className="w-full bg-[#0e0e0e] px-4 py-3 brutalist-border rounded-lg focus:outline-none focus:border-primary-container text-sm transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompModal(false)}
                className="flex-1 brutalist-border text-[#e5e2e1]/70 rounded-lg font-headline-sm text-sm h-12 hover:bg-white/5 transition-colors tracking-widest uppercase"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateCompBooking}
                className="flex-1 bg-primary-container text-[#0e0e0e] rounded-lg font-headline-sm text-sm h-12 hover:opacity-90 transition-opacity tracking-widest uppercase"
              >
                CREATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comedian Modal */}
      {showAddComedianModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm px-4 overflow-y-auto py-10">
          <div className="bg-[#131313] brutalist-border rounded-xl p-6 w-full max-w-md my-auto">
            <h2 className="text-xl font-headline-md font-bold text-[#e5e2e1] mb-2 uppercase tracking-wide">{comedianForm.id ? 'Edit Comedian' : 'Add Comedian'}</h2>
            <p className="text-xs text-[#e5e2e1]/70 mb-6">Manually {comedianForm.id ? 'edit' : 'create'} a comedian profile.</p>
            <form onSubmit={handleSaveComedian} className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-label-caps text-[#e5e2e1]/70 mb-1 uppercase">Full Name / Stage Name *</label>
                <input
                  type="text"
                  value={comedianForm.username}
                  onChange={e => setComedianForm(p => ({ ...p, username: e.target.value }))}
                  className="w-full bg-[#0e0e0e] px-4 py-3 brutalist-border rounded-lg focus:outline-none focus:border-primary-container text-sm transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-label-caps text-[#e5e2e1]/70 mb-1 uppercase">Email *</label>
                <input
                  type="email"
                  value={comedianForm.email}
                  onChange={e => setComedianForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-[#0e0e0e] px-4 py-3 brutalist-border rounded-lg focus:outline-none focus:border-primary-container text-sm transition-colors"
                  placeholder="comedian@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-label-caps text-[#e5e2e1]/70 mb-1 uppercase">Phone</label>
                <div className="flex items-stretch bg-[#0e0e0e] brutalist-border rounded-lg focus-within:border-primary-container transition-colors overflow-hidden">
                  <div className="flex items-center gap-2 pl-3 pr-2 border-r border-[rgba(255,255,255,0.05)] bg-white/[0.02] text-white/50 select-none">
                    <span className="material-symbols-outlined text-[16px]">phone</span>
                    <span className="font-label-caps text-xs pt-[1px]">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={comedianForm.phone}
                    onChange={e => setComedianForm(p => ({ ...p, phone: e.target.value.replace(/^\+91/, '').replace(/[^0-9]/g, '').slice(0, 10) }))}
                    className="w-full bg-transparent px-3 py-3 focus:outline-none text-sm border-none placeholder-white/20 focus:ring-0"
                    placeholder="XXXXXXXXXX"
                    maxLength={10}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-label-caps text-[#e5e2e1]/70 mb-1 uppercase">Speciality / Art Form *</label>
                <input
                  type="text"
                  value={comedianForm.speciality}
                  onChange={e => setComedianForm(p => ({ ...p, speciality: e.target.value }))}
                  className="w-full bg-[#0e0e0e] px-4 py-3 brutalist-border rounded-lg focus:outline-none focus:border-primary-container text-sm transition-colors"
                  placeholder="e.g. Stand-up, Improv"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-label-caps text-[#e5e2e1]/70 mb-1 uppercase">Tagline</label>
                <input
                  type="text"
                  value={comedianForm.tagline}
                  onChange={e => setComedianForm(p => ({ ...p, tagline: e.target.value }))}
                  className="w-full bg-[#0e0e0e] px-4 py-3 brutalist-border rounded-lg focus:outline-none focus:border-primary-container text-sm transition-colors"
                  placeholder="A quick funny quote..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-label-caps text-[#e5e2e1]/70 mb-1 uppercase">Instagram URL</label>
                <input
                  type="url"
                  value={comedianForm.instagramUrl}
                  onChange={e => setComedianForm(p => ({ ...p, instagramUrl: e.target.value }))}
                  className="w-full bg-[#0e0e0e] px-4 py-3 brutalist-border rounded-lg focus:outline-none focus:border-primary-container text-sm transition-colors"
                  placeholder="https://instagram.com/..."
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-label-caps text-[#e5e2e1]/70 mb-1 uppercase">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setComedianForm(p => ({ ...p, imageFile: e.target.files![0] }));
                    }
                  }}
                  className="w-full bg-[#0e0e0e] px-4 py-3 brutalist-border rounded-lg focus:outline-none focus:border-primary-container text-sm transition-colors text-[#e5e2e1]"
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={comedianForm.isFeatured}
                  onChange={e => setComedianForm(p => ({ ...p, isFeatured: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/20 bg-[#0e0e0e] text-primary-container focus:ring-primary-container focus:ring-offset-[#131313]"
                />
                <label htmlFor="isFeatured" className="text-sm text-[#e5e2e1]/90">
                  Feature on Homepage
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddComedianModal(false);
                    setComedianForm({ username: '', email: '', phone: '', speciality: '', tagline: '', instagramUrl: '', isFeatured: false, imageFile: null });
                  }}
                  className="flex-1 brutalist-border text-[#e5e2e1]/70 rounded-lg font-headline-sm text-sm h-12 hover:bg-white/5 transition-colors tracking-widest uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-container text-[#0e0e0e] rounded-lg font-headline-sm text-sm h-12 hover:opacity-90 transition-opacity tracking-widest uppercase"
                >
                  {comedianForm.id ? 'SAVE CHANGES' : 'ADD COMEDIAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

