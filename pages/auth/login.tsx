import React from 'react';
/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const cardRef = useRef<HTMLDivElement>(null);

  // Subtle 3D card tilt on mouse move (from Stitch design)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768 || !cardRef.current) return;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const moveX = (e.clientX - centerX) / 80;
      const moveY = (e.clientY - centerY) / 80;
      cardRef.current.style.transform = `translate(${moveX}px, ${moveY}px) rotateX(${-moveY / 4}deg) rotateY(${moveX / 4}deg)`;
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });
      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login — The Humours Hub</title>
        <meta name="description" content="Sign in to The Humours Hub and continue your comedy journey." />
      </Head>

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }}
      />

      {/* Spotlight radial glow */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(255, 107, 26, 0.08) 0%, transparent 70%)',
        }}
      />

      <Navbar />

      <main className="relative z-10 min-h-screen pt-32 pb-20 flex items-center justify-center px-5 md:px-16">
        <div
          ref={cardRef}
          className="w-full max-w-md bg-[#141414] border border-white/5 p-8 md:p-10 shadow-2xl relative overflow-hidden group transition-transform duration-75"
          style={{ willChange: 'transform' }}
        >
          {/* Decorative orange glow blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container/10 rounded-full blur-3xl group-hover:bg-primary-container/20 transition-all duration-500 pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-10">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-high border border-white/5">
              <span
                className="material-symbols-outlined text-primary-container text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                theater_comedy
              </span>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface mb-2">
              Welcome Back! ✨
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant opacity-70">
              Sign in to continue your comedy journey
            </p>
          </div>

          {/* Success banner */}
          {router.query.registered && (
            <div className="mb-6 flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-4 py-3">
              <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
              <p className="text-green-400 font-body-md text-sm">Registration successful! Please sign in.</p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-3">
              <span className="material-symbols-outlined text-red-400 text-lg">error</span>
              <p className="text-red-400 font-body-md text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="font-label-caps text-label-caps text-on-surface-variant block uppercase">
                Email address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 text-xl">
                  mail
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full bg-[#080808] border border-white/10 py-4 pl-12 pr-4 text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all rounded-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label htmlFor="password" className="font-label-caps text-label-caps text-on-surface-variant block uppercase">
                  Password
                </label>
                <span className="text-xs text-primary font-body-md opacity-70 cursor-not-allowed select-none">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 text-xl">
                  lock
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-[#080808] border border-white/10 py-4 pl-12 pr-12 text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all rounded-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary-container transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-container text-[#0A0A0A] font-headline-sm text-headline-sm font-bold py-4 active:scale-[0.98] hover:brightness-110 transition-all duration-150 mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>

            {/* Sign up link */}
            <div className="pt-6 text-center border-t border-white/5">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-primary-container font-bold hover:underline ml-1">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}
