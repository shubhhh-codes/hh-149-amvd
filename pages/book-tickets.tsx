import React from 'react';
/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function BookTickets() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'phone' ? value.replace(/^\+91/, '').replace(/[^0-9]/g, '').slice(0, 10) : value
    }));
  };

  const initializeRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
      } else {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      }
    });
  };

  const handlePayment = async (bookingId: string) => {
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numberOfTickets,
          bookingId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Humors Hub',
        description: `${numberOfTickets} Show Ticket${numberOfTickets > 1 ? 's' : ''} @ ₹149 each`,
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message);

            // Pass the signed download token through the URL so booking-success
            // can call generate-ticket in production without needing retrieve auth
            const dlToken = verifyData.downloadToken ? `&token=${encodeURIComponent(verifyData.downloadToken)}` : '';
            router.push(`/booking-success?id=${bookingId}${dlToken}`);
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#7C3AED',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to initiate payment. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate fields
    if (!formData.fullName || !formData.email || !formData.phone) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    // Initialize Razorpay
    const isRazorpayReady = await initializeRazorpay();
    if (!isRazorpayReady) {
      setError('Payment gateway is not ready. Please refresh the page and try again.');
      setIsLoading(false);
      return;
    }

    try {
      // Create guest booking
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          numberOfTickets,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data.capacityWarning) {
        // Show warning but allow booking to proceed
        console.warn('Capacity warning: venue may be near/at capacity');
      }

      // Proceed to payment with the generated bookingId
      await handlePayment(data.bookingId);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-body-md antialiased overflow-hidden flex flex-col">
      <Head>
        <title>The Humours Hub</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-margin-mobile md:py-16 relative overflow-hidden">
        {/* Spotlight Glow Effect */}
        <div className="absolute inset-0 spotlight-glow pointer-events-none"></div>
        <div className="w-full max-w-2xl z-10">
          
          {error && (
            <div className="mb-4 bg-error-container text-on-error-container p-4 rounded-md border border-error">
              {error}
            </div>
          )}

          {/* Main Booking Card */}
          <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-2xl transition-all duration-500">
            <div className="p-8 md:p-12">
              {/* Header Section */}
              <div className="flex items-center space-x-4 mb-10">
                <div className="bg-primary-container/10 border border-primary-container/20 rounded-full p-4 flex items-center justify-center transition-transform duration-300">
                  <span className="material-symbols-outlined text-primary-container text-3xl">
                    confirmation_number
                  </span>
                </div>
                <div>
                  <h1 className="font-headline-md text-headline-md text-on-surface leading-none">
                    Book Show Tickets
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                    Secure your spot for an unforgettable night! 🎭
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Guest Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="fullName">Full Name</label>
                    <input 
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name" 
                      required 
                      className="w-full bg-[#080808] border border-white/10 text-on-surface px-4 py-3 rounded-lg focus:border-primary-container transition-colors font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="phone">Phone Number</label>
                    <div className="flex items-stretch bg-[#080808] border border-white/10 rounded-lg focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container transition-all duration-300 overflow-hidden">
                      <div className="flex items-center gap-2 pl-4 pr-3 border-r border-white/5 bg-white/[0.02] text-on-surface-variant select-none">
                        <span className="material-symbols-outlined text-[20px]">phone</span>
                        <span className="font-body-md font-bold text-white/40 pt-[1px]">+91</span>
                      </div>
                      <input 
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="XXXXXXXXXX" 
                        maxLength={10}
                        required 
                        className="w-full bg-transparent border-none text-on-surface px-3 py-3 placeholder-white/20 font-body-md focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="email">Email Address</label>
                  <input 
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com" 
                    required 
                    className="w-full bg-[#080808] border border-white/10 text-on-surface px-4 py-3 rounded-lg focus:border-primary-container transition-colors font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container"
                  />
                </div>

                {/* Ticket Quantity */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-6 border-y border-white/5">
                  <div className="space-y-4">
                    <label className="block font-label-caps text-label-caps text-on-surface-variant">Number of Tickets</label>
                    <div className="flex items-center space-x-6">
                      <button 
                        type="button"
                        onClick={() => setNumberOfTickets(prev => Math.max(1, prev - 1))}
                        className="w-12 h-12 flex items-center justify-center rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-90"
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <span className="font-headline-sm text-headline-sm text-on-surface w-8 text-center">{numberOfTickets}</span>
                      <button 
                        type="button"
                        onClick={() => setNumberOfTickets(prev => Math.min(10, prev + 1))}
                        className="w-12 h-12 flex items-center justify-center rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-90"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                    <p className="font-body-md text-sm text-on-surface-variant/60">Maximum 10 tickets per booking</p>
                  </div>
                  <div className="text-right">
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Total Amount</label>
                    <div className="font-headline-md text-headline-md text-primary-container">₹{149 * numberOfTickets}</div>
                    <p className="font-body-md text-sm text-on-surface-variant/60">₹149 per ticket</p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-container text-on-primary-fixed py-5 px-8 rounded-lg font-headline-sm text-headline-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay & Book Tickets</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Footer Highlight */}
            <div className="bg-surface-container-high/30 p-4 border-t border-white/5 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">verified</span>
              <span className="text-xs font-label-caps text-on-surface-variant uppercase tracking-widest">Official Humours Hub Booking Portal • No Account Required</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
