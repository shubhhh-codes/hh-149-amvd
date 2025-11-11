/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiCopy, FiCalendar, FiAward, FiTrendingUp, FiMic, FiLock, FiKey, FiLoader } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface UserProfile {
  _id: string;
  userId: string;
  username: string;
  email: string;
  phone?: string;
  bio?: string;
  role: string;
  createdAt: string;
  isComedian?: boolean;
  comedianProfile?: {
    comedianType: string;
    speciality: string;
    experience: string;
    bio: string;
    status: 'pending' | 'approved' | 'declined';
  };
}

const getAvatarUrl = (userId: string) => {
  return `https://api.dicebear.com/7.x/personas/png?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`;
};

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    approved: 0,
    pending: 0
  });
  const [editForm, setEditForm] = useState({
    username: '',
    phone: '',
    bio: ''
  });

  // Add new state for password change
  const [passwordChangeForm, setPasswordChangeForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchProfile();
  }, [session, status, router]);

  useEffect(() => {
    const fetchBookingStats = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(`/api/bookings/user?email=${session.user.email}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch bookings');
        }

        // Calculate stats
        const stats = data.bookings.reduce((acc: any, booking: any) => {
          acc.total++;
          if (booking.status === 'approved') acc.approved++;
          if (booking.status === 'pending') acc.pending++;
          return acc;
        }, { total: 0, approved: 0, pending: 0 });
        
        setBookingStats(stats);
      } catch (err) {
        console.error('Failed to fetch booking stats:', err);
      }
    };

    if (session?.user?.email) {
      fetchBookingStats();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/profile?email=${session?.user?.email}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfile(data.user);
      setEditForm({
        username: data.user.username,
        phone: data.user.phone || '',
        bio: data.user.bio || ''
      });
    } catch (err) {
      console.error('Fetch profile error:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session?.user?.email,
          ...editForm
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error('Failed to update profile');
    }
  };

  // Add password change handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');

    // Validate inputs
    if (passwordChangeForm.newPassword !== passwordChangeForm.confirmNewPassword) {
      setPasswordChangeError('New passwords do not match');
      return;
    }

    if (passwordChangeForm.newPassword.length < 8) {
      setPasswordChangeError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session?.user?.email,
          currentPassword: passwordChangeForm.currentPassword,
          newPassword: passwordChangeForm.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Password changed successfully');
        // Reset form
        setPasswordChangeForm({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      } else {
        setPasswordChangeError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordChangeError('An error occurred while changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('ID copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy ID');
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-12 text-white relative">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white/20 hover:bg-white/30 transition-all rounded-full p-2"
                  title="Edit Profile"
                  aria-label="Edit Profile"
                >
                  <FiEdit2 className="text-white w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center space-x-6">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="relative w-24 h-24 rounded-full border-4 border-white/30 shadow-lg overflow-hidden"
                >
                  <Image
                    src={getAvatarUrl(profile?.userId || 'default')}
                    alt={profile?.username || 'User'}
                    layout="fill"
                    objectFit="cover"
                    priority
                  />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{profile?.username}</h1>
                  <div className="flex items-center text-white/80">
                    <FiCalendar className="mr-2" />
                    <span>Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-8">
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      id="username"
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      id="phone"
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      id="bio"
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      rows={4}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Tell us about yourself"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <FiSave className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                      <div className="space-y-4 bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center">
                          <FiUser className="w-5 h-5 text-purple-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Username</p>
                            <p className="font-medium text-gray-900">{profile?.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <FiMail className="w-5 h-5 text-purple-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{profile?.email}</p>
                          </div>
                        </div>
                        {profile?.phone && (
                          <div className="flex items-center">
                            <FiPhone className="w-5 h-5 text-purple-600 mr-3" />
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <p className="font-medium text-gray-900">{profile.phone}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {profile?.bio && (
                      <div className="bg-purple-50 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-purple-900 mb-2">Bio</h3>
                        <p className="text-gray-700">{profile.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Stats and Additional Info */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
                      <h3 className="text-lg font-semibold mb-4">Booking Statistics</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="bg-white/10 rounded-lg p-3">
                            <FiTrendingUp className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-sm opacity-80">Total</p>
                            <p className="text-xl font-bold">{bookingStats.total}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="bg-white/10 rounded-lg p-3">
                            <FiAward className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-sm opacity-80">Approved</p>
                            <p className="text-xl font-bold">{bookingStats.approved}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="bg-white/10 rounded-lg p-3">
                            <FiCalendar className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-sm opacity-80">Pending</p>
                            <p className="text-xl font-bold">{bookingStats.pending}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {profile?.isComedian && profile.comedianProfile && (
                      <div className="bg-blue-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                          <FiMic className="w-5 h-5 mr-2" />
                          Comedian Profile
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Type</span>
                            <span className="font-medium text-blue-900">{profile.comedianProfile.comedianType}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Speciality</span>
                            <span className="font-medium text-blue-900">{profile.comedianProfile.speciality}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Experience</span>
                            <span className="font-medium text-blue-900">{profile.comedianProfile.experience}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                              ${profile.comedianProfile.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                profile.comedianProfile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'}`}>
                              {profile.comedianProfile.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Password Change Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FiLock className="w-5 h-5 mr-2" />
              Change Password
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordChangeForm.currentPassword}
                  onChange={(e) => setPasswordChangeForm(prev => ({
                    ...prev, 
                    currentPassword: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordChangeForm.newPassword}
                    onChange={(e) => setPasswordChangeForm(prev => ({
                      ...prev, 
                      newPassword: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    value={passwordChangeForm.confirmNewPassword}
                    onChange={(e) => setPasswordChangeForm(prev => ({
                      ...prev, 
                      confirmNewPassword: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              {passwordChangeError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {passwordChangeError}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isChangingPassword ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      <span>Changing...</span>
                    </>
                  ) : (
                    <>
                      <FiKey className="w-4 h-4" />
                      <span>Change Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}