import { motion } from 'framer-motion';
import { 
  Instagram, 
  Mail, 
  Ticket, 
  Mic, 
  BarChart, 
  ScrollText, 
  Calendar 
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import Link from 'next/link';

export default function Footer() {
  const socialLinks = [
    {
      icon: Instagram,
      href: "https://www.instagram.com/the.humourshub",
      label: "Follow on Instagram",
      color: "text-pink-500"
    },
    {
      icon: FaWhatsapp,
      href: "https://chat.whatsapp.com/JrExMaZiT6F2LmylOuU8NL",
      label: "Contact on WhatsApp",
      color: "text-green-500"
    }
  ];

  const quickLinks = [
    { 
      icon: Ticket, 
      href: "/book-tickets", 
      label: "Book Tickets" 
    },
    { 
      icon: Mic, 
      href: "/book-tickets?type=comedian", 
      label: "Join as Comedian" 
    },
    { 
      icon: BarChart, 
      href: "/dashboard", 
      label: "Dashboard" 
    },
    { 
      icon: ScrollText, 
      href: "/policies", 
      label: "Terms & Policies" 
    }
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden">
      {/* Subtle Background Decorations */}
      <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10">
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full -top-32 -left-32 blur-3xl"></div>
        <div className="absolute w-96 h-96 bg-pink-500 rounded-full -bottom-32 -right-32 blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* About Section */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="text-purple-400" />
              About Us
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Humors Hub brings you the best comedy entertainment in Junagadh. 
              Join us for unforgettable nights of laughter, connection, and pure joy!
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <ScrollText className="text-purple-400" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href} 
                    className="group flex items-center gap-3 text-gray-300 hover:text-white transition-all duration-300"
                  >
                    <link.icon 
                      className="text-purple-400 group-hover:text-purple-300 transition-colors" 
                      size={20} 
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Section */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Mail className="text-purple-400" />
              Contact Us
            </h3>
            <ul className="space-y-3">
              {socialLinks.map((social, index) => (
                <li key={index}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 text-gray-300 hover:text-white transition-all duration-300"
                  >
                    <social.icon 
                      className={`${social.color} group-hover:scale-110 transition-transform`} 
                      size={20} 
                    />
                    {social.label}
                  </a>
                </li>
              ))}
              <li className="flex items-center gap-3 text-gray-300">
                <Mail className="text-purple-400" size={20} />
                shubhammvaghela999@gmail.com
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Footer Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-t border-gray-800 mt-12 pt-8 text-center"
        >
          <p className="text-gray-400 flex items-center justify-center gap-2">
            {new Date().getFullYear()} Humors Hub. 
            All rights reserved. 
            <span className="text-red-400">❤️</span>
          </p>
        </motion.div>
      </motion.div>
    </footer>
  );
}
