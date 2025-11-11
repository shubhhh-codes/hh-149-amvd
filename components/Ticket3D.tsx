import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Ticket3D() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative w-64 h-96 perspective-1000"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-3xl p-1"
        animate={{
          rotateY: isHovered ? 180 : 0,
          z: isHovered ? 50 : 0
        }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-white rounded-3xl h-full w-full p-6 flex flex-col items-center justify-between">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-purple-900">VIP TICKET</h3>
            <p className="text-purple-600">Stand Up Evening</p>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-purple-900">₹149</span>
            <span className="text-sm text-purple-600">Early Bird Special</span>
          </div>

          <div className="w-full border-t border-dashed border-purple-200 py-4">
            <div className="flex justify-between text-sm text-purple-600">
              <span>Date</span>
              <span>23 Nov, 2025</span>
            </div>
            <div className="flex justify-between text-sm text-purple-600 mt-2">
              <span>Time</span>
              <span>5:00 PM</span>
            </div>
          </div>

          <div className="w-full h-12 relative">
            <div className="absolute -left-7 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-purple-100 rounded-full"></div>
            <div className="absolute -right-7 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-purple-100 rounded-full"></div>
            <div className="border-t border-dashed border-purple-200 w-full absolute top-1/2 transform -translate-y-1/2"></div>
          </div>

          <div className="text-center">
            <span className="text-xs text-purple-600">#TICKET-001</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
