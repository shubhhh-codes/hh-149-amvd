import React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type DlState = 'idle' | 'loading' | 'done' | 'error';

export default function BookingSuccess() {
  const router = useRouter();
  const { id: bookingId, token: downloadToken } = router.query;

  const [copied, setCopied]     = useState(false);
  const [dlState, setDlState]   = useState<DlState>('idle');
  const [dlError, setDlError]   = useState('');
  const autoTriggered           = useRef(false); // prevent double-trigger in StrictMode

  const handleCopy = () => {
    if (bookingId) {
      navigator.clipboard.writeText(bookingId as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Download — fetch() + blob() so we know if it actually worked ──────────
  const handleDownloadTicket = useCallback(async () => {
    if (!bookingId || dlState === 'loading') return;
    setDlState('loading');
    setDlError('');

    try {
      // Build URL — include the downloadToken issued by /api/payments/verify
      // (passed through the redirect URL from book-tickets.tsx).
      // The token proves the user just paid for this booking.
      const tokenParam = downloadToken
        ? `&token=${encodeURIComponent(downloadToken as string)}`
        : '';
      const res = await fetch(`/api/generate-ticket?bookingId=${encodeURIComponent(bookingId as string)}${tokenParam}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errData.message || `Error ${res.status}`);
      }

      const blob = await res.blob();

      if (!blob.type.includes('pdf') || blob.size < 500) {
        throw new Error('Invalid PDF received. Please try downloading again.');
      }

      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `HH-TICKET-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setDlState('done');

    } catch (err: any) {
      console.error('[booking-success] Download error:', err);
      setDlState('error');
      setDlError(err.message || 'Download failed. Please try again.');
    }
  }, [bookingId, dlState, downloadToken]);

  // Auto-download once after 2.5s — longer delay than before (was 1500ms)
  // to allow MongoDB write propagation after payment verification
  useEffect(() => {
    if (!bookingId || autoTriggered.current) return;
    autoTriggered.current = true;

    const t = setTimeout(() => {
      handleDownloadTicket();
    }, 2500);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]); // intentionally excludes handleDownloadTicket to prevent re-triggers

  const dlButtonLabel = () => {
    switch (dlState) {
      case 'loading': return <><span className="material-symbols-outlined animate-spin">sync</span> Generating Ticket...</>;
      case 'done':    return <><span className="material-symbols-outlined">check_circle</span> Downloaded!</>;
      case 'error':   return <><span className="material-symbols-outlined">refresh</span> Retry Download</>;
      default:        return <><span className="material-symbols-outlined">download</span> Download Ticket PDF</>;
    }
  };

  return (
    <div className="bg-background min-h-screen flex flex-col overflow-x-hidden text-on-surface">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-margin-mobile">
        <div className="w-full max-w-lg text-center space-y-8">

          {/* Success icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-green-500 text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
          </div>

          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface mb-2">Booking Confirmed!</h1>
            <p className="text-on-surface-variant font-body-md">
              Your tickets have been booked successfully.
            </p>
          </div>

          {/* Booking ID card */}
          <div className="bg-[#141414] border border-white/10 rounded-xl p-8 space-y-4">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">
              Your Booking ID
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-headline-md text-2xl text-primary-container font-bold tracking-wider">
                {bookingId || '...'}
              </span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                title="Copy Booking ID"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
            <p className="text-on-surface-variant/60 text-sm">
              Save this ID — you'll need it to retrieve your ticket later
            </p>
          </div>

          {/* Download section */}
          <div className="space-y-3">

            {/* Status message while loading */}
            {dlState === 'loading' && (
              <p className="text-on-surface-variant/60 text-sm animate-pulse">
                Preparing your PDF ticket — this takes a few seconds…
              </p>
            )}

            {/* Error message */}
            {dlState === 'error' && dlError && (
              <div className="bg-[#93000a] text-[#ffdad6] p-3 rounded-md border border-[#ffb4ab] text-sm text-left">
                {dlError}
              </div>
            )}

            <button
              onClick={handleDownloadTicket}
              disabled={dlState === 'loading'}
              className="w-full bg-primary-container text-on-primary-fixed py-4 px-6 rounded-lg font-headline-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
            >
              {dlButtonLabel()}
            </button>

            <p className="text-on-surface-variant/60 text-sm mt-4">
              Lost your ticket? Use your <strong>Email</strong> and <strong>Phone</strong> to retrieve it anytime on the{' '}
              <Link href="/retrieve-tickets" className="text-primary-container underline">
                Retrieve My Ticket
              </Link>{' '}
              page.
            </p>

            <div className="flex gap-3 pt-2">
              <Link
                href="/retrieve-tickets"
                className="flex-1 border border-white/10 text-on-surface-variant py-3 px-6 rounded-lg font-label-caps text-center hover:bg-white/5 transition-colors"
              >
                My Tickets
              </Link>
              <Link
                href="/"
                className="flex-1 border border-white/10 text-on-surface-variant py-3 px-6 rounded-lg font-label-caps text-center hover:bg-white/5 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
