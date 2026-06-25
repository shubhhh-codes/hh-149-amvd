import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
// Define the Razorpay interface extending Window
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void; };
  }
}

interface TicketTier {
  key: string;
  name: string;
  label: string;
  price: number;
  seats: number;
  badge: string | null;
}

import clientPromise from '@/lib/mongodb';

const DEFAULT_TIERS = [
  { key: 'solo', name: 'Solo Pass', label: 'SOLO', price: 499, seats: 1, badge: null, displayOrder: 1 },
  { key: 'duo', name: 'Duo Pass', label: 'DUO', price: 899, seats: 2, badge: 'MOST POPULAR', displayOrder: 2 },
  { key: 'squad', name: 'Squad Pass', label: 'SQUAD', price: 1599, seats: 4, badge: null, displayOrder: 3 },
];

export async function getServerSideProps() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const settings = await db.collection('settings').findOne({ type: 'ticket-tiers' });
    
    // We must stringify and parse the object to safely pass it as JSON props (removes ObjectIds etc)
    let tiersData = settings ? JSON.parse(JSON.stringify(settings)) : { tiers: [] };

    // Fallback if DB is empty
    if (!tiersData.tiers || tiersData.tiers.length === 0) {
      tiersData.tiers = DEFAULT_TIERS;
    }

    return {
      props: {
        tiersData,
      }
    };
  } catch (error) {
    console.error('Failed to fetch tiers data for booking page', error);
    return {
      props: {
        tiersData: { tiers: DEFAULT_TIERS },
      }
    };
  }
}

export default function BookTickets({ tiersData }: { tiersData: any }) {
  const router = useRouter();

  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [units, setUnits] = useState(1);
  const [customerName, setName] = useState('');
  const [customerEmail, setEmail] = useState('');
  const [customerPhone, setPhone] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [mode, setMode] = useState<'loading' | 'active' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);

  useEffect(() => {
    if (tiersData?.tiers && tiersData.tiers.length > 0) {
      const defaultTier = tiersData.tiers.find((t: any) => t.badge === 'MOST POPULAR') || tiersData.tiers[0];
      setSelectedTier(defaultTier);
    }
    setMode('active');
  }, [tiersData]);

  const totalAmount = selectedTier ? selectedTier.price * units : 0;
  const totalSeats = selectedTier ? selectedTier.seats * units : 1;
  const venueDisplay = tiersData?.venue || 'The Humours Hub, Ahmedabad';
  const dateDisplay = tiersData?.date || 'Saturday, 8:30 PM';

  const handleAction = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedTier || units < 1) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerName.trim() || !emailRegex.test(customerEmail.trim()) || customerPhone.trim().length !== 10) {
      setError('Please provide a valid name, email, and 10-digit phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create local booking via our API (using tierKey and units)
      const bookRes = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim(),
          numberOfTickets: totalSeats,
          tierKey: selectedTier.key,
          units: units,
        }),
      });

      const bookData = await bookRes.json();
      if (!bookRes.ok) throw new Error(bookData.message ?? 'Booking failed');
      const { bookingId } = bookData;

      // 2. Create Razorpay order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numberOfTickets: totalSeats, bookingId, tierKey: selectedTier.key, units }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message ?? 'Failed to initiate payment');

      // 3. Open Razorpay checkout
      if (!window.Razorpay) throw new Error('Razorpay SDK not loaded');

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'The Humours Hub',
        description: 'Comedy Show Tickets',
        order_id: orderData.orderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: `91${customerPhone}`,
        },
        theme: { color: '#FF6B1A' },
        handler: async (response: Record<string, string>) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message ?? 'Verification failed');

            const dlToken = verifyData.downloadToken ? `&token=${encodeURIComponent(verifyData.downloadToken)}` : '';
            router.push(`/booking-success?id=${bookingId}${dlToken}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed');
            setLoading(false);
          }
        },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  if (mode === 'loading') {
    return (
      <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#FF6B1A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (mode === 'error') {
    return (
      <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-[#FF6B1A] text-5xl block mb-4">error</span>
          <h1 className="text-white text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-white/50 mb-6">Could not load booking details. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#FF6B1A] text-[#0A0A0A] font-bold px-6 py-3 rounded-full text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tiers = tiersData?.tiers ?? [];

  return (
    <div className="antialiased min-h-screen flex flex-col bg-[#0A0A0A] font-['DM_Sans',sans-serif] text-white">
      <Head>
        <title>Book Tickets - Conversion Optimized - The Humours Hub</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Hind:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </Head>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <style>{`
        body {
            background-color: #0A0A0A;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
        }
      `}</style>

      {/* TopNavBar */}
      <Navbar />

      <main className="flex-1 pb-24 md:pb-12">
        <div className="md:max-w-5xl lg:max-w-6xl md:mx-auto md:px-6 md:py-10 md:grid md:grid-cols-12 md:gap-8 lg:gap-12 md:items-start">
          <div className="max-w-md mx-auto px-4 pt-4 md:max-w-none md:p-0 md:col-span-7 lg:col-span-8">
            
            {/* Header & Info */}
            <header className="text-center md:text-left mb-6">
              <h1 className="font-['Hind',sans-serif] text-2xl md:text-4xl font-bold text-white mb-2 md:mb-8 leading-tight">Secure Your Spot</h1>
              
              <div className="grid grid-cols-3 gap-3 md:gap-6 items-end mb-8 mt-6 md:mt-0 px-1 md:px-0">
                {tiers.map((tier: TicketTier) => {
                  const isActive = selectedTier?.key === tier.key;
                  return (
                    <div
                      key={tier.key}
                      onClick={() => {
                        setSelectedTier(tier);
                        setUnits(1);
                      }}
                      className={`cursor-pointer bg-[#141414] rounded-lg p-3 md:p-5 text-center transition-all flex flex-col justify-center relative 
                        ${isActive ? 'border-[#FF6B1A] border-2 shadow-[0_0_15px_rgba(255,107,26,0.4)] bg-[rgba(255,107,26,0.05)] scale-[1.05] z-10' : 'border-white/10 border scale-100'} 
                        ${isActive ? 'h-28 md:h-36' : 'h-24 md:h-32'}`}
                    >
                      {tier.badge && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#FF6B1A] px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold text-white whitespace-nowrap shadow-md uppercase">
                          {tier.badge}
                        </div>
                      )}
                      <span className={`font-['Hind',sans-serif] text-[9px] md:text-[11px] font-bold tracking-wider uppercase block mb-1 md:mb-2 ${isActive ? 'text-[#FF6B1A]' : 'text-[#a3a3a3]'}`}>
                        {tier.label}
                      </span>
                      <h3 className="font-['Hind',sans-serif] text-lg md:text-3xl font-bold text-white">
                        ₹{tier.price}
                      </h3>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 mt-4 text-sm font-['DM_Sans',sans-serif] md:hidden">
                <div className="flex items-center justify-center gap-2 bg-[#141414] rounded-md py-2 border border-white/5">
                  <span className="material-symbols-outlined text-[#FF6B1A] text-sm">location_on</span>
                  <span className="font-bold text-[#a3a3a3]">{venueDisplay}</span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-[#141414] rounded-md py-2 border border-white/5">
                  <span className="material-symbols-outlined text-[#FF6B1A] text-sm">calendar_today</span>
                  <span className="font-bold text-[#a3a3a3]">{dateDisplay}</span>
                </div>
              </div>
            </header>

            {/* View 2: Form & Summary */}
            <div className="block">
              {/* Accordion Summary */}
              <div className="mb-4 bg-[#141414] border border-white/10 rounded-lg overflow-hidden md:hidden">
                <button 
                  className="w-full px-4 py-3 flex justify-between items-center text-sm font-bold bg-[#111]" 
                  onClick={() => setShowSummaryDetails(!showSummaryDetails)}
                >
                  <span>Total: <span className="text-[#FF6B1A]">₹{totalAmount}</span></span>
                  <span className="text-xs text-[#a3a3a3] flex items-center gap-1">
                    View Details <span className="material-symbols-outlined text-[14px]">
                      {showSummaryDetails ? 'arrow_drop_up' : 'arrow_drop_down'}
                    </span>
                  </span>
                </button>
                {showSummaryDetails && (
                  <div className="px-4 py-3 bg-[#141414] border-t border-white/5 text-xs text-[#a3a3a3] flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span>Pass Type</span>
                      <span className="text-white font-bold">{selectedTier?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity</span>
                      <span className="text-white font-bold">{units}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Compact Form */}
              <div className="bg-[#141414] border border-white/10 rounded-xl p-4 md:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B1A]/5 blur-[50px] rounded-full pointer-events-none"></div>
                
                <h3 className="font-['Hind',sans-serif] text-base md:text-xl font-bold mb-4 md:mb-6 text-white uppercase tracking-wide">Guest Details</h3>
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm font-bold">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 md:gap-5 relative z-10">
                  <input 
                    aria-label="Full Name"
                    className="w-full bg-[#080808] border border-white/10 rounded-md md:rounded-lg py-2 md:py-3 px-3 md:px-4 text-white focus:border-[#FF6B1A] outline-none text-sm md:text-base font-['DM_Sans',sans-serif] transition-colors" 
                    placeholder="Full Name" 
                    type="text" 
                    value={customerName}
                    onChange={e => setName(e.target.value)}
                  />
                  <input 
                    aria-label="Email Address"
                    className="w-full bg-[#080808] border border-white/10 rounded-md md:rounded-lg py-2 md:py-3 px-3 md:px-4 text-white focus:border-[#FF6B1A] outline-none text-sm md:text-base font-['DM_Sans',sans-serif] transition-colors" 
                    placeholder="Email Address" 
                    type="email" 
                    value={customerEmail}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <div className="flex gap-2 md:gap-4">
                    <div className="bg-[#080808] border border-white/10 rounded-md md:rounded-lg py-2 md:py-3 px-2 md:px-4 text-[#a3a3a3] text-sm md:text-base shrink-0 flex items-center select-none">+91</div>
                    <input 
                      aria-label="Phone Number"
                      className="w-full bg-[#080808] border border-white/10 rounded-md md:rounded-lg py-2 md:py-3 px-3 md:px-4 text-white focus:border-[#FF6B1A] outline-none text-sm md:text-base font-['DM_Sans',sans-serif] transition-colors" 
                      placeholder="Phone Number" 
                      type="tel"
                      maxLength={10}
                      value={customerPhone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Right Sidebar */}
          <aside className="hidden md:block md:col-span-5 lg:col-span-4 md:sticky md:top-24 bg-[#141414] border border-white/10 rounded-xl p-8 shadow-2xl">
            {/* Desktop Venue & Date */}
            <div className="flex flex-col gap-6 mb-8 pb-8 border-b border-white/10">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-[#FF6B1A] text-2xl">location_on</span>
                <div className="flex flex-col">
                  <span className="text-xs text-[#a3a3a3] font-bold uppercase tracking-wider mb-1">Venue</span>
                  <span className="font-bold text-lg text-white font-['Hind',sans-serif]">{venueDisplay}</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-[#FF6B1A] text-2xl">calendar_today</span>
                <div className="flex flex-col">
                  <span className="text-xs text-[#a3a3a3] font-bold uppercase tracking-wider mb-1">Date & Time</span>
                  <span className="font-bold text-lg text-white font-['Hind',sans-serif]">{dateDisplay}</span>
                </div>
              </div>
            </div>

            {/* Desktop Summary */}
            <h3 className="font-['Hind',sans-serif] text-xl font-bold mb-6 text-white uppercase tracking-wide">Order Summary</h3>
            <div className="flex justify-between items-center mb-8">
              <div className="flex flex-col">
                <span className="font-['Hind',sans-serif] text-xs font-bold tracking-wider text-[#a3a3a3] uppercase mb-1">Pass Type</span>
                <span className="font-['Hind',sans-serif] text-xl font-bold text-white uppercase">{selectedTier?.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setUnits(u => Math.max(1, u - 1))} disabled={units <= 1} className="w-10 h-10 rounded bg-[#080808] border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-white disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <span className="font-['Hind',sans-serif] text-xl font-bold w-6 text-center text-white">{units}</span>
                <button onClick={() => setUnits(u => Math.min(10, u + 1))} disabled={units >= 10} className="w-10 h-10 rounded bg-[#080808] border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-white disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8 pt-8 border-t border-white/10">
              <span className="font-['Hind',sans-serif] text-xs font-bold tracking-wider text-[#a3a3a3] uppercase">Total Amount</span>
              <div className="text-right">
                <div className="font-['Hind',sans-serif] text-4xl font-bold text-[#FF6B1A] leading-none">₹{totalAmount}</div>
                <div className="text-xs text-[#a3a3a3] mt-2">₹{selectedTier?.price} per ticket</div>
              </div>
            </div>

            <button 
              onClick={handleAction}
              disabled={isLoading || !selectedTier}
              className="w-full bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white font-['Hind',sans-serif] font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all text-lg disabled:opacity-50 uppercase tracking-wide"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">lock</span> 
                  <span>PAY ₹{totalAmount} SECURELY</span>
                </>
              )}
            </button>
          </aside>
        </div>
      </main>

      {/* Sticky Checkout Bar (Mobile) */}
      <div className="fixed bottom-0 w-full bg-[#111] border-t border-white/10 p-4 pb-safe z-50 md:hidden">
        <div className="max-w-md mx-auto">
          <div className="mb-4 px-1">
            <div className="flex justify-between items-end mb-4">
              <div className="flex flex-col gap-3">
                <span className="font-['Hind',sans-serif] text-[10px] font-bold tracking-wider text-[#FF6B1A] uppercase">Number of Tickets</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setUnits(u => Math.max(1, u - 1))} disabled={units <= 1} className="w-10 h-10 rounded bg-[#141414] border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all disabled:opacity-50 text-white">
                    <span className="material-symbols-outlined text-[#a3a3a3]">remove</span>
                  </button>
                  <span className="font-['Hind',sans-serif] text-lg font-bold w-4 text-center text-white">{units}</span>
                  <button onClick={() => setUnits(u => Math.min(10, u + 1))} disabled={units >= 10} className="w-10 h-10 rounded bg-[#141414] border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all disabled:opacity-50 text-white">
                    <span className="material-symbols-outlined text-[#a3a3a3]">add</span>
                  </button>
                </div>
              </div>
              <div className="text-right">
                <span className="font-['Hind',sans-serif] text-[10px] font-bold tracking-wider text-[#a3a3a3] uppercase block mb-1">Total Amount</span>
                <div className="font-['Hind',sans-serif] text-2xl font-bold text-[#FF6B1A] leading-none">₹{totalAmount}</div>
                <div className="text-[10px] text-[#a3a3a3] mt-1">₹{selectedTier?.price} per ticket</div>
              </div>
            </div>
            <div className="text-[10px] text-[#a3a3a3]">Maximum 10 tickets per booking</div>
            <div className="mt-4 border-t border-white/5"></div>
          </div>
          
          <button 
            onClick={handleAction}
            disabled={isLoading || !selectedTier}
            className="w-full bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white font-['Hind',sans-serif] font-bold py-3.5 rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wide"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">lock</span> PAY ₹{totalAmount} SECURELY
              </span>
            )}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
