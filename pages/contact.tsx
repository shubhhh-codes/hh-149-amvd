import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [contactConfig, setContactConfig] = useState<any>(null);

  useEffect(() => {
    fetch('/api/cms/footer')
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          setContactConfig(data.content.metadata);
        }
      })
      .catch(err => console.error('Failed to load contact settings:', err));

    // Scroll Intersection Observer for fade-up elements
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-up').forEach((element) => {
        observer.observe(element);
    });
    
    // Trigger initial visible check
    setTimeout(() => {
         document.querySelectorAll('.fade-up').forEach((element) => {
             const rect = element.getBoundingClientRect();
             if(rect.top < window.innerHeight) {
                 element.classList.add('visible');
             }
         });
    }, 50);
  }, []);

  const headlineText = "We'd love to hear from you.";
  const words = headlineText.split(' ');

  const whatsappUrl = contactConfig?.whatsappUrl || '#';
  const instagramUrl = contactConfig?.instagramUrl || '#';
  const emailAddress = contactConfig?.emailAddress || 'contact@humourshub.com';

  return (
    <>
      <Head>
        <title>Contact Us | The Humours Hub</title>
        <meta name="description" content="Get in touch with The Humours Hub. Questions about shows, tickets, or performing? We're always around." />
      </Head>

      <Navbar />

      <div className="bg-[#0A0A0A] text-[#e5e2e1] font-body min-h-screen flex flex-col pt-20">
        <style jsx>{`
            .text-secondary-opacity {
                color: rgba(229, 226, 225, 0.45); /* Secondary metadata 45% */
            }
            .border-subtle {
                border-color: rgba(255, 255, 255, 0.07); /* 7% white stroke */
            }
            
            /* Form Inputs */
            input, textarea, select {
                background-color: #080808 !important;
                border: 1px solid rgba(255, 255, 255, 0.07) !important;
                color: rgba(229, 226, 225, 0.9) !important;
                border-radius: 0.25rem;
                transition: border-color 0.2s ease;
            }
            input:focus, textarea:focus, select:focus {
                outline: none !important;
                border-color: #ff6b1a !important;
                box-shadow: none !important;
            }
            input::placeholder, textarea::placeholder {
                color: rgba(229, 226, 225, 0.45) !important;
            }

            /* Animations */
            .fade-up {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 400ms ease-out, transform 400ms ease-out;
            }
            .fade-up.visible {
                opacity: 1;
                transform: translateY(0);
            }
            .stagger-word {
                display: inline-block;
                opacity: 0;
                transform: translateY(10px);
                animation: wordFadeUp 0.5s forwards;
            }
            @keyframes wordFadeUp {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .hover-card {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .hover-card:hover {
                transform: translateY(-4px);
            }
        `}</style>

        {/* Main Content */}
        <main className="flex-grow w-full px-6 md:px-16 py-16 md:py-24 max-w-[1280px] mx-auto">
          {/* Hero Section */}
          <section className="mb-16 md:mb-24">
            <span className="font-headline text-label-caps text-[#ff6b1a] tracking-[0.1em] mb-4 block fade-up visible">GET IN TOUCH</span>
            <h1 className="font-headline font-bold text-5xl md:text-6xl lg:text-7xl mb-6 text-on-surface tracking-normal" id="hero-headline" style={{ lineHeight: 1.1 }}>
              {words.map((word, index) => (
                <span 
                  key={index} 
                  className="stagger-word" 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </h1>
            <p className="font-body text-xl md:text-2xl text-secondary-opacity max-w-2xl fade-up visible" style={{ transitionDelay: '200ms' }}>
              Questions about shows, tickets, or performing? We're always around.
            </p>
          </section>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            {/* Left Column: Cards */}
            <div className="flex flex-col gap-6 fade-up visible" style={{ transitionDelay: '300ms' }}>
              {/* WhatsApp Card */}
              <div className="bg-[#141414] border-subtle border border-l-4 border-l-[#ff6b1a] rounded p-6 hover-card flex flex-col items-start relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-[#ff6b1a]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <span className="material-symbols-outlined text-[#ff6b1a] text-3xl mb-4" style={{fontVariationSettings: "'FILL' 0"}}>chat</span>
                <h3 className="font-headline font-bold text-xl mb-2 text-on-surface">Chat on WhatsApp</h3>
                <p className="font-body text-secondary-opacity mb-6">Fastest way to reach us. We usually reply within a few hours.</p>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-[#ff6b1a] text-[#0A0A0A] font-headline font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-colors duration-200 mt-auto w-full sm:w-auto">
                  Open WhatsApp <span className="material-symbols-outlined ml-2 text-xl">arrow_forward</span>
                </a>
              </div>

              {/* Instagram Card */}
              <div className="bg-[#141414] border-subtle border border-l-4 border-l-[#ff6b1a] rounded p-6 hover-card flex flex-col items-start relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-[#ff6b1a]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <span className="material-symbols-outlined text-[#ff6b1a] text-3xl mb-4" style={{fontVariationSettings: "'FILL' 0"}}>photo_camera</span>
                <h3 className="font-headline font-bold text-xl mb-2 text-on-surface">Follow on Instagram</h3>
                <p className="font-body text-secondary-opacity mb-6">Catch show announcements, behind the scenes, and community moments.</p>
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center border border-white/20 text-on-surface font-headline font-bold px-6 py-3 rounded-xl hover:bg-white/5 transition-colors duration-200 mt-auto w-full sm:w-auto">
                  Visit @thehumourshub <span className="material-symbols-outlined ml-2 text-xl">arrow_forward</span>
                </a>
              </div>

              {/* Email Card */}
              <div className="bg-[#141414] border-subtle border border-l-4 border-l-[#ff6b1a] rounded p-6 hover-card flex flex-col items-start relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-[#ff6b1a]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <span className="material-symbols-outlined text-[#ff6b1a] text-3xl mb-4" style={{fontVariationSettings: "'FILL' 0"}}>mail</span>
                <h3 className="font-headline font-bold text-xl mb-2 text-on-surface">Send an Email</h3>
                <p className="font-body text-secondary-opacity mb-6">For formal inquiries, partnerships, or press.</p>
                <a href={`mailto:${emailAddress}`} className="font-headline font-bold text-[#ff6b1a] hover:brightness-110 transition-colors text-lg mt-auto">
                  {emailAddress}
                </a>
              </div>

              {/* Bottom Note */}
              <p className="text-[13px] text-secondary-opacity italic mt-4">
                We're a small team. We'll get back to you as soon as we can — usually within 24 hours on WhatsApp.
              </p>
            </div>

            {/* Right Column: Form */}
            <div className="fade-up visible" style={{ transitionDelay: '400ms' }}>
              <div className="bg-[#141414] border border-white/5 rounded p-8 md:p-10 relative overflow-hidden">
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff6b1a] opacity-20 blur-2xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#ff6b1a] rounded-tr"></div>
                
                <h2 className="font-headline font-bold text-3xl mb-8 text-on-surface relative z-10">Send us a message</h2>
                
                <form className="space-y-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="font-headline text-label-caps text-secondary-opacity block tracking-[0.1em]">NAME</label>
                      <input type="text" id="name" placeholder="Your name" className="w-full px-4 py-3 font-body focus:ring-0" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="font-headline text-label-caps text-secondary-opacity block tracking-[0.1em]">PHONE</label>
                      <div className="flex items-stretch bg-[#080808] border border-[rgba(255,255,255,0.07)] rounded focus-within:border-[#ff6b1a] transition-colors overflow-hidden">
                        <div className="flex items-center gap-2 pl-4 pr-3 border-r border-[rgba(255,255,255,0.07)] bg-white/[0.02] text-secondary-opacity select-none">
                          <span className="material-symbols-outlined text-[20px]">phone</span>
                          <span className="font-body font-bold text-white/40 pt-[1px]">+91</span>
                        </div>
                        <input 
                          type="tel" 
                          id="phone" 
                          placeholder="XXXXXXXXXX" 
                          maxLength={10}
                          className="w-full !bg-transparent !border-none px-3 py-3 font-body focus:outline-none focus:ring-0"
                          onChange={(e) => { e.target.value = e.target.value.replace(/^\+91/, '').replace(/[^0-9]/g, '').slice(0, 10) }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="font-headline text-label-caps text-secondary-opacity block tracking-[0.1em]">SUBJECT</label>
                    <div className="relative">
                      <select id="subject" className="w-full px-4 py-3 font-body appearance-none focus:ring-0 text-on-surface" defaultValue="">
                        <option value="" disabled>Select a topic</option>
                        <option value="tickets">Ticket Issue</option>
                        <option value="perform">Want to Perform</option>
                        <option value="venue">Venue Booking</option>
                        <option value="other">Other</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary-opacity pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="font-headline text-label-caps text-secondary-opacity block tracking-[0.1em]">MESSAGE</label>
                    <textarea id="message" rows={4} placeholder="How can we help?" className="w-full px-4 py-3 font-body focus:ring-0 resize-none"></textarea>
                  </div>

                  <button type="button" className="w-full bg-[#ff6b1a] text-[#0A0A0A] font-headline font-bold px-6 py-4 rounded-xl hover:brightness-110 transition-colors duration-200 flex items-center justify-center text-lg active:scale-[0.98]">
                    Send Message <span className="material-symbols-outlined ml-2">arrow_forward</span>
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-headline text-sm font-semibold text-[#ff6b1a] hover:brightness-110 transition-colors inline-flex items-center">
                    Or reach us directly on WhatsApp <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
