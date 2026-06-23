import React from 'react';
/**
 * @copyright (c) 2024 - Present
 * @author ...
 * @license MIT
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

type ComedianType = 'standup' | 'musical' | 'other';

export default function BookTickets() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingType, setBookingType] = useState<'show' | 'joinAsComedian'>('show');
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: session?.user?.email || '',
    phone: '',
    // Comedian registration fields
    comedianType: '' as ComedianType,
    bio: '',
    speciality: '',
    experience: '',
    socialLinks: '',
  });

  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const initializeRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) {
        console.log('Razorpay SDK already loaded');
        resolve(true);
      } else {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          console.log('Razorpay SDK loaded successfully');
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay SDK');
          resolve(false);
        };
        document.body.appendChild(script);
      }
    });
  };

  const handlePayment = async (bookingId: string, amount: number) => {
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numberOfTickets,
          amount: 149 * numberOfTickets,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Humors Hub',
        description: `${numberOfTickets} Show Ticket${numberOfTickets > 1 ? 's' : ''} @ 149 each`,
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

            setSuccess('Payment successful! Your booking is confirmed.');
            router.push('/dashboard');
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: formData.fullName,
          email: session?.user?.email,
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
    setSuccess('');
    setIsLoading(true);

    if (!session?.user?.email) {
      setError('Please sign in first');
      setIsLoading(false);
      return;
    }

    // Check Razorpay initialization first for show bookings
    if (bookingType === 'show') {
      const isRazorpayReady = await initializeRazorpay();
      if (!isRazorpayReady) {
        setError('Payment gateway is not ready. Please refresh the page and try again.');
        setIsLoading(false);
        return;
      }
    }

    try {
      if (bookingType === 'show') {
        const res = await fetch('/api/bookings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: session.user.email,
            phone: formData.phone,
            numberOfTickets,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        await handlePayment(data.bookingId, numberOfTickets * 149); // 149 per ticket
      } else {
        // Comedian registration logic
        const res = await fetch('/api/comedians/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.fullName,
            email: session.user.email,
            phone: formData.phone,
            isComedian: true,
            comedianProfile: {
              comedianType: formData.comedianType,
              bio: formData.bio,
              speciality: formData.speciality,
              experience: formData.experience,
              status: 'pending'
            }
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Something went wrong');
        }

        setSuccess('Your comedian application has been submitted successfully! We will review it shortly.');
      }

      // Reset form
      setFormData(prev => ({
        ...prev,
        fullName: '',
        phone: '',
        comedianType: '' as ComedianType,
        bio: '',
        speciality: '',
        experience: '',
        socialLinks: '',
      }));
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex flex-col overflow-x-hidden text-on-surface">
      {/* TopNavBar */}
      <header className="bg-background border-b border-white/10 w-full z-50 sticky top-0">
        <nav className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-6 w-full max-w-container-max mx-auto">
          <div className="font-headline-sm text-headline-sm font-bold text-primary tracking-tighter">
            Humours Hub
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a className="font-label-caps text-label-caps text-on-surface hover:text-primary transition-colors" href="/dashboard">Shows</a>
            <a className="font-label-caps text-label-caps text-on-surface hover:text-primary transition-colors" href="#">Gallery</a>
            <a className="font-label-caps text-label-caps text-on-surface hover:text-primary transition-colors" href="#">About</a>
            <a className="font-label-caps text-label-caps text-on-surface hover:text-primary transition-colors" href="/book-tickets">Perform With Us</a>
          </div>
          <a className="bg-primary-container text-on-primary-fixed font-label-caps text-label-caps px-6 py-3 rounded-lg active:scale-95 transition-all text-primary border-b-2 border-primary pb-1" href="/book-tickets">
            Book Tickets
          </a>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center py-16 px-margin-mobile md:py-16 relative overflow-hidden">
        {/* Spotlight Glow Effect */}
        <div className="absolute inset-0 spotlight-glow pointer-events-none"></div>
        <div className="w-full max-w-2xl z-10">
          
          {error && (
            <div className="mb-4 bg-error-container text-on-error-container p-4 rounded-md border border-error">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-900/40 text-green-200 p-4 rounded-md border border-green-500/50">
              {success}
            </div>
          )}

          {/* Main Booking Card */}
          <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-2xl transition-all duration-500">
            <div className="p-8 md:p-12">
              {/* Header Section */}
              <div className="flex items-center space-x-4 mb-10">
                <div className="bg-primary-container/10 border border-primary-container/20 rounded-full p-4 flex items-center justify-center transition-transform duration-300">
                  <span className="material-symbols-outlined text-primary-container text-3xl">
                    {bookingType === 'show' ? 'confirmation_number' : 'mic_external_on'}
                  </span>
                </div>
                <div>
                  <h1 className="font-headline-md text-headline-md text-on-surface leading-none">
                    {bookingType === 'show' ? 'Book Show Tickets' : 'Join as Comedian'}
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                    {bookingType === 'show' 
                      ? 'Secure your spot for an unforgettable night! ðŸŽ­' 
                      : 'Share your talent with our audience! ðŸŒŸ'}
                  </p>
                </div>
              </div>

              {/* Toggle Selector */}
              <div className="mb-10">
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-4">What would you like to do?</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    type="button"
                    onClick={() => setBookingType('show')}
                    className={`flex-1 py-4 px-6 rounded-lg font-label-caps text-label-caps transition-all ${
                      bookingType === 'show' 
                        ? 'bg-primary-container text-on-primary-fixed border border-primary-container' 
                        : 'bg-transparent text-on-surface border border-white/20 hover:border-primary-container hover:text-primary-container'
                    }`}
                  >
                    Book Show Tickets
                  </button>
                  <button 
                    type="button"
                    onClick={() => setBookingType('joinAsComedian')}
                    className={`flex-1 py-4 px-6 rounded-lg font-label-caps text-label-caps transition-all ${
                      bookingType === 'joinAsComedian' 
                        ? 'bg-primary-container text-on-primary-fixed border border-primary-container' 
                        : 'bg-transparent text-on-surface border border-white/20 hover:border-primary-container hover:text-primary-container'
                    }`}
                  >
                    Join as Comedian
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Common Fields */}
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
                    <input 
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 XXXXX XXXXX" 
                      required 
                      className="w-full bg-[#080808] border border-white/10 text-on-surface px-4 py-3 rounded-lg focus:border-primary-container transition-colors font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container"
                    />
                  </div>
                </div>

                {/* Conditional Content */}
                {bookingType === 'show' ? (
                  <div className="space-y-8 block">
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
                            onClick={() => setNumberOfTickets(prev => Math.min(5, prev + 1))}
                            className="w-12 h-12 flex items-center justify-center rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-90"
                          >
                            <span className="material-symbols-outlined">add</span>
                          </button>
                        </div>
                        <p className="font-body-md text-sm text-on-surface-variant/60">Maximum 5 tickets per booking</p>
                      </div>
                      <div className="text-right">
                        <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Total Amount</label>
                        <div className="font-headline-md text-headline-md text-primary-container">â‚¹{149 * numberOfTickets}</div>
                        <p className="font-body-md text-sm text-on-surface-variant/60">â‚¹149 per ticket</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 block">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="comedianType">Comedian Type</label>
                          <select 
                            id="comedianType"
                            name="comedianType"
                            value={formData.comedianType}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#080808] border border-white/10 text-on-surface px-4 py-3 rounded-lg focus:border-primary-container transition-colors font-body-md appearance-none focus:outline-none focus:ring-1 focus:ring-primary-container"
                          >
                            <option value="" disabled>Select type</option>
                            <option value="standup">Standup</option>
                            <option value="improv">Improv</option>
                            <option value="sketch">Sketch</option>
                            <option value="musical">Musical</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="experience">Experience (Years)</label>
                          <input 
                            type="number"
                            id="experience"
                            name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            min="0"
                            placeholder="e.g. 2" 
                            className="w-full bg-[#080808] border border-white/10 text-on-surface px-4 py-3 rounded-lg focus:border-primary-container transition-colors font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="speciality">Speciality</label>
                        <input 
                          type="text"
                          id="speciality"
                          name="speciality"
                          value={formData.speciality}
                          onChange={handleChange}
                          placeholder="What's your niche?" 
                          className="w-full bg-[#080808] border border-white/10 text-on-surface px-4 py-3 rounded-lg focus:border-primary-container transition-colors font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="bio">Short Bio</label>
                        <textarea 
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          rows={3} 
                          placeholder="Tell us about yourself..." 
                          className="w-full bg-[#080808] border border-white/10 text-on-surface px-4 py-3 rounded-lg focus:border-primary-container transition-colors font-body-md custom-scrollbar focus:outline-none focus:ring-1 focus:ring-primary-container"
                        ></textarea>
                      </div>
                      <div className="space-y-2">
                        <label className="block font-label-caps text-label-caps text-on-surface-variant" htmlFor="socialLinks">Social Links</label>
                        <input 
                          type="text"
                          id="socialLinks"
                          name="socialLinks"
                          value={formData.socialLinks}
                          onChange={handleChange}
                          placeholder="Instagram / YouTube / Website" 
                          className="w-full bg-[#080808] border border-white/10 text-on-surface px-4 py-3 rounded-lg focus:border-primary-container transition-colors font-body-md focus:outline-none focus:ring-1 focus:ring-primary-container"
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                        <span>{bookingType === 'show' ? 'Book Tickets' : 'Submit Registration'}</span>
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
              <span className="text-xs font-label-caps text-on-surface-variant uppercase tracking-widest">Official Humours Hub Booking Portal</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-white/5 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop py-12 w-full max-w-container-max mx-auto space-y-8 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="font-headline-sm text-headline-sm font-bold text-primary">Humours Hub</div>
            <p className="font-body-md text-body-md text-on-surface-variant">Â© 2024 Humours Hub Ahmedabad. All Rights Reserved.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:flex md:space-x-12">
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/dashboard">Shows</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Gallery</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">About</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/book-tickets">Perform With Us</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
