import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import clientPromise from '@/lib/mongodb';

export default function ShowsPage({ showsData }: { showsData: any }) {
  const { hero, nextShow, pastShows } = showsData;
  const [instagramUrl, setInstagramUrl] = useState('');

  useEffect(() => {
    fetch('/api/cms/footer')
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          setInstagramUrl(data.content.metadata?.instagramUrl || '');
        }
      })
      .catch(err => console.error('Failed to load footer settings:', err));
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
  }, []);

  return (
    <>
      <Head>
        <title>The Humours Hub</title>
        <meta name="description" content="Upcoming and past shows at The Humours Hub." />
      </Head>

      <Navbar />

      <div className="bg-[#131313] text-[#e5e2e1] font-body-md overflow-x-hidden min-h-screen pt-20">
        <style dangerouslySetInnerHTML={{ __html: `
          .headline-font { font-family: 'Hind', sans-serif; }
          .reveal-on-scroll {
              opacity: 0;
              transform: translateY(20px);
              transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .reveal-on-scroll.active {
              opacity: 1;
              transform: translateY(0);
          }
          .grain-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 50;
              opacity: 0.03;
              background-image: url("https://www.transparenttextures.com/patterns/carbon-fibre.png");
          }
          .spotlight-gradient {
              background: radial-gradient(circle at 50% 0%, rgba(255, 107, 26, 0.1) 0%, rgba(19, 19, 19, 0) 70%);
          }
          .btn-pulse {
              animation: pulse 2s infinite;
          }
          @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(255, 107, 26, 0.4); }
              70% { box-shadow: 0 0 0 10px rgba(255, 107, 26, 0); }
              100% { box-shadow: 0 0 0 0 rgba(255, 107, 26, 0); }
          }
        `}} />

        <div className="grain-overlay"></div>

        {/* Hero Content */}
        <div className="max-w-[960px] mx-auto pt-12 px-4 md:px-10 pb-12">
          <p className="text-primary-container text-sm font-bold leading-normal tracking-[0.05em] uppercase mb-2">LIVE IN AHMEDABAD</p>
          <h1 className="text-white tracking-tight text-[40px] md:text-[64px] font-bold leading-[1.1] pb-3 headline-font">
            {hero?.title || 'Every show is a one-time thing.'}
          </h1>
          <p className="text-white/70 text-base md:text-lg font-normal leading-normal max-w-2xl">
            {hero?.subtitle || 'Same venue. Different night. Different crowd. No two shows are ever the same.'}
          </p>
        </div>

        {/* Main Content */}
        <main className="max-w-container-max mx-auto px-margin-mobile md:px-gutter py-12 md:py-20 spotlight-gradient relative z-10">

          {/* Upcoming Shows Section */}
          <section className="reveal-on-scroll">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[32px] font-bold text-white headline-font leading-[1.2]">Upcoming Shows</h2>
              <div className="hidden md:block h-px flex-1 bg-white/5 mx-8"></div>
            </div>

            {nextShow ? (
              <div className="group relative bg-[#201f1f] rounded-[1rem] border border-white/5 overflow-hidden flex flex-col md:flex-row transition-all hover:border-[#ff6b1a]/30">
                <div className="w-full md:w-1/2 h-[300px] md:h-auto overflow-hidden relative">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url('${nextShow.imageUrl || 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&q=80&w=800'}')` }}>
                  </div>
                  <div className="absolute top-4 left-4 bg-primary-container text-on-primary-container font-bold px-4 py-2 rounded-full text-sm">
                    {nextShow.metadata?.date} {nextShow.metadata?.month}
                  </div>
                </div>
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-primary-container text-xs font-bold tracking-widest uppercase">Next Show</span>
                    <div className="size-1 rounded-full bg-[#5a4137]"></div>
                    <span className="text-error text-xs font-bold uppercase animate-pulse">Booking Open</span>
                  </div>
                  <h3 className="text-[24px] md:text-[32px] font-bold headline-font text-white mb-6">{nextShow.title}</h3>

                  <div className="space-y-4 mb-8 text-white/70">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 0" }}>location_on</span>
                      <span className="text-body-md">{nextShow.metadata?.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 0" }}>schedule</span>
                      <span className="text-body-md">{nextShow.metadata?.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 0" }}>payments</span>
                      <span className="text-body-md font-bold text-white">{nextShow.metadata?.ticketPrice} <span className="font-normal text-white/70">/ ticket</span></span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {nextShow.metadata?.bookMyShowUrl && (
                      <Link href={nextShow.metadata.bookMyShowUrl} target="_blank" className="bg-primary-container text-[#0A0A0A] px-8 py-4 rounded-full font-bold transition-all hover:bg-primary-container/90 flex items-center justify-center gap-2 btn-pulse">
                        Book on BookMyShow
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
                      </Link>
                    )}
                    <Link href="/book-tickets" className="border border-white/20 text-white px-8 py-4 rounded-full font-bold transition-all hover:bg-white/5 flex items-center justify-center gap-2">
                      Book on Our Website
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#201f1f] border border-white/5 rounded-[1rem] p-8 text-center text-white/60">
                No upcoming shows announced yet. Check back soon!
              </div>
            )}
          </section>

          {/* Past Shows Section */}
          <section className="mt-20 reveal-on-scroll">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-primary-container font-bold tracking-widest text-xs uppercase">PAST SHOWS</span>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pastShows.map((show: any) => (
                <div key={show._id} className="bg-[#201f1f] border border-white/5 rounded-[1rem] p-6 group transition-all hover:bg-[#2a2a2a]">
                  <div className="text-[64px] font-bold headline-font text-primary-container/20 group-hover:text-primary-container/40 transition-colors mb-4 italic">#{show.displayOrder}</div>
                  <div className="aspect-video mb-6 rounded overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                      style={{ backgroundImage: `url('${show.imageUrl}')` }}>
                    </div>
                  </div>
                  <h4 className="text-[24px] font-bold headline-font text-white mb-2">{show.title}</h4>
                  <p className="text-white/70 text-sm mb-4">{show.metadata?.date} • {show.metadata?.venue}</p>
                  <p className="text-[#e2bfb2] text-body-md line-clamp-2">{show.content}</p>
                </div>
              ))}
              {pastShows.length === 0 && (
                <div className="col-span-1 md:col-span-3 text-center text-white/60">
                  Past shows are currently being updated.
                </div>
              )}
            </div>
          </section>

          {/* Bottom Band */}
          <section className="mt-20 reveal-on-scroll">
            <div className="bg-primary-container rounded-[1rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
              <div className="absolute -right-16 -top-16 opacity-10">
                <span className="material-symbols-outlined text-[300px]" style={{ fontVariationSettings: "'FILL' 0" }}>theater_comedy</span>
              </div>
              <div className="relative z-10 text-center md:text-left">
                <h2 className="text-[32px] font-bold headline-font text-[#591e00] mb-2">Missed a show?</h2>
                <p className="text-lg text-[#591e00]/80">Don't miss the next one. We post all announcements first on Instagram.</p>
              </div>
              <Link href={instagramUrl || 'https://instagram.com/the.humourshub'} target="_blank" rel="noopener noreferrer" className="relative z-10 bg-[#591e00] text-primary-container px-10 py-5 rounded-full font-bold flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 group">
                Follow {instagramUrl ? `@${instagramUrl.replace(/.*instagram\.com\//, '').replace(/\/+$/, '')}` : '@the.humourshub'}
              </Link>
            </div>
          </section>

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
      .find({
        type: { $in: ['shows_hero', 'next_show', 'past_shows'] },
        isVisible: true,
        isDeleted: { $ne: true }
      })
      .sort({ displayOrder: -1, createdAt: -1 })
      .toArray();

    const showsData = {
      hero: content.find(c => c.type === 'shows_hero') || null,
      nextShow: content.find(c => c.type === 'next_show') || null,
      pastShows: content.filter(c => c.type === 'past_shows')
    };

    return {
      props: {
        showsData: JSON.parse(JSON.stringify(showsData)),
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching shows content in getStaticProps:", error);
    return {
      props: {
        showsData: { hero: null, nextShow: null, pastShows: [] },
      },
      revalidate: 60,
    };
  }
}
