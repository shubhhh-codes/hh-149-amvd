import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import clientPromise from '@/lib/mongodb';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
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

    const tiersData = settings ? JSON.parse(JSON.stringify(settings)) : { tiers: [] as typeof DEFAULT_TIERS };

    if (!tiersData.tiers || tiersData.tiers.length === 0) {
      tiersData.tiers = DEFAULT_TIERS;
    }

    return {
      props: {
        tiersData,
      },
    };
  } catch (error) {
    console.error('Failed to fetch tiers data for booking page', error);
    return {
      props: {
        tiersData: { tiers: DEFAULT_TIERS },
      },
    };
  }
}

export default function BookTickets({ tiersData }: { tiersData: any }) {
  const router = useRouter();

  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setName] = useState('');
  const [customerEmail, setEmail] = useState('');
  const [customerPhone, setPhone] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [mode, setMode] = useState<'loading' | 'active' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);

  const mountTime = useRef(Date.now());
  const hasBooked = useRef(false);
  const customerNameRef = useRef('');
  const customerEmailRef = useRef('');
  const customerPhoneRef = useRef('');

  useEffect(() => {
    customerNameRef.current = customerName;
  }, [customerName]);

  useEffect(() => {
    customerEmailRef.current = customerEmail;
  }, [customerEmail]);

  useEffect(() => {
    customerPhoneRef.current = customerPhone;
  }, [customerPhone]);

  useEffect(() => {
    mountTime.current = Date.now();

    const handleBeforeUnload = () => {
      if (!hasBooked.current) {
        const timeSpent = Math.floor((Date.now() - mountTime.current) / 1000);
        const data = JSON.stringify({
          event: 'abandonment',
          actionDetails: 'User left checkout page without completing booking.',
          timeSpentOnPage: timeSpent,
          userDetails: {
            name: customerNameRef.current,
            email: customerEmailRef.current,
            phone: customerPhoneRef.current,
          },
        });

        navigator.sendBeacon('/api/analytics/track', new Blob([data], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (tiersData?.tiers && tiersData.tiers.length > 0) {
      const defaultTier = tiersData.tiers.find((tier: any) => tier.badge === 'MOST POPULAR') || tiersData.tiers[0];
      setCart({ [defaultTier.key]: 1 });
    }
    setMode('active');
  }, [tiersData]);

  const tiers = tiersData?.tiers ?? [];

  const totalAmount = tiers.reduce((acc: number, tier: TicketTier) => {
    return acc + tier.price * (cart[tier.key] || 0);
  }, 0);

  const totalSeats = tiers.reduce((acc: number, tier: TicketTier) => {
    return acc + tier.seats * (cart[tier.key] || 0);
  }, 0);

  const totalTickets = tiers.reduce((acc: number, tier: TicketTier) => {
    return acc + (cart[tier.key] || 0);
  }, 0);

  const venueDisplay = tiersData?.venue || 'The Humours Hub, Ahmedabad';
  const cmsDate = tiersData?.date || 'Saturday';
  const cmsTime = tiersData?.time || '8:30 PM';
  const dateDisplay = `${cmsDate}, ${cmsTime}`;

  const handleAction = async (event?: React.FormEvent) => {
    event?.preventDefault();

    const cartArray = Object.entries(cart)
      .filter(([_, quantity]) => quantity > 0)
      .map(([tierKey, units]) => {
        const tier = tiers.find((item: any) => item.key === tierKey);
        return { tierKey, units, price: tier?.price || 0, seats: tier?.seats || 1 };
      });

    if (cartArray.length === 0) {
      setError('Please select at least one ticket.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerName.trim() || !emailRegex.test(customerEmail.trim()) || customerPhone.trim().length !== 10) {
      setError('Please provide a valid name, email, and 10-digit phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'click',
        actionDetails: `User clicked 'Pay & Book Ticket' for ₹${totalAmount}`,
      }),
    }).catch(() => {});

    try {
      const bookRes = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim(),
          numberOfTickets: totalSeats,
          cart: cartArray,
        }),
      });

      const bookData = await bookRes.json();
      if (!bookRes.ok) {
        throw new Error(bookData.message ?? 'Booking failed');
      }

      const { bookingId } = bookData;

      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numberOfTickets: totalSeats, bookingId, cart: cartArray }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message ?? 'Failed to initiate payment');
      }

      const razorpayReady = await new Promise<boolean>((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        let attempts = 0;
        const interval = setInterval(() => {
          attempts += 1;
          if (window.Razorpay) {
            clearInterval(interval);
            resolve(true);
          } else if (attempts >= 50) {
            clearInterval(interval);
            resolve(false);
          }
        }, 100);
      });

      if (!razorpayReady) {
        throw new Error('Payment SDK failed to load. Please refresh and try again.');
      }

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
        theme: { color: '#141414' },
        modal: {
          ondismiss: () => {
            fetch('/api/payments/log-dismiss', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookingId }),
            }).catch(() => {});

            setLoading(false);
          },
        },
        handler: async (response: Record<string, string>) => {
          try {
            hasBooked.current = true;
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
            if (!verifyRes.ok) {
              throw new Error(verifyData.message ?? 'Verification failed');
            }

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
            type="button"
            onClick={() => window.location.reload()}
            className="bg-[#FF6B1A] text-[#0A0A0A] font-bold px-6 py-3 rounded-full text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased min-h-screen flex flex-col bg-[#0A0A0A] font-['DM_Sans',sans-serif] text-white">
      <Head>
        <title>The Humours Hub</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, interactive-widget=overlays-content" />
      </Head>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <style>{`
        body {
          background-color: #0a0a0a;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
        }
      `}</style>

      <Navbar />

      <main
        className="flex-1 pb-24 md:pb-12"
        onClick={() => {
          if (showSummaryDetails) {
            setShowSummaryDetails(false);
          }
        }}
        onTouchMove={() => {
          if (showSummaryDetails) {
            setShowSummaryDetails(false);
          }
        }}
        onWheel={() => {
          if (showSummaryDetails) {
            setShowSummaryDetails(false);
          }
        }}
      >
        <div className="md:max-w-5xl lg:max-w-6xl md:mx-auto md:px-6 md:py-10 md:grid md:grid-cols-12 md:gap-8 lg:gap-12 md:items-start">
          <div className="max-w-md mx-auto px-4 pt-4 md:max-w-none md:p-0 md:col-span-7 lg:col-span-8">
            <header className="text-center md:text-left mb-6">
              <h1 className="font-['Hind',sans-serif] text-2xl md:text-4xl font-bold text-white mb-4 md:mb-8 leading-tight">Secure Your Spot</h1>

              <div className="flex flex-col gap-2 mb-6 text-sm font-['DM_Sans',sans-serif] md:hidden">
                <div className="flex items-center justify-center gap-2 bg-[#141414] rounded-md py-2 border border-white/5">
                  <span className="material-symbols-outlined text-[#FF6B1A] text-sm">location_on</span>
                  <span className="font-bold text-[#a3a3a3]">{venueDisplay}</span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-[#141414] rounded-md py-2 border border-white/5">
                  <span className="material-symbols-outlined text-[#FF6B1A] text-sm">calendar_today</span>
                  <span className="font-bold text-[#a3a3a3]">{dateDisplay}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8 md:mt-0 px-1 md:px-0">
                {tiers.map((tier: TicketTier) => {
                  const quantity = cart[tier.key] || 0;
                  const isActive = quantity > 0;

                  return (
                    <div
                      key={tier.key}
                      className={`bg-[#141414] rounded-xl p-3 md:p-4 transition-all flex flex-col items-center justify-between relative ${
                        isActive
                          ? 'border-[#FF6B1A] border shadow-[0_0_15px_rgba(255,107,26,0.2)] bg-[rgba(255,107,26,0.08)] scale-[1.02] z-10'
                          : 'border-white/10 border'
                      } h-[140px] md:h-44`}
                    >
                      {tier.badge && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#FF6B1A] px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold text-white shadow-lg uppercase whitespace-nowrap z-20">
                          {tier.badge}
                        </div>
                      )}

                      <div className="flex flex-col items-center w-full flex-1 pt-1">
                        <div className="h-8 md:h-10 flex items-end justify-center w-full mb-1 md:mb-2">
                          <span className={`font-['Hind',sans-serif] text-[10px] md:text-sm font-bold tracking-wider uppercase text-center leading-tight line-clamp-2 ${isActive ? 'text-[#FF6B1A]' : 'text-[#a3a3a3]'}`}>
                            {tier.label}
                          </span>
                        </div>
                        <div className="flex-1 flex items-start justify-center">
                          <h3 className="font-['Hind',sans-serif] text-xl md:text-3xl font-black text-white leading-none tracking-tight">
                            ₹{tier.price}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-[#080808] border border-white/10 rounded-md w-full overflow-hidden mt-1 h-8 md:h-10 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCart((previousState) => ({ ...previousState, [tier.key]: Math.max(0, (previousState[tier.key] || 0) - 1) }))}
                          disabled={quantity === 0}
                          aria-label={`Decrease ${tier.name} quantity`}
                          className="w-1/3 h-full flex items-center justify-center hover:bg-[#FF6B1A]/20 transition-all text-[#FF6B1A] disabled:text-[#a3a3a3] disabled:hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-[16px] md:text-[18px]">remove</span>
                        </button>
                        <span className="font-['Hind',sans-serif] text-[13px] md:text-base font-bold text-white w-1/3 text-center">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setCart((previousState) => ({ ...previousState, [tier.key]: Math.min(10, (previousState[tier.key] || 0) + 1) }))}
                          disabled={quantity >= 10}
                          aria-label={`Increase ${tier.name} quantity`}
                          className="w-1/3 h-full flex items-center justify-center hover:bg-[#FF6B1A]/20 transition-all text-[#FF6B1A] disabled:text-[#a3a3a3] disabled:hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-[16px] md:text-[18px]">add</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </header>

            <div className="block">
              <div className="bg-[#141414] border border-white/10 rounded-xl p-4 md:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B1A]/5 blur-[50px] rounded-full pointer-events-none"></div>

                <h3 className="font-['Hind',sans-serif] text-base md:text-xl font-bold mb-4 md:mb-6 text-white uppercase tracking-wide">Guest Details</h3>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm font-bold" role="alert" aria-live="polite">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 md:gap-5 relative z-10">
                  <input
                    aria-label="Full Name"
                    autoComplete="name"
                    name="fullName"
                    className="w-full bg-[#080808] border border-white/10 rounded-md md:rounded-lg py-2 md:py-3 px-3 md:px-4 text-white focus:border-[#FF6B1A] outline-none text-sm md:text-base font-['DM_Sans',sans-serif] transition-colors"
                    placeholder="Full Name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    aria-label="Email Address"
                    autoComplete="email"
                    name="email"
                    className="w-full bg-[#080808] border border-white/10 rounded-md md:rounded-lg py-2 md:py-3 px-3 md:px-4 text-white focus:border-[#FF6B1A] outline-none text-sm md:text-base font-['DM_Sans',sans-serif] transition-colors"
                    placeholder="Email Address"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="flex items-stretch bg-[#080808] border border-white/10 rounded-md md:rounded-lg focus-within:border-[#FF6B1A] focus-within:shadow-[0_0_0_1px_#FF6B1A] transition-all duration-300 overflow-hidden">
                    <div className="flex items-center gap-2 pl-4 pr-3 border-r border-white/5 bg-white/[0.02] text-[#a3a3a3] select-none">
                      <span className="material-symbols-outlined text-[20px]">phone</span>
                      <span className="font-['DM_Sans',sans-serif] font-bold text-white/40 pt-[1px]">+91</span>
                    </div>
                    <input
                      aria-label="Phone Number"
                      autoComplete="tel"
                      inputMode="numeric"
                      name="phone"
                      pattern="[0-9]{10}"
                      className="w-full bg-transparent border-none py-2 md:py-3 pl-3 pr-4 font-['DM_Sans',sans-serif] text-sm md:text-base text-white placeholder-white/20 focus:outline-none focus:ring-0"
                      placeholder="XXXXXXXXXX"
                      type="tel"
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="hidden md:block md:col-span-5 lg:col-span-4 md:sticky md:top-24 bg-[#141414] border border-white/10 rounded-xl p-8 shadow-2xl">
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

            <h3 className="font-['Hind',sans-serif] text-xl font-bold mb-6 text-white uppercase tracking-wide">Order Summary</h3>
            <div className="flex flex-col gap-4 mb-8">
              {tiers.filter((tier: TicketTier) => cart[tier.key] > 0).map((tier: TicketTier) => (
                <div key={tier.key} className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-['Hind',sans-serif] text-xs font-bold tracking-wider text-[#a3a3a3] uppercase mb-1">{tier.name}</span>
                    <span className="text-xs text-[#a3a3a3]">₹{tier.price} × {cart[tier.key]}</span>
                  </div>
                  <span className="font-['Hind',sans-serif] text-lg font-bold text-white">₹{tier.price * cart[tier.key]}</span>
                </div>
              ))}
              {totalTickets === 0 && (
                <div className="text-sm text-[#a3a3a3] italic">No tickets selected</div>
              )}
            </div>

            <div className="flex justify-between items-end mb-8 pt-8 border-t border-white/10">
              <span className="font-['Hind',sans-serif] text-xs font-bold tracking-wider text-[#a3a3a3] uppercase">Total Amount</span>
              <div className="text-right">
                <div className="font-['Hind',sans-serif] text-4xl font-bold text-[#FF6B1A] leading-none">₹{totalAmount}</div>
                <div className="text-xs text-[#a3a3a3] mt-2">{totalTickets} tickets total</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAction}
              disabled={isLoading || totalTickets === 0}
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

      <div className="fixed bottom-0 w-full bg-[#111] border-t border-white/10 px-4 py-3 pb-safe z-50 md:hidden">
        <div className="max-w-md mx-auto">
          {showSummaryDetails && (
            <div id="mobile-order-summary" className="mb-4 px-4 py-3 bg-[#141414] rounded-xl border border-white/10 text-xs text-[#a3a3a3] flex flex-col gap-2.5 shadow-2xl">
              {tiers.filter((tier: TicketTier) => cart[tier.key] > 0).map((tier: TicketTier) => (
                <div key={tier.key} className="flex justify-between items-center">
                  <span>{tier.name} <span className="text-white/50">× {cart[tier.key]}</span></span>
                  <span className="text-white font-bold">₹{tier.price * cart[tier.key]}</span>
                </div>
              ))}
              {totalTickets === 0 && (
                <div className="text-center italic opacity-50 py-2">Cart is empty</div>
              )}
              <div className="flex justify-between items-center mt-1 pt-2.5 border-t border-white/10">
                <span>Total Amount</span>
                <span className="text-[#FF6B1A] font-bold text-sm">₹{totalAmount}</span>
              </div>
            </div>
          )}

          <div className="mb-3 px-1">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 flex flex-col items-center justify-center min-w-[64px]">
                  <span className="font-['Hind',sans-serif] text-[9px] font-bold tracking-wider text-[#a3a3a3] uppercase mb-1">Tickets</span>
                  <span className="font-['Hind',sans-serif] text-xl font-bold text-white leading-none">{totalTickets}</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1.5">
                <span className="font-['Hind',sans-serif] text-[10px] font-bold tracking-wider text-[#a3a3a3] uppercase block">Total Amount</span>
                <div className="font-['Hind',sans-serif] text-xl font-bold text-[#FF6B1A] leading-none">₹{totalAmount}</div>
                <button
                  type="button"
                  onClick={() => setShowSummaryDetails(!showSummaryDetails)}
                  aria-expanded={showSummaryDetails}
                  aria-controls="mobile-order-summary"
                  className="text-[10px] text-[#a3a3a3] hover:text-white transition-colors flex items-center gap-0.5"
                >
                  View Details <span className="material-symbols-outlined text-[12px]">{showSummaryDetails ? 'arrow_drop_up' : 'arrow_drop_down'}</span>
                </button>
              </div>
            </div>
            <div className="mt-2 border-t border-white/5"></div>
          </div>

          <button
            type="button"
            onClick={handleAction}
            disabled={isLoading || totalTickets === 0}
            className="w-full bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white font-['Hind',sans-serif] font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wide"
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