import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';

export default function Home() {
  const { data: session } = useSession();
  const [venueStatus, setVenueStatus] = useState<{
    totalApproved: number;
    isFull: boolean;
  }>({ totalApproved: 0, isFull: false });

  useEffect(() => {
    const fetchVenueStatus = async () => {
      try {
        const res = await fetch('/api/bookings/venue-status');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setVenueStatus(data);
      } catch (err) {
        console.error('Failed to fetch venue status:', err);
      }
    };

    fetchVenueStatus();
  }, []);

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.scroll-enter').forEach(el => {
      observer.observe(el);
    });
  }, []);

  return (
    <>
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="relative flex flex-col justify-start items-center text-center px-margin-mobile md:px-margin-desktop glow-spotlight pt-[80px] pb-[60px] h-auto">
          <div className="max-w-4xl mx-auto space-y-8 z-10">
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface font-bold reveal-text" id="heroHeading" style={{ fontSize: "clamp(40px, 8vw, 80px)", opacity: 1 }}>
              Ahmedabad's own<br /><span className="text-primary-container">comedy night.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto scroll-enter">Stand-up · Poetry · Singing · Guitar Jams — all in one night.</p>

            <div className="flex flex-wrap justify-center gap-4 text-on-surface-variant font-label-caps text-label-caps scroll-enter">
              <div className="flex items-center gap-2 bg-brand-surface border border-white/10 px-4 py-2 rounded-full">
                <span className="material-symbols-outlined text-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>chair</span>
                Indoor Venue
              </div>
              <div className="flex items-center gap-2 bg-brand-surface border border-white/10 px-4 py-2 rounded-full">
                <span className="material-symbols-outlined text-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                ₹149 Ticket
              </div>
              <div className="flex items-center gap-2 bg-brand-surface border border-white/10 px-4 py-2 rounded-full">
                <span className="material-symbols-outlined text-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                Limited Seats
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8 scroll-enter">
              <Link href="/book-tickets" className="w-full sm:w-auto bg-primary-container text-brand-black text-[24px] font-bold rounded-full px-8 py-4 hover:bg-primary-container/90 transition-colors animate-pulse-slow">
                Book Your Seat →
              </Link>
              <button className="w-full sm:w-auto bg-transparent border border-white/20 text-on-surface font-headline-sm text-headline-sm rounded-full px-8 py-4 hover:bg-white/5 transition-colors">
                Watch past shows
              </button>
            </div>

            <div className="mt-8 text-sm text-on-surface-variant scroll-enter">
              Next show drops on Instagram first
            </div>
          </div>
        </section>

        {/* TICKER */}
        <div className="w-full bg-[#141414] border-y border-white/10 overflow-hidden py-4 flex whitespace-nowrap">
          <div className="animate-marquee inline-block font-label-caps text-label-caps text-primary-container tracking-widest uppercase">
            <span className="mx-8">12+ shows performed</span> ·
            <span className="mx-8">Ahmedabad</span> ·
            <span className="mx-8">₹149 only</span> ·
            <span className="mx-8">Comedy</span> ·
            <span className="mx-8">Poetry</span> ·
            <span className="mx-8">Music</span> ·
            <span className="mx-8">Guitar</span> ·
            <span className="mx-8 text-on-surface">Performers wanted →</span> ·
            <span className="mx-8">12+ shows performed</span> ·
            <span className="mx-8">Ahmedabad</span> ·
            <span className="mx-8">₹149 only</span> ·
            <span className="mx-8">Comedy</span> ·
            <span className="mx-8">Poetry</span> ·
            <span className="mx-8">Music</span> ·
            <span className="mx-8">Guitar</span> ·
            <span className="mx-8 text-on-surface">Performers wanted →</span>
          </div>
        </div>

        {/* WHAT HAPPENS HERE */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-enter">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-12">What happens in a show?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="brutal-card p-8 group">
              <div className="w-12 h-12 bg-primary-container/10 flex items-center justify-center mb-6 rounded-md">
                <span className="material-symbols-outlined text-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3 group-hover:text-primary-container transition-colors">Stand-up Comedy</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Local comics from Ahmedabad try their new jokes and stories. Raw, unfiltered and fully relatable comedy. Yaar, yeh toh meri hi zindagi hai.</p>
            </div>

            <div className="brutal-card p-8 group">
              <div className="w-12 h-12 bg-primary-container/10 flex items-center justify-center mb-6 rounded-md">
                <span className="material-symbols-outlined text-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>history_edu</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3 group-hover:text-primary-container transition-colors">Poetry / Shayari</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Deep conversations, incomplete stories. Local poets recite their poems that hit straight to the heart. Ekdum dil se.</p>
            </div>

            <div className="brutal-card p-8 group">
              <div className="w-12 h-12 bg-primary-container/10 flex items-center justify-center mb-6 rounded-md">
                <span className="material-symbols-outlined text-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>queue_music</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3 group-hover:text-primary-container transition-colors">Singing</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Magic of voices. Be it covers or originals, our performers set the vibe perfectly. Mehfil jam jayegi.</p>
            </div>

            <div className="brutal-card p-8 group">
              <div className="w-12 h-12 bg-primary-container/10 flex items-center justify-center mb-6 rounded-md">
                <span className="material-symbols-outlined text-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>music_note</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3 group-hover:text-primary-container transition-colors">Guitar Jams</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Acoustic vibes and strings. The night always ends with a great jam session. Sab saath mein gaate hain.</p>
            </div>
          </div>
        </section>

        {/* NEXT SHOW */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-enter">
          <h2 className="font-headline-md text-headline-md text-primary-container font-bold mb-12">Next Show Details</h2>
          <div className="brutal-card p-0 flex flex-col lg:flex-row overflow-hidden border-white/20 shadow-2xl rounded-card">
            <div className="lg:w-2/5 bg-brand-overlay relative min-h-[300px]">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1589189280918-cc442edfc628?q=80&w=2670&auto=format&fit=crop')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-brand-surface to-transparent lg:bg-gradient-to-l opacity-80"></div>
            </div>
            <div className="lg:w-3/5 p-8 lg:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-6">
                <div className="font-display-lg text-display-lg text-primary-container font-bold leading-none">24</div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface leading-none uppercase">Nov</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">Sunday</span>
                </div>
              </div>

              <h3 className="font-headline-md text-headline-md text-on-surface mb-4">The Humours Hub: Open Mic Night #14</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 font-body-md text-body-md text-on-surface-variant">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary-container shrink-0 mt-1">location_on</span>
                  <span>The Studio, SG Highway<br />Ahmedabad</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary-container shrink-0 mt-1">schedule</span>
                  <span>8:00 PM to 10:30 PM<br />Gates open at 7:45 PM</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 mb-8 pt-6 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">Ticket Price</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">₹149</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">Status</span>
                  <span className="font-headline-sm text-headline-sm text-primary-container font-bold">
                    {venueStatus.isFull ? 'Sold Out' : `${Math.max(0, 30 - venueStatus.totalApproved)} Seats Left`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/book-tickets" className="flex-1 bg-primary-container text-brand-black font-headline-sm text-headline-sm rounded-full px-6 py-4 text-center hover:bg-primary-container/90 transition-colors">
                  Book on Our Website →
                </Link>
                <button className="flex-1 bg-transparent border border-white/20 text-on-surface font-headline-sm text-headline-sm rounded-full px-6 py-4 text-center hover:bg-white/5 transition-colors">
                  Book on BookMyShow →
                </button>
              </div>

              <div className="mt-6 text-center">
                <a className="text-on-surface-variant hover:text-primary-container flex items-center justify-center gap-2 text-sm transition-colors" href="https://wa.me/message/YOUR_WHATSAPP" target="_blank" rel="noopener noreferrer">
                  <span className="material-symbols-outlined text-base">forum</span> Have questions? Ask on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* WHO PERFORMS HERE */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-enter overflow-hidden">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-12">Who Performs Here?</h2>
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-8">
            <div className="flex flex-col items-center gap-3 shrink-0 group">
              <div className="w-32 h-32 rounded-full bg-brand-overlay border-2 border-transparent group-hover:border-primary-container transition-colors duration-300 overflow-hidden relative">
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-xs text-center p-2 absolute inset-0">[Performer Photo]</div>
              </div>
              <span className="font-headline-sm text-base text-on-surface">Rahul Sharma</span>
              <span className="text-sm text-on-surface-variant">Stand-up</span>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0 group">
              <div className="w-32 h-32 rounded-full bg-brand-overlay border-2 border-transparent group-hover:border-primary-container transition-colors duration-300 overflow-hidden relative">
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-xs text-center p-2 absolute inset-0">[Performer Photo]</div>
              </div>
              <span className="font-headline-sm text-base text-on-surface">Priya Patel</span>
              <span className="text-sm text-on-surface-variant">Poetry</span>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0 group">
              <div className="w-32 h-32 rounded-full bg-brand-overlay border-2 border-transparent group-hover:border-primary-container transition-colors duration-300 overflow-hidden relative">
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-xs text-center p-2 absolute inset-0">[Performer Photo]</div>
              </div>
              <span className="font-headline-sm text-base text-on-surface">Aman Desai</span>
              <span className="text-sm text-on-surface-variant">Music</span>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0 group">
              <div className="w-32 h-32 rounded-full bg-brand-overlay border-2 border-transparent group-hover:border-primary-container transition-colors duration-300 overflow-hidden relative">
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-xs text-center p-2 absolute inset-0">[Performer Photo]</div>
              </div>
              <span className="font-headline-sm text-base text-on-surface">Neha Gupta</span>
              <span className="text-sm text-on-surface-variant">Stand-up</span>
            </div>

            <Link href="/book-tickets?type=comedian" className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-white/20 group-hover:border-primary-container flex items-center justify-center transition-colors duration-300">
                <span className="material-symbols-outlined text-3xl text-white/50 group-hover:text-primary-container">add</span>
              </div>
              <span className="font-headline-sm text-base text-primary-container">Your turn?</span>
              <span className="text-sm text-on-surface-variant">Apply Now</span>
            </Link>
          </div>
        </section>

        {/* REAL SHOW MOMENTS */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-enter">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-12">Real Show Moments</h2>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            <div className="relative group rounded-card overflow-hidden bg-brand-overlay aspect-square break-inside-avoid">
              <div className="absolute inset-0 bg-surface-container-high flex items-center justify-center text-on-surface-variant text-sm">[Real show photo here]</div>
              <div className="absolute inset-0 bg-primary-container/0 group-hover:bg-primary-container/40 transition-colors duration-300"></div>
            </div>
            <div className="relative group rounded-card overflow-hidden bg-brand-overlay aspect-video break-inside-avoid">
              <div className="absolute inset-0 bg-surface-container-high flex items-center justify-center text-on-surface-variant text-sm">[Real show photo here]</div>
              <div className="absolute inset-0 bg-primary-container/0 group-hover:bg-primary-container/40 transition-colors duration-300"></div>
            </div>
            <div className="relative group rounded-card overflow-hidden bg-brand-overlay aspect-[3/4] break-inside-avoid">
              <div className="absolute inset-0 bg-surface-container-high flex items-center justify-center text-on-surface-variant text-sm">[Real show photo here]</div>
              <div className="absolute inset-0 bg-primary-container/0 group-hover:bg-primary-container/40 transition-colors duration-300"></div>
            </div>
            <div className="relative group rounded-card overflow-hidden bg-brand-overlay aspect-video break-inside-avoid">
              <div className="absolute inset-0 bg-surface-container-high flex items-center justify-center text-on-surface-variant text-sm">[Real show photo here]</div>
              <div className="absolute inset-0 bg-primary-container/0 group-hover:bg-primary-container/40 transition-colors duration-300"></div>
            </div>
          </div>
        </section>

        {/* COMMUNITY PROOF */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-enter text-center">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-8">What the Community Says</h2>
          <div className="max-w-3xl mx-auto brutal-card p-12">
            <span className="material-symbols-outlined text-4xl text-primary-container mb-4 opacity-50">format_quote</span>
            <p className="font-body-lg text-xl md:text-2xl text-on-surface italic mb-6">"The best underground comedy scene in Ahmedabad. It feels like family here. Ekdum paisa vasool!"</p>
            <div className="font-headline-sm text-base text-primary-container">- Regular Audience Member</div>
          </div>
        </section>

        {/* COMMUNITY / PERFORM */}
        <section className="py-24 bg-brand-surface border-y border-white/5 scroll-enter glow-spotlight w-full">
          <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop text-center">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-6">Want to perform with us?</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">
              Stand-up, poetry, singing, guitar — any art form. Everyone is welcome on our stage. The stage is yours, the mic is yours. Let's create magic. Aao kabhi haveli pe.
            </p>
            <Link href="/book-tickets?type=comedian" className="bg-primary-container text-brand-black font-headline-sm text-headline-sm rounded-full px-8 py-4 hover:bg-primary-container/90 transition-colors inline-flex items-center gap-2">
              Apply to Perform →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
