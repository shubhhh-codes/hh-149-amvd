import { useState } from 'react';
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

  const navLinks = [
    { 
      href: "/", 
      label: "Home", 
      icon: Home,
      requireAuth: false 
    },
    { 
      href: "/book-tickets", 
      label: "Book Tickets", 
      icon: Ticket,
      requireAuth: false 
    },
    { 
      href: "/dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      requireAuth: true 
    }
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-3 group"
            >
              <motion.div 
                whileHover={{ 
                  rotate: [0, 10, -10, 10, 0],
                  scale: 1.1 
                }}
                className="text-2xl"
              >
                🎭
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-purple-900 transition-all">
                Humors Hub
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:justify-between md:flex-1 md:ml-10">
            <div className="flex space-x-6">
              {navLinks.map((link) => (
                (!link.requireAuth || session) && (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors group"
                  >
                    <link.icon 
                      size={18} 
                      className="text-gray-400 group-hover:text-purple-500 transition-colors" 
                    />
                    {link.label}
                  </Link>
                )
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-4">
                  {session.user?.email === 'admin@humorshub.com' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors group"
                    >
                      <ShieldCheck 
                        size={18} 
                        className="text-gray-400 group-hover:text-purple-500 transition-colors" 
                      />
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors group"
                  >
                    <UserCircle 
                      size={18} 
                      className="text-gray-400 group-hover:text-purple-500 transition-colors" 
                    />
                    Profile
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => signOut()}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors group"
                  >
                    <LogOut 
                      size={18} 
                      className="group-hover:animate-pulse" 
                    />
                    Logout
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-2 text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors group"
                  >
                    <LogIn 
                      size={18} 
                      className="text-gray-400 group-hover:text-purple-500 transition-colors" 
                    />
                    Login
                  </Link>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/auth/signup"
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors group"
                    >
                      <UserPlus 
                        size={18} 
                        className="group-hover:animate-bounce" 
                      />
                      Sign Up
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-purple-600 hover:bg-purple-50 focus:outline-none transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t"
          >
            <div className="px-4 py-2 space-y-1">
              {navLinks.map((link) => (
                (!link.requireAuth || session) && (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-4 py-2 text-base font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors group"
                    onClick={toggleMenu}
                  >
                    <link.icon 
                      size={20} 
                      className="text-gray-400 group-hover:text-purple-500 transition-colors" 
                    />
                    {link.label}
                  </Link>
                )
              ))}

              {session ? (
                <>
                  {session.user?.email === 'admin@humourshub.com' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2 text-base font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors group"
                      onClick={toggleMenu}
                    >
                      <ShieldCheck 
                        size={20} 
                        className="text-gray-400 group-hover:text-purple-500 transition-colors" 
                      />
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-base font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors group"
                    onClick={toggleMenu}
                  >
                    <UserCircle 
                      size={20} 
                      className="text-gray-400 group-hover:text-purple-500 transition-colors" 
                    />
                    Profile
                  </Link>
                  <div className="pt-4 mt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        signOut();
                        toggleMenu();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut 
                        size={20} 
                        className="text-red-400 group-hover:text-red-500 transition-colors" 
                      />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-4 mt-2 border-t border-gray-100 space-y-1">
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-3 px-4 py-2 text-base font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors group"
                    onClick={toggleMenu}
                  >
                    <LogIn 
                      size={20} 
                      className="text-gray-400 group-hover:text-purple-500 transition-colors" 
                    />
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex items-center gap-3 px-4 py-2 text-base font-medium bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors group"
                    onClick={toggleMenu}
                  >
                    <UserPlus 
                      size={20} 
                      className="text-white group-hover:animate-bounce" 
                    />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}