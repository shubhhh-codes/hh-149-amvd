import React from 'react';
/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */
import { motion } from 'framer-motion';

export default function LoadingSpinner() {
  return (
    <div 
      className="min-h-[60vh] flex items-center justify-center"
      role="status"
      aria-label="Loading content..."
    >
      <div className="relative w-14 h-14 flex items-center justify-center">
        {/* Outer glowing track */}
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border-4 border-[#FF6B1A]/10"
        />
        
        {/* Inner spinning ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FF6B1A] border-r-[#FF6B1A]/50 motion-reduce:animate-pulse motion-reduce:rotate-0"
        />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}