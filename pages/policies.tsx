/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */

import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function Policies() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      <Navbar />
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-4 py-12"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
          <motion.h1 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-4xl font-bold text-center text-purple-800 mb-8"
          >
            Terms and Policies
          </motion.h1>

          <div className="space-y-12">
            {/* Terms of Service Section */}
            <section className="bg-purple-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
                <span className="bg-purple-200 p-2 rounded-lg mr-3">📜</span>
                Terms of Service
              </h2>
              <div className="prose prose-purple max-w-none text-gray-700 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-purple-600 mb-2">Overview</h3>
                  <p>
                    This website is operated by The Humors Hub. Throughout the site, the terms "we", "us" and "our" refer to The Humors Hub. 
                    The Humors Hub offers this website, including all information, tools and services available from this site to you, the user, 
                    conditioned upon your acceptance of all terms, conditions, policies and notices stated here.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-purple-600 mb-2">1. Online Store Terms</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>By agreeing to these Terms of Service, you represent that you are at least 18 years of age.</li>
                    <li>You may not use our products for any illegal or unauthorized purpose.</li>
                    <li>You must not transmit any malicious code or viruses.</li>
                    <li>A breach of any of the Terms will result in immediate termination of your Services.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-purple-600 mb-2">2. General Conditions</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>We reserve the right to refuse service to anyone for any reason.</li>
                    <li>Your content may be transferred unencrypted and may be altered to conform to technical requirements.</li>
                    <li>You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-purple-600 mb-2">3. Pricing and Payment</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>All prices are subject to change without notice.</li>
                    <li>Payments are processed securely through our payment providers.</li>
                    <li>We reserve the right to refuse or cancel any orders at our discretion.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-purple-600 mb-2">4. Governing Law</h3>
                  <p>
                    These Terms of Service shall be governed by and construed in accordance with the laws of India, 
                    and jurisdiction of Gujarat, India.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-purple-600 mb-2">5. Changes to Terms</h3>
                  <p>
                    We reserve the right to update, change or replace any part of these Terms of Service at any time. 
                    It is your responsibility to check this page periodically for changes.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-purple-600 mb-2">6. Comedy Content Disclaimer</h3>
                  <p>
                    All comedy content presented on our platform is intended solely for entertainment purposes. By accessing our services, you acknowledge and agree that:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Comedy performances may include jokes, satire, and humorous content that should not be taken literally or personally.</li>
                    <li>The content is meant for mature audiences who understand the nature of comedy entertainment.</li>
                    <li>Views expressed during comedy performances do not represent the official views of The Humors Hub.</li>
                    <li>Attendees acknowledge that comedy is subjective and agree to maintain a respectful environment.</li>
                    <li>Attendees must respect the privacy of performers and other audience members. Recording, photographing, or making public comments about performers or other attendees without consent is strictly prohibited.</li>
                    <li>Any form of harassment, including unwanted comments or personal remarks about performers or other attendees, will not be tolerated.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Privacy Policy Section */}
            <section className="bg-purple-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
                <span className="bg-purple-200 p-2 rounded-lg mr-3">🔒</span>
                Privacy Policy
              </h2>
              <div className="prose prose-purple max-w-none">
                <p className="text-gray-700">
                  We are committed to protecting your privacy. Here's how we handle your information:
                </p>
                <ul className="list-disc pl-5 mt-4 space-y-2 text-gray-700">
                  <li>We collect only necessary personal information for bookings and account management.</li>
                  <li>Your data is securely stored and never shared with unauthorized third parties.</li>
                  <li>We use cookies to enhance your browsing experience.</li>
                  <li>You can request access to or deletion of your personal data at any time.</li>
                  <li>We maintain industry-standard security measures to protect your information.</li>
                </ul>
              </div>
            </section>

            {/* Refund Policy Section */}
<section className="bg-purple-50 rounded-xl p-6">
  <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
    <span className="bg-purple-200 p-2 rounded-lg mr-3">💰</span>
    Refund Policy
  </h2>
  <div className="prose prose-purple max-w-none text-gray-700 space-y-6">
    <div>
      <h3 className="text-xl font-semibold text-purple-600 mb-2">Event Ticket Refunds</h3>
      <p>
        Once you purchase a ticket, it is <strong>non-refundable and non-transferable</strong>.
        Please double-check your booking details before confirming your purchase.
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li>No refunds will be issued for any reason including change of plans or no-shows.</li>
        <li>Tickets cannot be transferred, exchanged, or resold once booked.</li>
        <li>In the rare case an event is cancelled by <strong>The Humors Hub</strong>, 
            a full refund will be processed automatically to the original payment method.</li>
      </ul>
    </div>

    <div className="bg-purple-50 p-4 rounded-lg mt-4">
      <p className="font-semibold">Note:</p>
      <p>
        By purchasing a ticket, you agree to this non-refundable and non-transferable policy.
        Please ensure all booking information is correct before completing your purchase.
      </p>
    </div>
  </div>
</section>

            {/* Contact Information */}
            <section className="bg-purple-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
                <span className="bg-purple-200 p-2 rounded-lg mr-3">📞</span>
                Contact Information
              </h2>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <p className="text-gray-700">
                  For any questions about these Terms of Service or any other policies, please contact us:
                </p>
                <div className="mt-4 space-y-2 text-gray-700">
                  <p><strong>Business Name:</strong> The Humors Hub</p>
                  <p><strong>Address:</strong> Junagadh , Gujrat, India</p>
                  <p><strong>Email:</strong> <a href="mailto:shubhammvaghela999@gmail.com" className="text-purple-600 hover:text-purple-800">shubhammvaghela999@gmail.com</a></p>
                  <p><strong>WhatsApp:</strong> <a href="https://chat.whatsapp.com/JrExMaZiT6F2LmylOuU8NL" className="text-purple-600 hover:text-purple-800" target="_blank" rel="noopener noreferrer">Join our Community</a></p>
                </div>
              </div>
            </section>

            {/* Back Button and Credit Line */}
            <div className="space-y-6">
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.back()}
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200 shadow-md hover:shadow-lg font-semibold"
                >
                  Back to Previous Page
                </motion.button>
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-gray-600 pt-4 border-t border-purple-100"
              >
                <p className="text-sm font-medium">
                  This business is proudly managed by{' '}
                  <span className="text-purple-600 font-semibold">
                    Shubham vaghela
                  </span>
                </p>
                <a 
                  href="https://github.com/shubhhhwarrior" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors mt-1"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Github.com/shubhhhwarrior
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.main>
      <Footer />
    </div>
  );
}
