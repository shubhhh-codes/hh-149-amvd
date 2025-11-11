/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import Ticket3D from '@/components/Ticket3D';
import { motion } from 'framer-motion';

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

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardHover = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: {
        duration: 0.2,
        type: "tween",
        ease: "easeInOut"
      }
    }
  };

  const floating = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const floatingTicket = {
    animate: {
      y: [0, -15, 0],
      rotate: [-1, 1, -1],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const glowPulse = {
    animate: {
      boxShadow: [
        "0 0 20px rgba(139, 92, 246, 0.3)",
        "0 0 40px rgba(139, 92, 246, 0.5)",
        "0 0 20px rgba(139, 92, 246, 0.3)"
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const FloatingEmojis = () => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
      setWidth(window.innerWidth);
    }, []);

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["🎭", "🎪", "🎟️", "😂", "🎉"].map((emoji, index) => (
          <motion.span
            key={index}
            initial={{ 
              opacity: 0,
              y: "100vh",
              x: Math.random() * (width || 1000) // Fallback width of 1000px
            }}
            animate={{
              opacity: [0, 1, 0],
              y: "-100vh",
              rotate: [0, 360]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              delay: index * 3,
              ease: "linear"
            }}
            className="absolute text-3xl"
          >
            {emoji}
          </motion.span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white overflow-hidden">
        <FloatingEmojis />
        <div className="absolute inset-0 bg-[url('/comedy-bg.jpg')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/30 to-purple-900/60"></div>

        <motion.div 
          initial="initial"
          animate="animate"
          variants={staggerChildren}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Text Column */}
            <div className="text-center lg:text-left space-y-6">
              <motion.span 
                variants={fadeInUp}
                className="inline-block bg-purple-700/50 rounded-full px-6 py-3 text-sm font-medium mb-6 backdrop-blur-sm border border-purple-500/20"
              >
                🎭 The Humours Hub Presents
              </motion.span>

              <motion.h1 
                variants={fadeInUp}
                className="text-6xl md:text-8xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-indigo-200 leading-tight"
              >
                Stand Up
                <br />
                Evening
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="text-xl md:text-2xl mb-12 text-purple-100 max-w-3xl mx-auto lg:mx-0 leading-relaxed"
              >
                Experience an unforgettable night of laughter and entertainment! 
                Join us for the most hilarious evening of the year. ✨
              </motion.p>

              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4"
              >
                {session ? (
                  <Link
                    href="/book-tickets"
                    className="inline-flex items-center justify-center bg-white text-purple-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-50 transform transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Book Your Tickets 🎟️
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center bg-white text-purple-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-50 transform transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Sign in to Book 🎫
                  </Link>
                )}
              </motion.div>
            </div>

            {/* Ticket Column */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex justify-center items-center relative"
            >
              {/* Background glow effect */}
              <motion.div
                variants={glowPulse}
                animate="animate"
                className="absolute inset-0 rounded-full filter blur-xl"
              />
              
              {/* Floating ticket */}
              <motion.div
                variants={floatingTicket}
                animate="animate"
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <Ticket3D />
              </motion.div>

              {/* Decorative elements */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -z-10 w-full h-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-2xl"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute left-0 right-0 bottom-0 h-32 bg-gradient-to-t from-purple-50 to-transparent"></div>
      </div>

      {/* Event Details Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[
            { icon: "🗓️", title: "Event Date", details: ["January 12, 2025", "5:00 PM Onwards"] },
            { icon: "📍", title: "Venue", details: ["Mishty Studio Campus, Brts, ", "\n 132 Feet Ring Rd, beside Kaizen Hospital, \n opp. Valinath, Saurabh Society, Naranpura, Ahmedabad"] },
            { icon: "🎫", title: "Tickets", details: ["Starting from ₹149"]}
          ].map((card, index) => (
            <motion.div
              key={index}
              initial="rest"
              whileHover="hover"
              animate="rest"
              variants={cardHover}
              className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-purple-100 transform-gpu"
            >
              <motion.div 
                variants={floating}
                animate="animate"
                className="text-4xl mb-6 bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center"
              >
                {card.icon}
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-purple-900">{card.title}</h3>
              {card.details.map((detail, i) => (
                <p key={i} className="text-gray-600">{detail}</p>
              ))}
              <motion.div 
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-4 h-1 w-full bg-gradient-to-r from-purple-500 to-pink-500 origin-left"
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white mt-24 py-24 relative overflow-hidden"
      >
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-[url('/pattern.png')] opacity-10"
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">
              Ready for a Night of Laughter? 🎉
            </h2>
            <p className="text-xl mb-12 text-purple-200">Don't miss out on this amazing comedy event. Book your tickets now and be part of the fun!</p>
            {session ? (
              <Link
                href="/book-tickets"
                className="group relative inline-flex items-center justify-center bg-white text-purple-700 px-12 py-6 rounded-full font-bold text-xl hover:bg-purple-50 transform transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
              >
                <motion.span
                  initial={{ x: 0 }}
                  whileHover={{ x: -10 }}
                  className="relative z-10"
                >
                  Reserve Your Spot
                </motion.span>
                <motion.span
                  initial={{ x: -10, opacity: 0 }}
                  whileHover={{ x: 10, opacity: 1 }}
                  className="absolute right-8"
                >
                  →
                </motion.span>
                <motion.div
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-purple-100 to-purple-50 z-0"
                />
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center bg-white text-purple-700 px-12 py-6 rounded-full font-bold text-xl hover:bg-purple-50 transform transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Sign in to Book →
              </Link>
            )}
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}
