import Head from 'next/head';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'On Stage', 'The Crowd', 'After The Show'];

  // Mock data mimicking the HTML grid
  const galleryItems = [
    {
      id: 1,
      category: 'On Stage',
      src: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&q=80&w=800&h=1000",
      alt: "A moody, high-contrast photograph...",
      label: "Comedy Night",
      title: "Laughter Therapy",
      date: "Oct 12, 2023"
    },
    {
      id: 2,
      category: 'The Crowd',
      src: "https://images.unsplash.com/photo-1529156069898-49953eb1b5ce?auto=format&fit=crop&q=80&w=800&h=1000",
      alt: "A wide-angle shot...",
      label: "The Crowd",
      title: "Full House Vibing",
      date: "Oct 12, 2023"
    },
    {
      id: 3,
      category: 'On Stage',
      src: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=800&h=1000",
      alt: "Close-up of a musician's hands...",
      label: "Unplugged Sessions",
      title: "Strings & Stories",
      date: "Oct 15, 2023"
    },
    {
      id: 4,
      category: 'After The Show',
      src: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800&h=1000",
      alt: "A backstage candid shot...",
      label: "Backstage",
      title: "Pre-Show Nerves",
      date: "Oct 20, 2023"
    },
    {
      id: 5,
      category: 'On Stage',
      src: "https://images.unsplash.com/photo-1478147424095-2c81fb395066?auto=format&fit=crop&q=80&w=800&h=1000",
      alt: "An artistic shot of a microphone...",
      label: "Open Mic",
      title: "Voice of the City",
      date: "Oct 22, 2023"
    },
    {
      id: 6,
      category: 'After The Show',
      src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800&h=1000",
      alt: "Candid street photography...",
      label: "After The Show",
      title: "The Post-Show Buzz",
      date: "Nov 01, 2023"
    },
    {
      id: 7,
      category: 'On Stage',
      src: "https://images.unsplash.com/photo-1516280440502-65f606822c1d?auto=format&fit=crop&q=80&w=800&h=1000",
      alt: "A dynamic shot of a poet...",
      label: "Poetry Slam",
      title: "Rhythm & Rhyme",
      date: "Nov 05, 2023"
    },
    {
      id: 8,
      category: 'On Stage',
      src: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800&h=1000",
      alt: "A long exposure shot of the audience...",
      label: "Special Events",
      title: "A Thousand Lights",
      date: "Nov 10, 2023"
    },
    {
      id: 9,
      category: 'After The Show',
      src: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800&h=1000",
      alt: "A high-angle shot looking down at the stage...",
      label: "Setup",
      title: "Soundcheck Ready",
      date: "Nov 12, 2023"
    }
  ];

  const filteredItems = activeFilter === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeFilter);

  return (
    <>
      <Head>
        <title>Gallery | The Humours Hub</title>
        <meta name="description" content="Gallery of real nights and real crowds at The Humours Hub." />
      </Head>

      <Navbar />

      <main className="bg-[#0A0A0A] min-h-screen text-[#e5e2e1] overflow-x-hidden font-body-md">
        
        <style jsx>{`
          .masonry-grid {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 24px;
          }
          @media (min-width: 768px) {
            .masonry-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          .gallery-card {
            position: relative;
            overflow: hidden;
            background-color: #141414;
            border: 1px solid rgba(255, 255, 255, 0.07);
            aspect-ratio: 4/5;
            transition: all 0.3s ease;
          }
          .gallery-card .overlay {
            position: absolute;
            inset: 0;
            background: #ff6b1a;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .gallery-card:hover .overlay {
            opacity: 0.3;
          }
          .gallery-card .info-slide {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
            padding: 24px;
            transform: translateY(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .gallery-card:hover .info-slide {
            transform: translateY(0);
          }
          .spotlight-glow {
            background: radial-gradient(circle at center, rgba(255, 107, 26, 0.08) 0%, transparent 70%);
          }
        `}</style>

        {/* Hero Section */}
        <section className="relative pt-32 pb-12 px-margin-mobile md:px-margin-desktop bg-[#0A0A0A] overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full spotlight-glow pointer-events-none"></div>
          <div className="max-w-container-max mx-auto relative z-10">
            <h1 className="font-display-lg-mobile md:text-display-lg md:font-display-lg text-on-surface mb-4">
              Real nights. Real crowd.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              Every show leaves something behind — a laugh, a poem, a chord. Here's proof.
            </p>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="py-8 px-margin-mobile md:px-margin-desktop">
          <div className="max-w-container-max mx-auto flex flex-wrap gap-4">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-8 py-2 rounded-full font-label-caps text-label-caps transition-all ${
                  activeFilter === filter
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-[#141414] border border-white/10 text-on-surface hover:border-primary'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        {/* Masonry Photo Grid */}
        <section className="pb-24 px-margin-mobile md:px-margin-desktop">
          <div className="max-w-container-max mx-auto masonry-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="gallery-card group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  src={item.src}
                  alt={item.alt}
                />
                <div className="overlay"></div>
                <div className="info-slide">
                  <p className="font-label-caps text-label-caps text-primary mb-1">{item.label}</p>
                  <h3 className="font-headline-sm text-headline-sm text-white">{item.title}</h3>
                  <p className="text-sm text-white/60 font-body-md">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Instagram Band */}
        <section className="bg-[#141414] py-12 px-margin-mobile md:px-margin-desktop border-y border-white/5">
          <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <h2 className="font-headline-sm text-headline-sm text-on-surface text-center md:text-left">
              Were you there? Tag us on Instagram.
            </h2>
            <Link
              href="https://instagram.com/thehumourshub"
              target="_blank"
              rel="noopener noreferrer"
              className="font-display-lg-mobile md:text-headline-md text-primary-container font-bold hover:scale-105 transition-transform"
            >
              @thehumourshub
            </Link>
          </div>
        </section>

      </main>

      <Footer />
      
      {/* Mobile Bottom Bar Placeholder */}
      <div className="fixed bottom-0 w-full z-50 flex md:hidden bg-primary-container shadow-2xl">
        <Link href="/book-tickets" className="flex items-center justify-center gap-2 bg-primary text-on-primary w-full py-4 font-label-caps text-label-caps">
          <span className="material-symbols-outlined">confirmation_number</span>
          Book Tickets
        </Link>
      </div>

    </>
  );
}
