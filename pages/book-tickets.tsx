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
    <>
      <div className="min-h-screen bg-gradient-to-b from-purple-700 to-purple-900 flex flex-col">
        <Navbar />
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-grow max-w-2xl mx-auto px-4 py-12"
        >
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-white rounded-lg shadow-2xl p-8"
          >
            <div className="flex items-center space-x-4 mb-8">
              <div className="bg-purple-100 rounded-full p-3">
                {bookingType === 'show' ? '🎟️' : '🎤'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {bookingType === 'show' ? 'Book Show Tickets' : 'Join as Comedian'}
                </h2>
                <p className="text-gray-600">
                  {bookingType === 'show' 
                    ? 'Secure your spot for an unforgettable night! 🎭' 
                    : 'Share your talent with our audience! 🌟'}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-md">
                {success}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to do?
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setBookingType('show')}
                  className={`px-4 py-2 rounded-md ${
                    bookingType === 'show'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Book Show Tickets
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType('joinAsComedian')}
                  className={`px-4 py-2 rounded-md ${
                    bookingType === 'joinAsComedian'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Join as Comedian
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {bookingType === 'show' ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="numberOfTickets" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Tickets
                    </label>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => setNumberOfTickets(prev => Math.max(1, prev - 1))}
                        className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <span className="text-lg font-semibold text-gray-900 w-8 text-center">{numberOfTickets}</span>
                      <button
                        type="button"
                        onClick={() => setNumberOfTickets(prev => Math.min(5, prev + 1))}
                        className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Maximum 5 tickets per booking</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount
                    </label>
                    <p className="text-2xl font-bold text-purple-600">
                      ₹{(149 * numberOfTickets).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">149 per ticket</p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="comedianType" className="block text-sm font-medium text-gray-700">
                      Comedian Type
                    </label>
                    <select
                      id="comedianType"
                      name="comedianType"
                      value={formData.comedianType}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="" disabled>
                        Select your comedian type
                      </option>
                      <option value="standup">Standup</option>
                      <option value="improv">Improv</option>
                      <option value="sketch">Sketch</option>
                      <option value="musical">Musical</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="speciality" className="block text-sm font-medium text-gray-700">
                      Speciality
                    </label>
                    <input
                      type="text"
                      id="speciality"
                      name="speciality"
                      value={formData.speciality}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      min={0}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="socialLinks" className="block text-sm font-medium text-gray-700">
                      Social Links
                    </label>
                    <input
                      type="text"
                      id="socialLinks"
                      name="socialLinks"
                      value={formData.socialLinks}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Submitting...' : bookingType === 'show' ? 'Book Tickets' : 'Submit Registration'}
              </button>
            </form>
          </motion.div>
        </motion.main>
        <Footer />
      </div>
    </>
  );
}
