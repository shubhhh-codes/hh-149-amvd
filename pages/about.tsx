import React from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useEffect } from 'react';

export default function AboutPage() {
  useEffect(() => {
    // Micro-interactions and subtle scroll reveals
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-8');
            }
        });
    }, observerOptions);

    // Apply reveal animation to section contents
    document.querySelectorAll('.animate-section').forEach(el => {
        el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
        observer.observe(el);
    });
  }, []);

  return (
    <>
      <Head>
        <title>About | The Humours Hub</title>
        <meta name="description" content="Our Story. Ahmedabad always had funny people. It just needed a room." />
      </Head>

      <Navbar />

      <div className="bg-[#0A0A0A] text-[#e5e2e1] font-body-md overflow-x-hidden min-h-screen pt-20">
        <style jsx>{`
          .spotlight-glow {
              background: radial-gradient(circle at center, rgba(255, 107, 26, 0.08) 0%, transparent 70%);
          }
          .border-7-white {
              border: 1px solid rgba(255, 255, 255, 0.07);
          }
        `}</style>
        
        {/* Hero Section */}
        <section className="px-margin-mobile md:px-margin-desktop py-24 md:py-32 max-w-container-max mx-auto relative overflow-hidden">
          <div className="absolute -z-10 top-0 left-0 spotlight-glow w-full h-full"></div>
          <div className="relative z-10 animate-section">
            <span className="font-label-caps text-[14px] tracking-[0.1em] font-bold text-primary block mb-4">OUR STORY</span>
            <h1 className="font-display-lg text-[40px] md:text-[64px] font-bold max-w-4xl mb-8 leading-none md:leading-[1.1] tracking-[-0.02em]">
                Ahmedabad always had funny people. <br />
                <span className="text-primary">It just needed a room.</span>
            </h1>
            <p className="font-body-lg text-[18px] text-[#bab8b7] max-w-2xl leading-[1.6]">
                The Humours Hub is that room. It's the brick-and-mortar manifestation of late-night chai sessions and shared laughter that refused to stay quiet.
            </p>
          </div>
        </section>

        {/* Brand Story: Two Columns */}
        <section className="px-margin-mobile md:px-margin-desktop py-20 max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start animate-section">
            <div className="border-l-4 border-primary pl-8 py-4">
              <blockquote className="font-headline-sm text-[28px] italic leading-[1.2] text-on-surface font-semibold">
                  "We didn't build a stage. We built a space where strangers sit together, laugh at the same moment, and leave knowing each other's names."
              </blockquote>
            </div>
            <div className="space-y-6 font-body-md text-[#bab8b7] leading-relaxed">
              <p>
                  It started in the corners of crowded cafes where Ahmedabad's first comedic voices were trying to find their rhythm. We realized that talent wasn't the bottleneck—it was the infrastructure. Local artists needed more than just a microphone; they needed a home.
              </p>
              <p>
                  Today, The Humours Hub stands as Ahmedabad's definitive center for live performance. We curate nights that range from experimental open mics to polished specials, ensuring that the raw energy of the city is always preserved.
              </p>
              <p className="font-medium text-[#e5e2e1]">
                  This isn't just about punchlines. It's about identity. It's about telling our own stories in our own voice. <span className="text-primary">Yeh unhi logon ke liye hai.</span>
              </p>
            </div>
          </div>
        </section>

        {/* "OUR" Moment */}
        <section className="bg-[#141414] py-24 my-20">
          <div className="px-margin-mobile md:px-margin-desktop text-center max-w-container-max mx-auto animate-section">
            <h2 className="font-display-lg font-bold text-[64px] md:text-[80px] mb-4 leading-[1.1] tracking-[-0.02em]">
                Hum<span className="text-primary">OUR</span>s
            </h2>
            <p className="font-headline-sm text-[24px] font-semibold text-[#e2bfb2]">
                It was never just about comedy. It was always about <span className="text-primary uppercase">Ours</span>.
            </p>
          </div>
        </section>

        {/* Mission Cards */}
        <section className="px-margin-mobile md:px-margin-desktop py-20 max-w-container-max mx-auto">
          <span className="font-label-caps tracking-[0.1em] text-[#e2bfb2] block mb-12 font-bold animate-section">WHAT WE STAND FOR</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stage */}
            <div className="bg-[#141414] border-7-white p-8 border-l-4 border-l-primary flex flex-col h-full group hover:bg-[#1c1b1b] transition-all animate-section">
              <span className="material-symbols-outlined text-primary mb-6 text-[40px]" style={{fontVariationSettings: "'FILL' 0"}}>theater_comedy</span>
              <h3 className="font-headline-md text-[32px] font-semibold mb-4 uppercase">Stage</h3>
              <p className="text-[#bab8b7]">Providing a professional, high-spec platform for Ahmedabad's voices to reach their full potential without compromise.</p>
            </div>
            {/* Community */}
            <div className="bg-[#141414] border-7-white p-8 border-l-4 border-l-primary flex flex-col h-full group hover:bg-[#1c1b1b] transition-all animate-section delay-100">
              <span className="material-symbols-outlined text-primary mb-6 text-[40px]" style={{fontVariationSettings: "'FILL' 0"}}>groups_2</span>
              <h3 className="font-headline-md text-[32px] font-semibold mb-4 uppercase">Community</h3>
              <p className="text-[#bab8b7]">Fostering a network of creators and enthusiasts who support, critique, and grow the local arts ecosystem together.</p>
            </div>
            {/* Culture */}
            <div className="bg-[#141414] border-7-white p-8 border-l-4 border-l-primary flex flex-col h-full group hover:bg-[#1c1b1b] transition-all animate-section delay-200">
              <span className="material-symbols-outlined text-primary mb-6 text-[40px]" style={{fontVariationSettings: "'FILL' 0"}}>temple_hindu</span>
              <h3 className="font-headline-md text-[32px] font-semibold mb-4 uppercase">Culture</h3>
              <p className="text-[#bab8b7]">Cementing live performance as a pillar of Ahmedabad's modern identity, bridging the gap between heritage and humor.</p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-margin-mobile md:px-margin-desktop py-32 max-w-container-max mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left items-end animate-section">
            <div>
              <div className="text-[64px] font-bold text-primary font-headline-md leading-none mb-2">12+</div>
              <div className="font-label-caps text-[14px] font-bold tracking-[0.1em] text-[#e2bfb2]">Shows Performed</div>
            </div>
            <div>
              <div className="text-[64px] font-bold text-primary font-headline-md leading-none mb-2">150</div>
              <div className="font-label-caps text-[14px] font-bold tracking-[0.1em] text-[#e2bfb2]">Seats Per Show</div>
            </div>
            <div className="col-span-2 md:col-span-2">
              <div className="text-[64px] font-bold text-[#e5e2e1] font-headline-md leading-none mb-2">1</div>
              <div className="font-label-caps text-[14px] font-bold tracking-[0.1em] text-[#e2bfb2]">City. For Now.</div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-margin-mobile md:px-margin-desktop py-32 bg-[#0e0e0e]">
          <div className="max-w-4xl mx-auto text-center animate-section">
            <h2 className="font-display-lg text-[64px] font-bold mb-6 tracking-[-0.02em] leading-[1.1]">Ready to be part of it?</h2>
            <p className="font-body-lg text-[18px] text-[#bab8b7] mb-12">
                Whether you're looking for a night of laughter or a microphone to share your story, the Hub is open.
            </p>
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <Link href="/book-tickets" className="bg-primary text-[#0A0A0A] font-bold text-[24px] px-10 py-4 rounded-lg hover:brightness-110 transition-all">
                  Book Your Seat →
              </Link>
              <Link href="/perform-with-us" className="border border-white/20 text-[#e5e2e1] font-bold text-[24px] px-10 py-4 rounded-lg hover:bg-white/5 transition-all">
                  Perform With Us →
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
