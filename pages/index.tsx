import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { getDbSafe } from '@/lib/db-safe';

interface Performer {
  _id: string;
  username: string;
  comedianProfile: {
    speciality: string;
    tagline?: string;
    instagramUrl?: string;
    photoId?: string;
    displayOrder: number;
    isFeatured: boolean;
  };
}

interface GalleryItem {
  _id: string;
  title: string;
  imageId: string;
  displayOrder: number;
}

interface NextShowItem {
  _id: string;
  title: string;
  imageUrl?: string;
  metadata: {
    date: string;
    month: string;
    day: string;
    location: string;
    time: string;
    ticketPrice: string;
    bookMyShowUrl: string;
    whatsappUrl: string;
  };
}

interface Props {
  performers: Performer[];
  gallery: GalleryItem[];
  nextShow: NextShowItem | null;
}

export default function Home({ performers, gallery, nextShow }: Props) {
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
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface font-bold reveal-text" id="heroHeading" style={{ fontSize: "clamp(32px, 6.5vw, 64px)", opacity: 1 }}>
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
              <Link href="/book-tickets" className="w-full sm:w-auto bg-primary-container text-brand-black text-[18px] font-bold rounded-full px-6 py-3 hover:bg-primary-container/90 transition-colors animate-pulse-slow">
                Book Your Seat →
              </Link>
              <button className="w-full sm:w-auto bg-transparent border border-white/20 text-on-surface font-headline-sm text-headline-sm rounded-full px-6 py-3 hover:bg-white/5 transition-colors">
                <Link href="/shows">
                  Watch past shows
                </Link>
              </button>
            </div>

            <div className="mt-8 text-sm text-on-surface-variant scroll-enter">
              <Link href="https://instagram.com/the.humourshub" className='hover:underline' rel='noopener noreferrer' target='_blank'>
                Next show drops on Instagram first
              </Link>
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
            <span className="mx-8">3+ shows performed</span> ·
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
        <section className="py-8 md:py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-enter">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-8">What happens in a show?</h2>
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

        {/* NEXT SHOW & RECOVERY PORTAL */}
        <section className="py-8 md:py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-enter flex flex-col gap-8">
          {nextShow ? (
            <div>
              <h2 className="font-headline-md text-headline-md text-primary-container font-bold mb-8">Next Show Details</h2>
              <div className="brutal-card p-0 flex flex-col lg:flex-row overflow-hidden border-white/20 shadow-2xl rounded-card">
              <div className="lg:w-2/5 bg-brand-overlay relative min-h-[300px]">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${nextShow.imageUrl || 'https://images.unsplash.com/photo-1589189280918-cc442edfc628?q=80&w=2670&auto=format&fit=crop'}')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-brand-surface to-transparent lg:bg-gradient-to-l opacity-80"></div>
              </div>
              <div className="lg:w-3/5 p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="font-display-lg text-display-lg text-primary-container font-bold leading-none">{nextShow.metadata?.date || '24'}</div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface leading-none uppercase">{nextShow.metadata?.month || 'Nov'}</span>
                    <span className="font-body-md text-body-md text-on-surface-variant">{nextShow.metadata?.day || 'Sunday'}</span>
                  </div>
                </div>

                <h3 className="font-headline-md text-headline-md text-on-surface mb-4">
                  {nextShow.title || 'The Humours Hub: Open Mic Night'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 font-body-md text-body-md text-on-surface-variant">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary-container shrink-0 mt-1">location_on</span>
                    <span style={{ whiteSpace: 'pre-line' }}>{nextShow.metadata?.location || 'The Studio, SG Highway\nAhmedabad'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary-container shrink-0 mt-1">schedule</span>
                    <span style={{ whiteSpace: 'pre-line' }}>{nextShow.metadata?.time || '8:00 PM to 10:30 PM\nGates open at 7:45 PM'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 mb-8 pt-6 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">Ticket Price</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">{nextShow.metadata?.ticketPrice || '₹149'}</span>
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
                  {nextShow.metadata?.bookMyShowUrl && (
                    <a href={nextShow.metadata.bookMyShowUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-transparent border border-white/20 text-on-surface font-headline-sm text-headline-sm rounded-full px-6 py-4 text-center hover:bg-white/5 transition-colors">
                      Book on BookMyShow →
                    </a>
                  )}
                </div>

                {nextShow.metadata?.whatsappUrl && (
                  <div className="mt-6 text-center">
                    <a className="text-on-surface-variant hover:text-primary-container flex items-center justify-center gap-2 text-sm transition-colors" href={nextShow.metadata.whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <span className="material-symbols-outlined text-base">forum</span> Have questions? Ask on WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
            </div>
          ) : (
            <div>
              <h2 className="font-headline-md text-headline-md text-primary-container font-bold mb-8">Next Show Details</h2>
              <div className="brutal-card p-12 text-center text-on-surface-variant border-white/20 shadow-2xl rounded-card">
              <span className="material-symbols-outlined text-5xl mb-4 opacity-40">event_busy</span>
              <p className="font-headline-sm">We're brewing up something special.</p>
              <p className="font-body-md mt-2">No upcoming shows scheduled right now. Check back soon!</p>
            </div>
            </div>
          )}

          {/* RECOVERY PORTAL */}
          <div className="brutal-card p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border-white/10">
            <div className="max-w-2xl text-left">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-3">Already booked your seat?</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">Lost your ticket? Don't worry, you can retrieve it instantly using your booking details.</p>
            </div>
            <Link href="/retrieve-tickets" className="whitespace-nowrap bg-primary-container text-brand-black font-bold px-8 py-4 rounded-full hover:bg-primary-container/90 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">search</span>
              Find My Ticket
            </Link>
          </div>
        </section>

        {/* WHO PERFORMS HERE - DYNAMIC */}
        <section className="py-8 md:py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-enter overflow-hidden">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-8">Who Performs Here?</h2>
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-8">
            {performers.length === 0 ? (
              <div className="flex-1 text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl block mb-4 opacity-40">mic</span>
                <p>No featured performers yet. Check back soon!</p>
              </div>
            ) : (
              performers.map((performer) => (
                <div key={performer._id} className="flex flex-col items-center gap-1 shrink-0 group">
                  <div className="w-32 h-32 rounded-full bg-brand-overlay border-2 border-transparent group-hover:border-primary-container transition-colors duration-300 overflow-hidden relative mb-2">
                    {performer.comedianProfile.photoId ? (
                        <Image
                        src={`/api/images/${performer.comedianProfile.photoId}`}
                        alt={performer.username}
                        className="w-full h-full object-cover"
                        width={256}
                        height={256}
                        quality={95}
                        unoptimized={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center absolute inset-0">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant">person</span>
                      </div>
                    )}
                  </div>
                  <span className="font-headline-sm text-base text-on-surface">{performer.username}</span>
                  <span className="text-sm text-on-surface-variant leading-tight">{performer.comedianProfile.speciality}</span>
                  {performer.comedianProfile.tagline && (
                    <span className="text-xs text-on-surface-variant/60 text-center max-w-[8rem] mt-1 leading-tight">{performer.comedianProfile.tagline}</span>
                  )}
                  {performer.comedianProfile.instagramUrl && (
                    <a href={performer.comedianProfile.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary-container text-xs hover:underline mt-1">
                      Instagram ↗
                    </a>
                  )}
                </div>
              ))
            )}

            <Link href="/perform-with-us" className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-white/20 group-hover:border-primary-container flex items-center justify-center transition-colors duration-300 mb-2">
                <span className="material-symbols-outlined text-3xl text-white/50 group-hover:text-primary-container">add</span>
              </div>
              <span className="font-headline-sm text-base text-primary-container">Your turn?</span>
              <span className="text-sm text-on-surface-variant">Apply Now</span>
            </Link>
          </div>
        </section>

        {/* REAL SHOW MOMENTS - DYNAMIC */}
        <section className="py-8 md:py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-enter">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-8">Real Show Moments</h2>

          {gallery.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant border border-outline-variant rounded-card">
              <span className="material-symbols-outlined text-5xl block mb-4 opacity-40">image</span>
              <p className="text-lg">Gallery coming soon. Check back after the next show!</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {gallery.map((item) => (
                <div key={item._id} className="relative group rounded-card overflow-hidden bg-brand-overlay break-inside-avoid">
                  <Image
                    src={`/api/images/${item.imageId}`}
                    alt={item.title || 'Show Moment'}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    width={800}
                    height={600}
                  />
                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-sm font-headline-sm">{item.title}</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary-container/0 group-hover:bg-primary-container/10 transition-colors duration-300"></div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* COMMUNITY PROOF */}
        <section className="py-8 md:py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-enter text-center">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-8">What the Community Says</h2>
          <div className="max-w-3xl mx-auto brutal-card p-12">
            <span className="material-symbols-outlined text-4xl text-primary-container mb-4 opacity-50">format_quote</span>
            <p className="font-body-lg text-xl md:text-2xl text-on-surface italic mb-6">"The best underground comedy scene in Ahmedabad. It feels like family here. Ekdum paisa vasool!"</p>
            <div className="font-headline-sm text-base text-primary-container">- Regular Audience Member</div>
          </div>
        </section>

        {/* COMMUNITY / PERFORM */}
        <section className="py-12 bg-brand-surface border-y border-white/5 scroll-enter glow-spotlight w-full">
          <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop text-center">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-6">Want to perform with us?</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">
              Stand-up, poetry, singing, guitar — any art form. Everyone is welcome on our stage. The stage is yours, the mic is yours. Let's create magic. Aao kabhi haveli pe.
            </p>
            <Link href="/perform-with-us" className="bg-primary-container text-brand-black font-headline-sm text-headline-sm rounded-full px-8 py-4 hover:bg-primary-container/90 transition-colors inline-flex items-center gap-2">
              Apply to Perform →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const db = await getDbSafe();
    if (!db) {
      return { props: { performers: [], gallery: [], nextShow: null }, revalidate: 60 };
    }

    // Fetch featured approved performers, sorted by displayOrder
    const performerDocs = await db.collection('users').find({
      isComedian: true,
      'comedianProfile.status': 'approved',
      'comedianProfile.isFeatured': true,
    })
      .project({
        password: 0,
        email: 0,
      })
      .sort({ 'comedianProfile.displayOrder': 1 })
      .toArray();

    // Fetch visible gallery items, sorted by displayOrder
    const galleryDocs = await db.collection('homepage_content').find({
      type: 'gallery',
      isVisible: true,
      isDeleted: false,
    })
      .sort({ displayOrder: 1 })
      .toArray();

    // Fetch next show
    const nextShowDoc = await db.collection('homepage_content').findOne({
      type: 'next_show',
      isVisible: true,
      isDeleted: { $ne: true },
    });

    // Serialize MongoDB documents (convert ObjectIds to strings)
    const performers = performerDocs.map(doc => ({
      _id: doc._id.toString(),
      username: doc.username,
      comedianProfile: {
        speciality: doc.comedianProfile?.speciality || '',
        tagline: doc.comedianProfile?.tagline || null,
        instagramUrl: doc.comedianProfile?.instagramUrl || null,
        photoId: doc.comedianProfile?.photoId?.toString() || null,
        displayOrder: doc.comedianProfile?.displayOrder || 0,
        isFeatured: doc.comedianProfile?.isFeatured || false,
      },
    }));

    const gallery = galleryDocs.map(doc => ({
      _id: doc._id.toString(),
      title: doc.title || '',
      imageId: doc.imageId?.toString() || '',
      displayOrder: doc.displayOrder || 0,
    }));

    const nextShow = nextShowDoc ? {
      _id: nextShowDoc._id.toString(),
      title: nextShowDoc.title || '',
      imageUrl: nextShowDoc.imageUrl || '',
      metadata: {
        date: nextShowDoc.metadata?.date || '',
        month: nextShowDoc.metadata?.month || '',
        day: nextShowDoc.metadata?.day || '',
        location: nextShowDoc.metadata?.location || '',
        time: nextShowDoc.metadata?.time || '',
        ticketPrice: nextShowDoc.metadata?.ticketPrice || '',
        bookMyShowUrl: nextShowDoc.metadata?.bookMyShowUrl || '',
        whatsappUrl: nextShowDoc.metadata?.whatsappUrl || '',
      }
    } : null;

    return {
      props: { performers, gallery, nextShow },
      revalidate: 60, // ISR: revalidate every 60 seconds
    };
  } catch (error) {
    console.error('getStaticProps error:', error);
    return {
      props: { performers: [], gallery: [], nextShow: null },
      revalidate: 60,
    };
  }
};
