/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Avatar from './Avatar';

export default function Profile() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const memberSince = session.user.createdAt 
    ? new Date(session.user.createdAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto"
    >
      <div className="flex items-center space-x-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Avatar
            src={session.user.image || undefined}
            name={session.user.name || session.user.email?.split('@')[0] || 'User'}
            size="lg"
          />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {session.user.name || session.user.email?.split('@')[0]}
          </h2>
          <p className="text-gray-600">{session.user.email}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-gray-900">{session.user.name || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{session.user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Member Since</label>
            <p className="mt-1 text-gray-900">
              {memberSince}
            </p>
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-6 w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors duration-200"
      >
        Edit Profile
      </motion.button>
    </motion.div>
  );
} 