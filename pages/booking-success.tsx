import React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function BookingSuccess() {
  const router = useRouter();
  const { id: bookingId } = router.query;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (bookingId) {
      navigator.clipboard.writeText(bookingId as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTicket = () => {
    if (!bookingId) return;
    window.open(`/api/generate-ticket?bookingId=${bookingId}`, '_blank');
  };

  // Auto-download ticket on mount
  useEffect(() => {
    if (bookingId) {
      const timer = setTimeout(() => {
        handleDownloadTicket();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [bookingId]);

  return (
    <div className="bg-background min-h-screen flex flex-col overflow-x-hidden text-on-surface">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-margin-mobile">
        <div className="w-full max-w-lg text-center space-y-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center animate-bounce-once">
              <span className="material-symbols-outlined text-green-500 text-5xl" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
            </div>
          </div>

          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface mb-2">Booking Confirmed!</h1>
            <p className="text-on-surface-variant font-body-md">Your tickets have been booked successfully.</p>
          </div>

          {/* Booking ID Card */}
          <div className="bg-[#141414] border border-white/10 rounded-xl p-8 space-y-4">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Your Booking ID</p>
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
            <p className="text-on-surface-variant/60 text-sm">Save this ID for your records</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadTicket}
              className="w-full bg-primary-container text-on-primary-fixed py-4 px-6 rounded-lg font-headline-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">download</span>
              Download Ticket PDF
            </button>

            <p className="text-on-surface-variant/60 text-sm mt-4">
              Lost your ticket? Use your <strong>Email</strong> and <strong>Phone</strong> to retrieve it anytime.
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
