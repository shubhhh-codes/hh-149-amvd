import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Feedback() {
  const [activeVibe, setActiveVibe] = useState<string | null>(null);
  const [vibeError, setVibeError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const magneticBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Magnetic Button Effect
    const magneticBtn = magneticBtnRef.current;
    if (magneticBtn && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = magneticBtn.getBoundingClientRect();
        const btnX = rect.left + rect.width / 2;
        const btnY = rect.top + rect.height / 2;
        
        const distX = e.clientX - btnX;
        const distY = e.clientY - btnY;
        
        const threshold = 150;
        if (Math.abs(distX) < threshold && Math.abs(distY) < threshold) {
            const power = 0.25;
            magneticBtn.style.transform = `translate(${distX * power}px, ${distY * power}px) scale(1.05)`;
        } else {
            magneticBtn.style.transform = `translate(0, 0) scale(1)`;
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        magneticBtn.style.transform = '';
      };
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeVibe) {
      setVibeError(true);
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      category: formData.get('category'),
      comment: formData.get('comment'),
      vibe: activeVibe,
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to submit feedback');
      
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const vibes = [
    { id: 'hilarious', icon: 'sentiment_very_satisfied', label: 'Hilarious' },
    { id: 'great', icon: 'theater_comedy', label: 'Great Show' },
    { id: 'good', icon: 'sentiment_satisfied', label: 'Good' },
    { id: 'needs-work', icon: 'build', label: 'Needs Work' },
    { id: 'not-for-me', icon: 'sentiment_dissatisfied', label: 'Not for Me' },
  ];

  return (
    <>
      <Head>
        <title>Feedback | The Humours Hub</title>
        <meta name="description" content="Help us get better by providing your feedback." />
      </Head>
      <Navbar />

      <main className="relative pt-32 pb-24 min-h-screen flex flex-col items-center overflow-hidden bg-background">
        <style dangerouslySetInnerHTML={{__html: `
          .glass-card {
              background: rgba(20, 20, 20, 0.7);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(255, 255, 255, 0.07);
          }
          @keyframes slideUpFade {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
          }
          .animate-stagger {
              opacity: 0;
              animation: slideUpFade 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          @media (prefers-reduced-motion: reduce) {
              .animate-stagger { animation: none; opacity: 1; }
              .vibe-card:hover, .btn-magnetic:hover { transform: none !important; }
          }
          .vibe-card { transition: all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1); }
          .vibe-card:hover {
              transform: scale(1.05);
              box-shadow: 0 0 20px rgba(255, 107, 26, 0.15);
              border-color: rgba(255, 107, 26, 0.4);
              background: rgba(255, 107, 26, 0.05);
          }
          .vibe-card.active {
              background: rgba(255, 107, 26, 0.15);
              border-color: #ff6b1a;
              box-shadow: 0 0 25px rgba(255, 107, 26, 0.25);
          }
          .input-field {
              transition: border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .input-field:focus {
              border-color: #ff6b1a !important;
              box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 1px #ff6b1a !important;
          }
          .btn-magnetic {
              transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1), box-shadow 0.3s ease;
          }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />

        <div className="w-full max-w-4xl px-5 md:px-16 z-10">
          {/* Header Section */}
          <div className="text-center mb-12 pt-8">
            <h1 className="text-4xl md:text-6xl font-bold text-on-background mb-6 leading-tight animate-stagger" style={{ animationDelay: '0.1s', fontFamily: "'Hind', sans-serif" }}>
              We want to <span className="text-primary-container">hear</span> from you.
            </h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed opacity-80 animate-stagger" style={{ animationDelay: '0.2s', fontFamily: "'DM Sans', sans-serif" }}>
              The feedback form helps us identify where we’re making mistakes and what we’re doing wrong, and even the least engaged user will fill it out.
            </p>
          </div>

          {/* Form Card */}
          <div className="glass-card p-8 md:p-12 rounded-2xl relative animate-stagger" style={{ background: 'rgba(14, 14, 14, 0.8)', border: '1px solid rgba(255, 107, 26, 0.15)', backdropFilter: 'blur(24px)', animationDelay: '0.3s' }}>
            {!isSuccess ? (
              <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Name & Email Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 animate-stagger" style={{ animationDelay: '0.4s' }}>
                  <label className="text-xs uppercase tracking-widest text-outline" htmlFor="full_name" style={{ fontFamily: "'Hind', sans-serif" }}>Full Name</label>
                  <input className="input-field bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 focus:ring-0 outline-none transition-all text-on-surface placeholder:text-white/20" id="full_name" name="fullName" placeholder="Enter your full name" required type="text" style={{ fontFamily: "'DM Sans', sans-serif" }} />
                </div>
                <div className="flex flex-col gap-2 animate-stagger" style={{ animationDelay: '0.5s' }}>
                  <label className="text-xs uppercase tracking-widest text-outline" htmlFor="email" style={{ fontFamily: "'Hind', sans-serif" }}>Email Address</label>
                  <input className="input-field bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 focus:ring-0 outline-none transition-all text-on-surface placeholder:text-white/20" id="email" name="email" placeholder="you@example.com" required type="email" style={{ fontFamily: "'DM Sans', sans-serif" }} />
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2 animate-stagger" style={{ animationDelay: '0.6s' }}>
                <label className="text-xs uppercase tracking-widest text-outline" htmlFor="category" style={{ fontFamily: "'Hind', sans-serif" }}>Feedback Category</label>
                <select className="input-field bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 focus:ring-0 outline-none transition-all text-on-surface appearance-none" id="category" name="category" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  <option value="performance">Performance</option>
                  <option value="venue">Venue & Atmosphere</option>
                  <option value="booking">Booking & Ticketing</option>
                  <option value="general">General Feedback</option>
                </select>
              </div>

              {/* Vibe Scale */}
              <div className="flex flex-col gap-3 animate-stagger" style={{ animationDelay: '0.7s' }}>
                <div className="flex justify-between items-center">
                  <label className={`text-xs uppercase tracking-widest ${vibeError ? 'text-red-400' : 'text-outline'}`} style={{ fontFamily: "'Hind', sans-serif" }}>How was the vibe?</label>
                  {vibeError && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Required</span>}
                </div>
                <div className={`grid grid-cols-5 gap-1 sm:gap-3 ${vibeError ? 'p-1 rounded-xl border border-red-500/30 bg-red-500/5' : ''}`}>
                  {vibes.map((vibe) => (
                    <div key={vibe.id} className="relative aspect-square">
                      <button 
                        type="button" 
                        onClick={() => {
                          setActiveVibe(vibe.id);
                          setVibeError(false);
                        }}
                        className={`absolute inset-0 vibe-card flex flex-col items-center justify-center gap-1 sm:gap-2 p-1 sm:p-4 rounded-xl border ${vibeError && !activeVibe ? 'border-red-500/20' : 'border-white/5'} bg-white/5 group ${activeVibe === vibe.id ? 'active' : ''}`}
                      >
                        <span className="material-symbols-outlined text-[18px] sm:text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{vibe.icon}</span>
                        <span className="text-[9px] sm:text-xs font-medium text-center leading-none px-1 w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>{vibe.label}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="flex flex-col gap-2 animate-stagger" style={{ animationDelay: '0.8s' }}>
                <label className="text-xs uppercase tracking-widest text-outline" htmlFor="better" style={{ fontFamily: "'Hind', sans-serif" }}>What can we do better?</label>
                <textarea className="input-field bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 focus:ring-0 outline-none transition-all text-on-surface placeholder:text-white/20 resize-none" id="better" name="comment" placeholder="Be brutally honest with us..." required rows={4} style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: '#0E0E0E' }}></textarea>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 animate-stagger flex justify-center w-full" style={{ animationDelay: '0.9s' }}>
                <button 
                  ref={magneticBtnRef}
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-magnetic w-full md:w-auto bg-primary-container text-on-primary-container font-bold text-lg px-10 py-4 rounded-xl flex items-center justify-center gap-2 group hover:shadow-[0_0_20px_rgba(255,107,26,0.3)] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 ease-out"
                  style={{ fontFamily: "'Hind', sans-serif" }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>progress_activity</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      Submit Feedback 
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-4 animate-stagger" style={{ animationDelay: '0.1s' }}>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Hind', sans-serif" }}>Success!</h3>
                <p className="text-lg text-on-surface-variant" style={{ fontFamily: "'DM Sans', sans-serif" }}>Thank you for helping us grow!</p>
                <button 
                  onClick={() => { setIsSuccess(false); setActiveVibe(null); }}
                  className="mt-8 text-primary text-sm uppercase tracking-widest hover:underline"
                  style={{ fontFamily: "'Hind', sans-serif" }}
                >
                  Submit another response
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
