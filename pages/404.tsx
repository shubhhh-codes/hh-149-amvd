import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Smile, Search } from 'lucide-react';

export default function Custom404() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 flex items-center justify-center p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20 
        }}
        className="text-center relative z-10 max-w-md w-full"
      >
        <motion.div 
          className="relative inline-block"
          animate={{
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.1, 0.9, 1.1, 1],
            transition: { 
              duration: 1.5, 
              repeat: Infinity,
              type: "tween",
              ease: "easeInOut"
            }
          }}
        >
          <div className="text-9xl mb-6 relative">
            <span className="absolute -top-2 -left-2 text-purple-200 opacity-50 blur-md">4</span>
            <span className="relative z-10">4</span>
            <span className="absolute -top-2 -right-2 text-purple-200 opacity-50 blur-md">4</span>
          </div>
          <Smile 
            size={120} 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-300 opacity-30" 
            strokeWidth={1}
          />
        </motion.div>

        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Looks like you've wandered into the digital comedy club. 
          This page seems to have taken an unexpected intermission!
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-all duration-300 group"
          >
            <Home 
              size={20} 
              className="group-hover:animate-bounce"
            />
            Return Home
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 border border-purple-600 text-purple-600 px-6 py-3 rounded-full hover:bg-purple-50 transition-all duration-300 group"
          >
            <Search 
              size={20} 
              className="group-hover:animate-pulse"
            />
            Previous Page
          </button>
        </div>
      </motion.div>

      {/* Decorative Background Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: [0.1, 0.2, 0.1],
          scale: [0.5, 0.7, 0.5]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: [0.1, 0.2, 0.1],
          scale: [0.5, 0.7, 0.5]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2.5
        }}
        className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20"
      />
    </div>
  );
}