import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface BookingItem {
  bookingId: string;
  fullName: string;
  numberOfTickets: number;
  status: string;
  bookingType: string;
  createdAt: string;
  downloadToken: string;
}

export default function RetrieveTickets() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [activeBookings, setActiveBookings] = useState<BookingItem[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<BookingItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchMode, setSearchMode] = useState<'emailPhone' | 'bookingId'>('emailPhone');
  const [bookingId, setBookingId] = useState('');

  // Download state per booking: 'idle' | 'loading' | 'done' | 'error'
  const [downloadStates, setDownloadStates] = useState<Record<string, 'idle' | 'loading' | 'done' | 'error'>>({});

  // Kinetic spotlight
  useEffect(() => {
    const updateSpotlight = (e: MouseEvent) => {
      const spotlight = document.getElementById('cursor-spotlight');
      if (spotlight) {
        spotlight.style.setProperty('--x', `${e.clientX}px`);
        spotlight.style.setProperty('--y', `${e.clientY}px`);
      }
    };
    window.addEventListener('mousemove', updateSpotlight);
    return () => window.removeEventListener('mousemove', updateSpotlight);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (searchMode === 'emailPhone') {
      if (!email || !phone) {
        setError('Both Email and Phone are required.');
        return;
      }
    } else {
      if (!bookingId || (!email && !phone)) {
        setError('Booking ID and at least one contact method (Email or Phone) are required.');
        return;
      }
    }

    setIsLoading(true);
    setSearched(false);
    setDownloadStates({});

    try {
      const res = await fetch('/api/bookings/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
          bookingId: searchMode === 'bookingId' ? bookingId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setActiveBookings(data.activeBookings || []);
      setCancelledBookings(data.cancelledBookings || []);
      setSearched(true);

      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err) {
      console.error('[retrieve] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve tickets');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Download handler — fetch() + blob() so we detect real errors ───────────
  const handleDownload = async (booking: BookingItem) => {
    const bId = booking.bookingId;

    setDownloadStates(prev => ({ ...prev, [bId]: 'loading' }));
    setError('');

    try {
      const url = `/api/generate-ticket?bookingId=${encodeURIComponent(bId)}&token=${encodeURIComponent(booking.downloadToken)}`;
      const res = await fetch(url);

      if (!res.ok) {
        // Parse server error message and surface it to the user
        const errData = await res.json().catch(() => ({ message: 'Server error. Please try again.' }));
        throw new Error(errData.message || `Error ${res.status}`);
      }

      const blob = await res.blob();

      // Sanity check — confirm we actually received a PDF and not JSON/HTML
      if (!blob.type.includes('pdf') || blob.size < 500) {
        throw new Error('Received an invalid file. Please try again.');
      }

      // Trigger download
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `HH-TICKET-${bId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl); // free memory

      setDownloadStates(prev => ({ ...prev, [bId]: 'done' }));

      // Reset to idle after 4s
      setTimeout(() => {
        setDownloadStates(prev => ({ ...prev, [bId]: 'idle' }));
      }, 4000);

    } catch (err: any) {
      console.error('[download] Error:', err);
      setDownloadStates(prev => ({ ...prev, [bId]: 'error' }));
      setError(err.message || 'Download failed. Please try again.');

      // Reset to idle after 5s
      setTimeout(() => {
        setDownloadStates(prev => ({ ...prev, [bId]: 'idle' }));
      }, 5000);
    }
  };

  const getDlButtonContent = (bId: string) => {
    const state = downloadStates[bId] || 'idle';
    switch (state) {
      case 'loading':
        return (
          <>
            <div className="loader !border-white !border-t-transparent w-4 h-4" />
            <span>Generating...</span>
          </>
        );
      case 'done':
        return (
          <>
            <span className="material-symbols-outlined text-[18px]">check</span>
            <span>DONE</span>
          </>
        );
      case 'error':
        return (
          <>
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>FAILED</span>
          </>
        );
      default:
        return (
          <>
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Download</span>
          </>
        );
    }
  };

  const getDlButtonClass = (bId: string) => {
    const state = downloadStates[bId] || 'idle';
    const base = 'w-full flex items-center justify-center gap-2 font-label-caps tracking-widest text-[13px] font-bold py-3 rounded-DEFAULT transition-all duration-300 uppercase ';
    switch (state) {
      case 'loading': return base + 'bg-transparent border border-white/20 text-white cursor-wait';
      case 'done': return base + 'bg-[#FF6B1A] text-black border-[#FF6B1A]';
      case 'error': return base + 'bg-red-900/40 text-red-300 border border-red-700';
      default: return base + 'bg-transparent border border-white/20 text-white hover:bg-[#FF6B1A] hover:text-black hover:border-[#FF6B1A]';
    }
  };

  return (
    <div className="bg-[#0A0A0A] min-h-screen flex flex-col font-body-md text-on-surface antialiased overflow-x-hidden relative">
      <style dangerouslySetInnerHTML={{
        __html: `
        #cursor-spotlight {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 0;
            background: radial-gradient(circle 800px at var(--x, 50%) var(--y, 50%), rgba(255, 107, 26, 0.05) 0%, transparent 80%);
            transition: background 0.1s ease;
        }
        .glass-card {
            background: rgba(20, 20, 20, 0.4);
            backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 107, 26, 0.3);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
            animation: pulse-border 4s infinite alternate;
        }
        @keyframes pulse-border {
            0%   { border-color: rgba(255, 107, 26, 0.2); }
            100% { border-color: rgba(255, 107, 26, 0.5); }
        }
        .ticket-notch {
            mask-image: radial-gradient(circle at 0% 50%, transparent 12px, black 13px), radial-gradient(circle at 100% 50%, transparent 12px, black 13px);
            mask-composite: intersect;
            -webkit-mask-image: radial-gradient(circle at 0% 50%, transparent 12px, black 13px), radial-gradient(circle at 100% 50%, transparent 12px, black 13px);
            -webkit-mask-composite: source-in;
            background-color: #141414;
        }
        .ticket-dashed-line { border-left: 2px dashed rgba(255,255,255,0.1); }
        .premium-input { background: #080808; border: 1px solid rgba(255,255,255,0.1); color: white; transition: all 0.3s ease; }
        .premium-input:focus { border-color: #FF6B1A; box-shadow: 0 0 0 1px #FF6B1A; outline: none; }
        .loader { border: 3px solid rgba(255,107,26,0.2); border-top-color: #FF6B1A; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tabs-container { position: relative; background: rgba(255,255,255,0.05); border-radius: 100px; padding: 4px; display: flex; }
        .tab-btn { flex: 1; text-align: center; padding: 12px 0; position: relative; z-index: 2; transition: color 0.3s ease; cursor: pointer; }
        .tab-pill { position: absolute; top: 4px; left: 4px; height: calc(100% - 8px); width: calc(50% - 4px); background: #FF6B1A; border-radius: 100px; z-index: 1; transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .tab-contact-active .tab-pill { transform: translateX(0); }
        .tab-booking-active .tab-pill { transform: translateX(100%); }
        .reveal-item { opacity: 0; transform: translateY(20px) scale(0.95); animation: revealAnim 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes revealAnim { to { opacity: 1; transform: translateY(0) scale(1); } }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
      `}} />

      <Navbar />
      <div id="cursor-spotlight" />

      <main className="flex-grow flex flex-col items-center justify-center py-24 px-margin-mobile md:px-margin-desktop relative z-10 w-full max-w-container-max mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg mb-4 text-white uppercase font-bold tracking-widest text-[40px] md:text-[64px] leading-[1.1]">
            FIND YOUR <span className="text-[#FF6B1A]">TICKETS</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto text-[18px]">
            Enter your details below to retrieve your bookings. Show time is almost here.
          </p>
        </div>

        {/* Search Card */}
        <div className="glass-card w-full max-w-2xl rounded-2xl p-8 mb-16 relative overflow-hidden">

          {/* Sliding Tabs */}
          <div className={`tabs-container mb-8 ${searchMode === 'emailPhone' ? 'tab-contact-active' : 'tab-booking-active'}`}>
            <div className="tab-pill" />
            <div
              className={`tab-btn font-label-caps text-label-caps tracking-widest text-[14px] uppercase ${searchMode === 'emailPhone' ? 'text-[#0A0A0A] font-bold' : 'text-on-surface-variant'}`}
              onClick={() => { setSearchMode('emailPhone'); setError(''); setSearched(false); }}
            >
              EMAIL &amp; PHONE
            </div>
            <div
              className={`tab-btn font-label-caps text-label-caps tracking-widest text-[14px] uppercase ${searchMode === 'bookingId' ? 'text-[#0A0A0A] font-bold' : 'text-on-surface-variant'}`}
              onClick={() => { setSearchMode('bookingId'); setError(''); setSearched(false); }}
            >
              BOOKING ID
            </div>
          </div>

          {/* Forms */}
          {searchMode === 'emailPhone' ? (
            <form onSubmit={handleSearch} className="space-y-6" id="form-contact">
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps tracking-widest text-[14px] font-bold text-on-surface-variant uppercase">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
                  <input
                    className="premium-input w-full rounded-DEFAULT py-3 pl-12 pr-4 font-body-md text-body-md"
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps tracking-widest text-[14px] font-bold text-on-surface-variant uppercase">Phone Number</label>
                <div className="flex items-stretch bg-[#080808] border border-white/10 rounded-DEFAULT focus-within:border-[#FF6B1A] focus-within:shadow-[0_0_0_1px_#FF6B1A] transition-all duration-300 overflow-hidden">
                  <div className="flex items-center gap-2 pl-4 pr-3 border-r border-white/5 bg-white/[0.02] text-on-surface-variant select-none">
                    <span className="material-symbols-outlined text-[20px]">phone</span>
                    <span className="font-body-md font-bold text-white/40 pt-[1px]">+91</span>
                  </div>
                  <input
                    className="w-full bg-transparent border-none py-3 pl-3 pr-4 font-body-md text-white placeholder-white/20 focus:outline-none focus:ring-0"
                    placeholder="XXXXXXXXXX"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/^\+91/, '').replace(/[^0-9]/g, '').slice(0, 10))}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-[#93000a] text-[#ffdad6] p-3 rounded-md border border-[#ffb4ab] text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FF6B1A] text-[#0A0A0A] font-label-caps text-label-caps tracking-widest text-[14px] font-bold py-4 rounded-DEFAULT hover:bg-[#ff8540] transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
              >
                {isLoading ? <div className="loader w-5 h-5" /> : <><span>SEARCH TICKETS</span><span className="material-symbols-outlined">search</span></>}
              </button>
            </form>

          ) : (
            <form onSubmit={handleSearch} className="space-y-6" id="form-booking">
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps tracking-widest text-[14px] font-bold text-on-surface-variant uppercase">Booking ID</label>
                <div className="flex items-stretch bg-[#080808] border border-white/10 rounded-DEFAULT focus-within:border-[#FF6B1A] focus-within:shadow-[0_0_0_1px_#FF6B1A] transition-all duration-300 overflow-hidden">
                  <div className="flex items-center gap-2 pl-4 pr-3 border-r border-white/5 bg-white/[0.02] text-on-surface-variant select-none">
                    <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
                    <span className="font-body-md font-bold text-white/40 pt-[1px]">#</span>
                  </div>
                  <input
                    className="w-full bg-transparent border-none py-3 pl-3 pr-4 font-body-md text-white placeholder-white/20 focus:outline-none uppercase focus:ring-0"
                    placeholder="E.G. HH-2026-000013"
                    type="text"
                    value={bookingId}
                    onChange={e => setBookingId(e.target.value.replace(/#/g, '').toUpperCase())}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 pb-4 border-b border-white/5 mb-4">
                <p className="text-xs text-on-surface-variant/60 font-body-md">
                  Please provide your Booking ID along with either your email or phone number.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-label-caps tracking-widest text-[14px] font-bold text-on-surface-variant uppercase">
                  Email Address <span className="text-on-surface-variant/50 lowercase normal-case ml-1">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
                  <input
                    className="premium-input w-full rounded-DEFAULT py-3 pl-12 pr-4 font-body-md text-body-md"
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required={!phone}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps tracking-widest text-[14px] font-bold text-on-surface-variant uppercase">
                  Phone Number <span className="text-on-surface-variant/50 lowercase normal-case ml-1">(Optional)</span>
                </label>
                <div className="flex items-stretch bg-[#080808] border border-white/10 rounded-DEFAULT focus-within:border-[#FF6B1A] focus-within:shadow-[0_0_0_1px_#FF6B1A] transition-all duration-300 overflow-hidden">
                  <div className="flex items-center gap-2 pl-4 pr-3 border-r border-white/5 bg-white/[0.02] text-on-surface-variant select-none">
                    <span className="material-symbols-outlined text-[20px]">phone</span>
                    <span className="font-body-md font-bold text-white/40 pt-[1px]">+91</span>
                  </div>
                  <input
                    className="w-full bg-transparent border-none py-3 pl-3 pr-4 font-body-md text-white placeholder-white/20 focus:outline-none focus:ring-0"
                    placeholder="XXXXXXXXXX"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/^\+91/, '').replace(/[^0-9]/g, '').slice(0, 10))}
                    maxLength={10}
                    required={!email}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-[#93000a] text-[#ffdad6] p-3 rounded-md border border-[#ffb4ab] text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FF6B1A] text-[#0A0A0A] font-label-caps text-label-caps tracking-widest text-[14px] font-bold py-4 rounded-DEFAULT hover:bg-[#ff8540] transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
              >
                {isLoading ? <div className="loader w-5 h-5" /> : <><span>SEARCH TICKETS</span><span className="material-symbols-outlined">search</span></>}
              </button>
            </form>
          )}
        </div>

        {/* Results */}
        {searched && (
          <div className="w-full max-w-4xl flex flex-col gap-8" id="results-section">



            {/* Active Bookings */}
            {activeBookings.length > 0 ? (
              <>
                <h2 className="font-headline-md text-[32px] font-bold text-white border-b border-white/10 pb-4 uppercase reveal-item delay-1">
                  ACTIVE BOOKINGS
                </h2>
                {activeBookings.map(booking => (
                  <div
                    key={booking.bookingId}
                    className="ticket-notch flex flex-col md:flex-row w-full border border-white/10 rounded-xl overflow-hidden hover:border-[#FF6B1A]/50 transition-colors reveal-item delay-2"
                  >
                    {/* Left — details */}
                    <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          <span className="bg-[#FF6B1A]/10 text-[#FF6B1A] font-label-caps tracking-widest text-[12px] font-bold px-3 py-1 rounded-full">CONFIRMED</span>
                          <span className="text-on-surface-variant font-label-caps tracking-widest text-xs">ID: {booking.bookingId}</span>
                          {booking.bookingType === 'complimentary' && (
                            <span className="text-yellow-400 font-label-caps tracking-widest text-xs uppercase font-bold">COMPLIMENTARY</span>
                          )}
                        </div>
                        <h3 className="font-headline-sm text-[24px] font-bold text-white mb-2 uppercase">{booking.fullName}</h3>
                        <p className="font-body-md text-[16px] text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                          {new Date(booking.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="mt-6 flex gap-6">
                        <div>
                          <p className="text-xs font-label-caps tracking-widest text-on-surface-variant mb-1 font-bold">TICKETS</p>
                          <p className="font-headline-sm text-white uppercase text-[24px] font-bold">
                            {booking.numberOfTickets} <span className="text-sm font-body-md text-on-surface-variant normal-case font-normal">× General</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-label-caps tracking-widest text-on-surface-variant mb-1 font-bold">STATUS</p>
                          <p className="font-headline-sm text-white uppercase text-[24px] font-bold">PAID</p>
                        </div>
                      </div>
                    </div>

                    {/* Right — download */}
                    <div className="ticket-dashed-line p-6 md:p-8 md:w-64 flex flex-col items-center justify-center gap-4 bg-white/5">
                      <button
                        className={getDlButtonClass(booking.bookingId)}
                        onClick={() => handleDownload(booking)}
                        disabled={downloadStates[booking.bookingId] === 'loading'}
                      >
                        {getDlButtonContent(booking.bookingId)}
                      </button>
                      {downloadStates[booking.bookingId] === 'error' && (
                        <p className="text-xs text-red-400 text-center">Check above for details</p>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <h2 className="font-headline-md text-[32px] font-bold text-white border-b border-white/10 pb-4 uppercase reveal-item delay-1">ACTIVE BOOKINGS</h2>
                <div className="text-center py-12 text-on-surface-variant reveal-item delay-2">
                  <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                  <p className="font-body-md text-[16px]">No active bookings found for this search.</p>
                </div>
              </>
            )}

            {/* Cancelled Bookings */}
            {cancelledBookings.length > 0 && (
              <>
                <h2 className="font-headline-md text-[32px] font-bold text-on-surface-variant border-b border-white/10 pb-4 mt-8 uppercase reveal-item delay-3">
                  PAST &amp; CANCELLED
                </h2>
                {cancelledBookings.map(booking => (
                  <div key={booking.bookingId} className="ticket-notch flex flex-col md:flex-row w-full border border-white/5 rounded-xl overflow-hidden opacity-50 grayscale reveal-item delay-3">
                    <div className="p-6 md:p-8 flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-white/10 text-white font-label-caps tracking-widest text-[12px] font-bold px-3 py-1 rounded-full">CANCELLED</span>
                        <span className="text-on-surface-variant font-label-caps tracking-widest text-xs">ID: {booking.bookingId}</span>
                      </div>
                      <h3 className="font-headline-sm text-[24px] font-bold text-white mb-2 uppercase">{booking.fullName}</h3>
                      <p className="font-body-md text-[16px] text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        {new Date(booking.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
