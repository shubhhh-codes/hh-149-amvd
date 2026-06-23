import React from 'react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface BookingItem {
  bookingId: string;
  fullName: string;
  numberOfTickets: number;
  status: string;
  bookingType: string;
  createdAt: string;
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

    try {
      const res = await fetch('/api/bookings/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email || undefined, 
          phone: phone || undefined, 
          bookingId: searchMode === 'bookingId' ? bookingId : undefined 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setActiveBookings(data.activeBookings || []);
      setCancelledBookings(data.cancelledBookings || []);
      setSearched(true);
    } catch (err) {
      console.error('Retrieve error:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (bId: string) => {
    window.open(`/api/generate-ticket?bookingId=${bId}`, '_blank');
  };

  return (
    <div className="bg-background min-h-screen flex flex-col overflow-x-hidden text-on-surface">
      <Navbar />

      <main className="flex-grow py-16 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-2xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-headline-md text-headline-md text-on-surface">Retrieve Your Tickets</h1>
            <p className="text-on-surface-variant font-body-md">Enter your booking details to retrieve your tickets.</p>
          </div>

          {/* Search Form */}
          <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden">
            
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                type="button"
                onClick={() => { setSearchMode('emailPhone'); setError(''); setSearched(false); }}
                className={`flex-1 py-4 font-label-caps text-sm tracking-widest uppercase transition-colors ${
                  searchMode === 'emailPhone' 
                    ? 'bg-primary-container/10 text-primary-container border-b-2 border-primary-container' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                Email & Phone
              </button>
              <button
                type="button"
                onClick={() => { setSearchMode('bookingId'); setError(''); setSearched(false); }}
                className={`flex-1 py-4 font-label-caps text-sm tracking-widest uppercase transition-colors ${
                  searchMode === 'bookingId' 
                    ? 'bg-primary-container/10 text-primary-container border-b-2 border-primary-container' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                Booking ID
              </button>
            </div>

            <form onSubmit={handleSearch} className="p-8 space-y-6">
              
              {searchMode === 'bookingId' && (
                <div className="space-y-2 pb-4 border-b border-white/5">
                  <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="bookingId">Booking ID</label>
                  <input
                    type="text"
                    id="bookingId"
                    value={bookingId}
                    onChange={e => setBookingId(e.target.value.toUpperCase())}
                    placeholder="e.g. HH-2026-000012"
                    required={searchMode === 'bookingId'}
                    className="w-full bg-[#080808] border border-white/10 text-on-surface px-4 py-3 rounded-lg focus:border-primary-container transition-colors font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container uppercase"
                  />
                  <p className="text-xs text-on-surface-variant/60 pt-1">
                    Please provide your Booking ID along with either your email or phone number.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="email">
                  Email Address {searchMode === 'bookingId' && <span className="text-on-surface-variant/50 lowercase normal-case ml-1">(Optional if phone is provided)</span>}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required={searchMode === 'emailPhone' || (searchMode === 'bookingId' && !phone)}
                  className="w-full bg-[#080808] border border-white/10 text-on-surface px-4 py-3 rounded-lg focus:border-primary-container transition-colors font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="phone">
                  Phone Number {searchMode === 'bookingId' && <span className="text-on-surface-variant/50 lowercase normal-case ml-1">(Optional if email is provided)</span>}
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  required={searchMode === 'emailPhone' || (searchMode === 'bookingId' && !email)}
                  className="w-full bg-[#080808] border border-white/10 text-on-surface px-4 py-3 rounded-lg focus:border-primary-container transition-colors font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>

              {error && (
                <div className="bg-error-container text-on-error-container p-3 rounded-md border border-error text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-container text-on-primary-fixed py-4 px-6 rounded-lg font-headline-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Searching...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">search</span>
                    Find My Tickets
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {searched && (
            <div className="space-y-8">
              {/* Active Bookings */}
              {activeBookings.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="font-headline-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                    Active Bookings ({activeBookings.length})
                  </h2>
                  {activeBookings.map((booking) => (
                    <div key={booking.bookingId} className="bg-[#141414] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-headline-sm text-primary-container">{booking.bookingId}</p>
                        <p className="text-on-surface font-bold">{booking.fullName}</p>
                        <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                          <span>{booking.numberOfTickets} ticket{booking.numberOfTickets > 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{new Date(booking.createdAt).toLocaleDateString('en-IN')}</span>
                          {booking.bookingType === 'complimentary' && (
                            <>
                              <span>•</span>
                              <span className="text-yellow-400 text-xs uppercase font-bold">Complimentary</span>
                            </>
                          )}
                        </div>
                        <span className={`inline-block mt-1 text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          booking.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDownload(booking.bookingId)}
                        className="bg-primary-container/10 border border-primary-container/20 text-primary-container px-4 py-2 rounded-lg font-label-caps text-sm hover:bg-primary-container hover:text-on-primary-fixed transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                  <p className="font-body-md">No active bookings found for this email and phone combination.</p>
                </div>
              )}

              {/* Cancelled Bookings */}
              {cancelledBookings.length > 0 && (
                <div className="space-y-4">
                  <h2 className="font-headline-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-400" style={{fontVariationSettings: "'FILL' 1"}}>cancel</span>
                    Cancelled Bookings ({cancelledBookings.length})
                  </h2>
                  {cancelledBookings.map((booking) => (
                    <div key={booking.bookingId} className="bg-[#141414] border border-white/5 rounded-xl p-6 opacity-60">
                      <div className="space-y-1">
                        <p className="font-headline-sm text-on-surface-variant">{booking.bookingId}</p>
                        <p className="text-on-surface-variant">{booking.fullName}</p>
                        <div className="flex items-center gap-3 text-sm text-on-surface-variant/60">
                          <span>{booking.numberOfTickets} ticket{booking.numberOfTickets > 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{new Date(booking.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <span className="inline-block mt-1 text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                          Cancelled
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
