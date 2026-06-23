import React from 'react';
/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
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
    <div className="font-body-md text-body-md antialiased min-h-screen flex flex-col bg-[#0A0A0A] text-[#e5e2e1]">
      <Navbar />
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24">
        {/* Profile Header */}
        <section className="mb-16 md:mb-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary-container opacity-5 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container">
              <img alt={profile?.username || 'User'} className="w-full h-full object-cover" src={getAvatarUrl(profile?.userId || 'default')} />
            </div>
            <div className="text-center md:text-left flex-grow">
              <h1 className="font-headline-md text-headline-md text-on-surface mb-2">{profile?.username || 'Your Profile'}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6">Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'October 2023'}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                {profile?.role === 'vip' && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#141414] border border-white/5 rounded-DEFAULT font-label-caps text-label-caps text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-primary">stars</span>
                    VIP Member
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 flex flex-col gap-6">
            <div className="bg-[#141414] border border-white/5 p-6 md:p-8 rounded-lg">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Personal Information</h2>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="bg-transparent border border-white/20 text-white px-4 py-2 rounded-DEFAULT font-label-caps text-label-caps hover:bg-white/5 transition-colors">
                    Edit Profile
                  </button>
                )}
              </div>
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Username</label>
                    <input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} className="w-full bg-[#080808] border border-white/10 rounded-DEFAULT px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Phone</label>
                    <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-[#080808] border border-white/10 rounded-DEFAULT px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Bio</label>
                    <textarea rows={4} value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="w-full bg-[#080808] border border-white/10 rounded-DEFAULT px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none" />
                  </div>
                  <div className="flex space-x-4 pt-4">
                    <button type="submit" className="bg-primary text-[#0A0A0A] w-fit px-8 py-3 rounded-DEFAULT font-label-caps text-label-caps hover:opacity-90 transition-opacity">Save Changes</button>
                    <button type="button" onClick={() => setIsEditing(false)} className="bg-transparent text-white border border-white/20 px-8 py-3 rounded-DEFAULT font-label-caps text-label-caps hover:bg-white/5 transition-colors">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Email Address</label>
                    <div className="font-body-lg text-body-lg text-on-surface">{profile?.email || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Phone Number</label>
                    <div className="font-body-lg text-body-lg text-on-surface">{profile?.phone || 'Not provided'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Bio</label>
                    <p className="font-body-md text-body-md text-on-surface-variant">{profile?.bio || 'Tell us about yourself...'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#141414] border border-white/5 p-6 md:p-8 rounded-lg">
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-8 pb-4 border-b border-white/5">Security Settings</h2>
              <form onSubmit={handlePasswordChange} className="flex flex-col gap-6 max-w-md">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Current Password</label>
                  <input type="password" value={passwordChangeForm.currentPassword} onChange={(e) => setPasswordChangeForm(prev => ({ ...prev, currentPassword: e.target.value }))} className="w-full bg-[#080808] border border-white/10 rounded-DEFAULT px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required />
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">New Password</label>
                  <input type="password" value={passwordChangeForm.newPassword} onChange={(e) => setPasswordChangeForm(prev => ({ ...prev, newPassword: e.target.value }))} className="w-full bg-[#080808] border border-white/10 rounded-DEFAULT px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required minLength={8} />
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Confirm New Password</label>
                  <input type="password" value={passwordChangeForm.confirmNewPassword} onChange={(e) => setPasswordChangeForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))} className="w-full bg-[#080808] border border-white/10 rounded-DEFAULT px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required minLength={8} />
                </div>
                {passwordChangeError && (
                  <div className="text-red-400 text-sm">{passwordChangeError}</div>
                )}
                <button type="submit" disabled={isChangingPassword} className="bg-primary text-[#0A0A0A] w-fit px-8 py-3 rounded-DEFAULT font-label-caps text-label-caps hover:opacity-90 transition-opacity mt-4 disabled:opacity-50">
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {profile?.isComedian && profile.comedianProfile && (
              <div className="bg-[#141414] border border-white/5 p-6 md:p-8 rounded-lg mt-6">
                <h2 className="font-headline-sm text-headline-sm text-primary-container mb-8 pb-4 border-b border-white/5 flex items-center gap-2">
                  <span className="material-symbols-outlined">mic</span>
                  Comedian Profile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Type</label>
                    <div className="font-body-md text-body-md text-on-surface">{profile.comedianProfile.comedianType}</div>
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Speciality</label>
                    <div className="font-body-md text-body-md text-on-surface">{profile.comedianProfile.speciality}</div>
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Experience</label>
                    <div className="font-body-md text-body-md text-on-surface">{profile.comedianProfile.experience}</div>
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Status</label>
                    <div className={`font-label-caps text-label-caps px-3 py-1 rounded-full w-fit ${profile.comedianProfile.status === 'approved' ? 'bg-[#ffb596]/20 text-[#ffb596]' : profile.comedianProfile.status === 'pending' ? 'bg-[#c8c6c5]/20 text-[#c8c6c5]' : 'bg-[#ffb4ab]/20 text-[#ffb4ab]'}`}>
                      {profile.comedianProfile.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-[#141414] border border-white/5 p-6 rounded-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary-container/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">Total Bookings</span>
                    <span className="material-symbols-outlined text-primary">confirmation_number</span>
                  </div>
                  <div className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">
                    {bookingStats.total}
                  </div>
                </div>
              </div>

              <div className="bg-[#141414] border border-white/5 p-6 rounded-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary-container/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">Approved Events</span>
                    <span className="material-symbols-outlined text-primary">event_available</span>
                  </div>
                  <div className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">
                    {bookingStats.approved}
                  </div>
                </div>
              </div>

              <div className="bg-[#141414] border border-white/5 p-6 rounded-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary-container/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">Pending Approvals</span>
                    <span className="material-symbols-outlined text-on-surface-variant">hourglass_empty</span>
                  </div>
                  <div className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface-variant">
                    {bookingStats.pending}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
