import { GetStaticProps } from 'next';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Smile, Search } from 'lucide-react';
import clientPromise from '../lib/mongodb';

interface CMSContent {
  title?: string;
  subtitle?: string; // Used for Description Message
  content?: string; // Used for CTA Destination URL
  category?: string; // Used for CTA Button Text
  imageUrl?: string;
}

interface Custom404Props {
  cmsData: CMSContent | null;
}

export default function Custom404({ cmsData }: Custom404Props) {
  const title = cmsData?.title || 'Page Not Found';
  const description = cmsData?.subtitle || "Looks like you've wandered into the digital comedy club. This page seems to have taken an unexpected intermission!";
  const ctaText = cmsData?.category || 'Return Home';
  const ctaDestination = cmsData?.content || '/';
  const imageUrl = cmsData?.imageUrl;

  return (
    <div className="antialiased min-h-screen flex flex-col relative overflow-x-hidden bg-[#0A0A0A] text-[#e5e2e1]">
      <main className="flex-grow flex items-center justify-center relative px-margin-mobile md:px-margin-desktop py-[80px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,26,0.1)_0%,rgba(10,10,10,0)_70%)] pointer-events-none z-0"></div>
        <div className="max-w-[800px] w-full text-center relative z-10 space-y-8">
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary-container tracking-tighter" style={{ fontSize: 'clamp(120px, 20vw, 240px)', lineHeight: 1, textShadow: '0 0 40px rgba(255, 107, 26, 0.3)' }}>
            404
          </h1>
          <div className="space-y-4">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {title}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto whitespace-pre-wrap">
              {description}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Link className="bg-primary-container text-[#0A0A0A] font-headline-md text-headline-sm px-8 py-4 rounded-full hover:bg-primary transition-colors duration-300 w-full sm:w-auto flex justify-center items-center gap-2" href={ctaDestination}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              {ctaText}
            </Link>
            <button className="bg-transparent text-on-surface border border-white/20 font-headline-md text-headline-sm px-8 py-4 rounded-full hover:bg-white/5 transition-colors duration-300 w-full sm:w-auto flex justify-center items-center gap-2" onClick={() => { if (typeof window !== 'undefined') { window.history.back(); } }}>
              <span className="material-symbols-outlined">arrow_back</span>
              Previous Page
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
