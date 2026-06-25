import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        setIsNavHidden(true);
      } else {
        setIsNavHidden(false);
      }
      setLastScrollTop(scrollTop <= 0 ? 0 : scrollTop);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollTop]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { href: "/shows", label: "Shows" },
    { href: "/gallery", label: "Gallery" },
    { href: "/about", label: "About" },
    { href: "/perform-with-us", label: "Perform With Us" },
    { href: "/contact", label: "Contact" },
    { href: "/support", label: "Support" },
  ];

  return (
    <>
      <nav 
        className={`bg-[#0A0A0A]/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md docked full-width top-0 sticky border-b border-white/10 w-full z-50 transition-all duration-300 ease-in-out ${isNavHidden ? 'nav-hidden' : ''}`} 
        id="topNav"
      >
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-3.5 flex justify-between items-center w-full">
          <Link href="/" className="font-headline-sm text-headline-sm font-bold text-on-surface dark:text-on-surface group flex items-center space-x-2">
              <span className="group-hover:text-primary-container transition-colors">The Humours Hub</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 lg:gap-8 font-label-caps text-label-caps tracking-widest text-[10px] lg:text-xs uppercase font-bold">
            <Link href="/shows" className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary-container transition-colors duration-300">Shows</Link>
            <Link href="/gallery" className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary-container transition-colors duration-300">Gallery</Link>
            <Link href="/perform-with-us" className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary-container transition-colors duration-300">Perform</Link>
            
            <div className="relative group py-2">
              <span className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary-container transition-colors duration-300 cursor-pointer flex items-center gap-1">
                More <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </span>
              <div className="absolute top-full left-0 mt-0 w-48 bg-[#141414] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col py-2">
                <Link href="/about" className="px-4 py-2 hover:bg-white/5 text-on-surface-variant hover:text-white transition-colors">About</Link>
                <Link href="/contact" className="px-4 py-2 hover:bg-white/5 text-on-surface-variant hover:text-white transition-colors">Contact</Link>
                <Link href="/support" className="px-4 py-2 hover:bg-white/5 text-on-surface-variant hover:text-white transition-colors">Support</Link>
              </div>
            </div>
  
            <div className="flex items-center gap-6 border-l border-white/10 pl-6 ml-2 lg:ml-4">
              <Link href="/retrieve-tickets" className="text-on-surface-variant hover:text-primary-container transition-colors duration-300">My Tickets</Link>
            </div>
          </div>
          
          <Link href="/book-tickets" className="bg-primary-container text-brand-black font-label-caps text-label-caps px-5 py-2.5 rounded-full hover:brightness-110 active:scale-95 transition-all hidden md:block">
            Book Tickets →
          </Link>
          
          <button className="md:hidden text-on-surface" onClick={toggleMenu}>
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>
              {isMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>
  
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 fixed top-[57px] w-full z-40 px-margin-mobile py-5 shadow-xl font-label-caps text-label-caps tracking-widest text-xs uppercase"
          >
            <div className="flex flex-col space-y-4">
               {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-on-surface-variant hover:text-primary-container transition-colors"
                    onClick={toggleMenu}
                  >
                    {link.label}
                  </Link>
               ))}
               <hr className="border-white/10 my-2" />
               <Link href="/retrieve-tickets" className="text-on-surface-variant hover:text-primary-container transition-colors" onClick={toggleMenu}>My Tickets</Link>
               <Link href="/book-tickets" className="bg-primary-container text-brand-black text-center font-label-caps text-label-caps px-5 py-3 rounded-full mt-4 hover:brightness-110 transition-all" onClick={toggleMenu}>
                 Book Tickets →
               </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}