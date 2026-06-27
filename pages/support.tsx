import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function SupportPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [supportConfig, setSupportConfig] = useState<any>(null);
  const [faqs, setFaqs] = useState<any[]>([]);

  useEffect(() => {
    // Fetch CMS settings for dynamic WhatsApp links
    fetch('/api/cms/footer')
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          setSupportConfig(data.content.metadata);
        }
      })
      .catch(err => console.error('Failed to load support settings:', err));

    // Fetch dynamic FAQs
    fetch('/api/cms/faq')
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          setFaqs(data.content);
        }
      })
      .catch(err => console.error('Failed to load FAQs:', err));
  }, []);

  const whatsappUrl = supportConfig?.whatsappUrl || '#';

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const renderAnswerText = (text: string) => {
    if (!text) return null;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <Link key={match.index} href={match[2]} className="text-[#ff6b1a] hover:underline">
          {match[1]}
        </Link>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <>
      <Head>
        <title>The Humours Hub</title>
        <meta name="description" content="Find answers to common questions about The Humours Hub shows, tickets, and venue." />
      </Head>

      <Navbar />

      <div className="bg-[#0A0A0A] text-[#e5e2e1] font-body min-h-screen flex flex-col pt-20 overflow-x-hidden w-full">
        <style dangerouslySetInnerHTML={{ __html: `
          .surface-card {
              background-color: #141414;
          }
          .accordion-content {
              transition: max-height 0.3s ease-out, opacity 0.3s ease-out, padding 0.3s ease-out;
              max-height: 0;
              opacity: 0;
              overflow: hidden;
              padding-top: 0;
              padding-bottom: 0;
          }
          .accordion-item.active .accordion-content {
              max-height: 500px;
              opacity: 1;
              padding-top: 1rem;
              padding-bottom: 1rem;
          }
          .accordion-item.active .accordion-icon {
              transform: rotate(180deg);
          }
          .animate-fade-in-up {
              opacity: 0;
              transform: translateY(20px);
              animation: fadeInUp 0.6s ease-out forwards;
          }
          @keyframes fadeInUp {
              to {
                  opacity: 1;
                  transform: translateY(0);
              }
          }
          .delay-100 { animation-delay: 100ms; }
          .delay-200 { animation-delay: 200ms; }
          .delay-300 { animation-delay: 300ms; }
          
          @keyframes slowPulse {
              0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
              50% { opacity: 0.8; transform: translateX(-50%) scale(1.1); }
          }
          .animate-slow-pulse {
              animation: slowPulse 8s ease-in-out infinite;
          }
        `}} />

        <main className="flex-grow relative">
          {/* Smooth Ambient Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(255,107,26,0.08)_0%,_rgba(10,10,10,0)_70%)] pointer-events-none animate-slow-pulse z-0"></div>

          {/* Hero Section */}
          <section className="pt-24 pb-12 px-6 relative flex flex-col items-center text-center z-10">
            
            <div className="max-w-3xl mx-auto relative z-10">
              <span className="font-headline font-bold text-xs tracking-[0.1em] text-[#ff6b1a] uppercase animate-fade-in-up">SUPPORT</span>
              <h1 className="font-headline font-bold text-4xl md:text-6xl lg:text-7xl text-[#e5e2e1] mt-4 mb-6 animate-fade-in-up delay-100 tracking-tight">How can we help?</h1>
              <p className="font-body text-base md:text-lg text-[rgba(229,226,225,0.7)] max-w-xl mx-auto animate-fade-in-up delay-200">
                Find answers to common questions below. Still stuck? We're one WhatsApp message away.
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-20 px-6 max-w-3xl mx-auto w-full">
            <h2 className="font-headline font-bold text-xs tracking-[0.1em] text-[#ff6b1a] uppercase mb-8">COMMON QUESTIONS</h2>
            <div className="space-y-4" id="faq-container">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className={`accordion-item surface-card border border-white/5 rounded overflow-hidden cursor-pointer transition-colors hover:border-white/10 group relative pl-1 ${activeFaq === index ? 'active' : ''}`}
                  onClick={() => toggleFaq(index)}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff6b1a] opacity-0 group-[.active]:opacity-100 transition-opacity"></div>
                  <div className="px-6 py-5 flex justify-between items-center accordion-header">
                    <h3 className="font-headline font-semibold text-lg text-[#e5e2e1] pr-4">{faq.title}</h3>
                    <span className="material-symbols-outlined text-[rgba(229,226,225,0.45)] transition-transform duration-300 accordion-icon group-[.active]:text-[#ff6b1a]" style={{fontVariationSettings: "'FILL' 0"}}>expand_more</span>
                  </div>
                  <div className="accordion-content px-6">
                    <p className="font-body text-[rgba(229,226,225,0.45)] leading-relaxed">
                      {renderAnswerText(faq.content)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Still Need Help Band */}
          <section className="w-full surface-card py-20 px-6 border-t border-b border-white/5 text-center mt-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff6b1a]/5 via-[#0a0a0a]/0 to-[#0a0a0a]/0 pointer-events-none"></div>
            <div className="max-w-2xl mx-auto relative z-10">
              <h2 className="font-headline font-bold text-3xl text-[#e5e2e1] mb-2">Still need help?</h2>
              <p className="font-body text-[rgba(229,226,225,0.7)] mb-8">Our team is available on WhatsApp.</p>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#ff6b1a] font-headline font-bold text-lg hover:text-[#ff6b1a]/80 transition-colors group">
                Chat on WhatsApp
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{fontVariationSettings: "'FILL' 0"}}>arrow_forward</span>
              </a>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </>
  );
}
