import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import clientPromise from '@/lib/mongodb';

export default function GalleryPage({ galleryItems }: { galleryItems: any[] }) {
  const [activeFilter, setActiveFilter] = useState('All');
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

  // Dynamically extract filters from items or use static list
  const availableCategories = ['All', ...Array.from(new Set(galleryItems.map(item => item.category).filter(Boolean)))];

  const filteredItems = activeFilter === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeFilter);

  return (
    <>
      <Head>
        <title>The Humours Hub</title>
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
            {availableCategories.map((filter: any) => (
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
              <div key={item._id} className="gallery-card group">
                <Image
                  width={800}
                  height={600}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  src={item.imageUrl}
                  alt={item.title || "Gallery image"}
                />
                <div className="overlay"></div>
                <div className="info-slide">
                  <p className="font-label-caps text-label-caps text-primary mb-1">{item.category}</p>
                  <h3 className="font-headline-sm text-headline-sm text-white">{item.title}</h3>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-1 md:col-span-3 py-12 text-center text-on-surface-variant">
                No images found in this category.
              </div>
            )}
          </div>
        </section>

        {/* Instagram Band */}
        <section className="bg-[#141414] py-12 px-margin-mobile md:px-margin-desktop border-y border-white/5">
          <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <h2 className="font-headline-sm text-headline-sm text-on-surface text-center md:text-left">
              Were you there? Tag us on Instagram.
            </h2>
            <Link
              href={instagramUrl || 'https://instagram.com/the.humourshub'}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display-lg-mobile md:text-headline-md text-primary-container font-bold hover:scale-105 transition-transform"
            >
              {instagramUrl ? `@${instagramUrl.replace(/.*instagram\.com\//, '').replace(/\/+$/, '')}` : '@the.humourshub'}
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

export async function getStaticProps() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const content = await db.collection('homepage_content')
      .find({ type: 'gallery', isVisible: true, isDeleted: { $ne: true } })
      .sort({ displayOrder: 1, createdAt: -1 })
      .toArray();

    return {
      props: {
        galleryItems: JSON.parse(JSON.stringify(content)),
      },
      revalidate: 60, // revalidate every 60 seconds (or on-demand via API)
    };
  } catch (error) {
    console.error("Error fetching gallery content in getStaticProps:", error);
    return {
      props: {
        galleryItems: [],
      },
      revalidate: 60,
    };
  }
}
