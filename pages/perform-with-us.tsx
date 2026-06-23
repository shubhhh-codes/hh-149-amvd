import React from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useEffect } from 'react';
import clientPromise from '@/lib/mongodb';

export default function PerformWithUsPage({ performHero }: { performHero: any }) {
  useEffect(() => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                (entry.target as HTMLElement).style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-enter').forEach(el => {
        (el as HTMLElement).style.animationPlayState = 'paused';
        observer.observe(el);
    });
  }, []);

  return (
    <>
      <Head>
        <title>Perform With Us | The Humours Hub</title>
        <meta name="description" content="Give your art an audience. Perform at The Humours Hub." />
      </Head>

      <Navbar />

      <div className="bg-[#0A0A0A] text-[#FFFFFF] font-body-md min-h-screen flex flex-col pt-20">
        <style jsx>{`
          .animate-enter {
              opacity: 0;
              transform: translateY(20px);
              animation: fadeUp 0.8s ease-out forwards;
          }
          .delay-100 { animation-delay: 100ms; }
          .delay-200 { animation-delay: 200ms; }
          
          @keyframes fadeUp {
              to {
                  opacity: 1;
                  transform: translateY(0);
              }
          }

          @keyframes attentionPulse {
              0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 107, 26, 0.4); }
              50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(255, 107, 26, 0); }
              100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 107, 26, 0); }
          }

          .cta-pulse {
              animation: attentionPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              animation-delay: 2s;
          }
          
          .fractal-noise {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 50;
              opacity: 0.03;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          }
        `}</style>
        
        <div className="fractal-noise"></div>

        <main className="flex-grow pt-12 md:pt-32 pb-20 px-margin-mobile md:px-gutter max-w-container-max mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            
            {/* Left Column: Copy & Image */}
            <div className="flex flex-col gap-8 animate-enter">
              <div>
                <h1 className="font-bold text-[40px] md:text-[64px] font-headline-md leading-[1.2] text-[#e5e2e1] mb-4">
                    {performHero?.title ? (
                      <span dangerouslySetInnerHTML={{ __html: performHero.title.replace(/\n/g, '<br />') }} />
                    ) : (
                      <>Give your art <br />an audience.</>
                    )}
                </h1>
                <p className="font-body-lg text-[18px] text-[rgba(255,255,255,0.7)] max-w-md whitespace-pre-wrap">
                    {performHero?.subtitle || "We're always looking for fresh voices, seasoned comics, and unique performers to hit our stage."}
                </p>
                <p className="font-headline-md text-[24px] font-bold text-primary-container mt-6 italic">
                    "{performHero?.content || 'Manch tumhara, mic tumhara.'}"
                </p>
              </div>
              <ul className="flex flex-col gap-4 mt-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container shrink-0 mt-1" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  <span className="font-body-md text-[#e5e2e1]">Professional stage setup and lighting.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container shrink-0 mt-1" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  <span className="font-body-md text-[#e5e2e1]">Engaged, comedy-loving local audience.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container shrink-0 mt-1" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  <span className="font-body-md text-[#e5e2e1]">Opportunities for regular spots and featured shows.</span>
                </li>
              </ul>
              
              <div className="mt-8 relative rounded-lg overflow-hidden border border-[rgba(255,255,255,0.07)] aspect-[4/3] group delay-200 animate-enter">
                <img 
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
                  src={performHero?.imageUrl || "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&q=80&w=800"}
                  alt="A moody photograph of a stand-up comedian performing on a dark stage." 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-80"></div>
              </div>
            </div>

            {/* Right Column: Form Card */}
            <div className="relative animate-enter delay-100">
              {/* Decorative Accent */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-container/20 rounded-full blur-2xl"></div>
              
              <div className="relative bg-[#141414] border border-[rgba(255,255,255,0.07)] rounded-[1rem] p-8 md:p-10 shadow-2xl overflow-hidden">
                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary-container opacity-20" style={{clipPath: "polygon(100% 0, 0 0, 100% 100%)"}}></div>
                
                <form className="flex flex-col gap-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-[14px] tracking-[0.05em] text-[rgba(255,255,255,0.7)] uppercase font-headline-md" htmlFor="name">Full Name / Stage Name</label>
                    <input className="bg-[#1c1b1b] border border-[rgba(255,255,255,0.07)] rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none" id="name" placeholder="How should we introduce you?" type="text" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-[14px] tracking-[0.05em] text-[rgba(255,255,255,0.7)] uppercase font-headline-md" htmlFor="city">City</label>
                    <input className="bg-[#1c1b1b] border border-[rgba(255,255,255,0.07)] rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none" id="city" placeholder="Where are you based?" type="text" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-[14px] tracking-[0.05em] text-[rgba(255,255,255,0.7)] uppercase font-headline-md" htmlFor="artform">Art Form</label>
                    <div className="relative">
                      <select className="w-full bg-[#1c1b1b] border border-[rgba(255,255,255,0.07)] rounded-lg px-4 py-3 text-[#e5e2e1] appearance-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none cursor-pointer" id="artform" defaultValue="">
                        <option disabled value="">Select your discipline</option>
                        <option value="standup">Stand-up Comedy</option>
                        <option value="improv">Improv</option>
                        <option value="poetry">Spoken Word / Poetry</option>
                        <option value="music">Music / Acoustic</option>
                        <option value="other">Other</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.7)] pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-[14px] tracking-[0.05em] text-[rgba(255,255,255,0.7)] uppercase font-headline-md" htmlFor="links">Video Links / Socials</label>
                    <input className="bg-[#1c1b1b] border border-[rgba(255,255,255,0.07)] rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none" id="links" placeholder="YouTube, Instagram, etc." type="url" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-[14px] tracking-[0.05em] text-[rgba(255,255,255,0.7)] uppercase font-headline-md" htmlFor="bio">Short Bio</label>
                    <textarea className="bg-[#1c1b1b] border border-[rgba(255,255,255,0.07)] rounded-lg px-4 py-3 text-[#e5e2e1] focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none resize-none" id="bio" placeholder="Tell us a bit about your act..." rows={4}></textarea>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <button className="cta-pulse flex-1 bg-primary-container text-[#0A0A0A] font-bold text-[14px] tracking-[0.05em] uppercase px-6 py-4 rounded-full flex items-center justify-center gap-2 hover:bg-[#ff8540] transition-all duration-200" type="submit">
                        Send Application 
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                    <button className="flex-1 bg-transparent border border-white/20 text-[#e5e2e1] font-bold text-[14px] tracking-[0.05em] uppercase px-6 py-4 rounded-full flex items-center justify-center gap-2 hover:bg-white/5 hover:border-white/40 transition-all duration-200" type="button">
                        WhatsApp Us
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}

export async function getStaticProps() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const content = await db.collection('homepage_content')
      .findOne({ type: 'perform_hero', isVisible: true, isDeleted: { $ne: true } });

    return {
      props: {
        performHero: JSON.parse(JSON.stringify(content || null)),
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching perform hero content in getStaticProps:", error);
    return {
      props: {
        performHero: null,
      },
      revalidate: 60,
    };
  }
}
