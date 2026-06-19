import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Ticket, 
  LayoutDashboard, 
  UserCircle, 
  LogOut, 
  LogIn, 
  UserPlus, 
  ShieldCheck,
  Menu,
  X 
} from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
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
    { href: "/", label: "Shows", requireAuth: false },
    { href: "#", label: "Gallery", requireAuth: false },
    { href: "#", label: "About", requireAuth: false },
    { href: "#", label: "Perform With Us", requireAuth: false },
  ];

  return (
    <>
      <nav 
        className={`bg-surface/95 dark:bg-surface/95 backdrop-blur-md font-headline-sm text-headline-sm font-label-caps text-label-caps docked full-width top-0 sticky border-b border-white/10 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 w-full max-w-container-max mx-auto z-50 transition-transform duration-300 ease-in-out ${isNavHidden ? 'nav-hidden' : ''}`} 
        id="topNav"
      >
        <Link href="/" className="font-headline-sm text-headline-sm font-bold text-on-surface dark:text-on-surface group flex items-center space-x-2">
            <motion.div 
              whileHover={{ rotate: [0, 10, -10, 10, 0], scale: 1.1 }}
              className="text-2xl inline-block"
            >
              🎭
            </motion.div>
            <span>The Humours Hub</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            (!link.requireAuth || session) && (
              <Link
                key={link.label}
                href={link.href}
                className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors transition-all duration-300"
              >
                {link.label}
              </Link>
            )
          ))}

          <div className="flex items-center gap-4 border-l border-white/10 pl-6 ml-2">
              {session ? (
                <>
                  {session.user?.email === 'admin@humorshub.com' && (
                    <Link href="/admin" className="text-on-surface-variant hover:text-primary transition-colors">Admin</Link>
                  )}
                  <Link href="/profile" className="text-on-surface-variant hover:text-primary transition-colors">Profile</Link>
                  <button onClick={() => signOut()} className="text-error hover:text-error-container transition-colors">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-on-surface-variant hover:text-primary transition-colors">Login</Link>
                  <Link href="/auth/signup" className="text-on-surface-variant hover:text-primary transition-colors">Sign Up</Link>
                </>
              )}
          </div>
        </div>
        
        <Link href="/book-tickets" className="bg-primary-container text-brand-black font-label-caps text-label-caps px-6 py-3 rounded-full hover:bg-primary-container/90 transition-colors hidden md:block">
          Book Tickets →
        </Link>
        
        <button className="md:hidden text-on-surface" onClick={toggleMenu}>
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>
            {isMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-brand-surface border-b border-white/10 fixed top-[73px] w-full z-40 px-margin-mobile py-4 shadow-xl"
          >
            <div className="flex flex-col space-y-4">
               {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-on-surface-variant hover:text-primary text-lg"
                    onClick={toggleMenu}
                  >
                    {link.label}
                  </Link>
               ))}
               <hr className="border-white/10 my-2" />
               {session ? (
                <>
                  {session.user?.email === 'admin@humorshub.com' && (
                    <Link href="/admin" className="text-on-surface-variant hover:text-primary text-lg" onClick={toggleMenu}>Admin</Link>
                  )}
                  <Link href="/profile" className="text-on-surface-variant hover:text-primary text-lg" onClick={toggleMenu}>Profile</Link>
                  <button onClick={() => { signOut(); toggleMenu(); }} className="text-error hover:text-error-container text-lg text-left">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-on-surface-variant hover:text-primary text-lg" onClick={toggleMenu}>Login</Link>
                  <Link href="/auth/signup" className="text-on-surface-variant hover:text-primary text-lg" onClick={toggleMenu}>Sign Up</Link>
                </>
              )}
              <Link href="/book-tickets" className="bg-primary-container text-brand-black font-label-caps text-center text-label-caps px-6 py-3 rounded-full mt-4" onClick={toggleMenu}>
                Book Tickets →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}