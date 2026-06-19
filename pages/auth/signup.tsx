/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function SignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const glowRef = useRef<HTMLDivElement>(null);

  // Spotlight glow follows mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!glowRef.current) return;
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      glowRef.current.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255, 107, 26, 0.08) 0%, rgba(10, 10, 10, 0) 70%)`;
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      router.push('/auth/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full bg-[#080808] border border-white/10 px-4 py-3 text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all rounded-none';

  return (
    <>
      <Head>
        <title>Sign Up — The Humours Hub</title>
        <meta name="description" content="Create your Humours Hub account and join Ahmedabad's best comedy community." />
      </Head>

      {/* Noise texture */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }}
      />

      {/* Spotlight glow — follows mouse */}
      <div
        ref={glowRef}
        className="fixed inset-0 z-0 pointer-events-none transition-all duration-300"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255, 107, 26, 0.08) 0%, rgba(10, 10, 10, 0) 70%)' }}
      />

      <Navbar />

      <main className="relative z-10 min-h-screen pt-32 pb-20 flex items-center justify-center px-5 md:px-16">
        <div className="w-full max-w-[480px]">
          <div className="bg-[#141414] border border-white/[0.07] p-8 md:p-12 shadow-2xl relative overflow-hidden">

            {/* Decorative glow blob */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="text-center mb-10">
              <div className="text-4xl mb-4">🎪</div>
              <h1 className="font-headline-md text-headline-md text-on-surface mb-2 tracking-tight">
                Join the Comedy Community! 🎭
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant opacity-80">
                Create your account to start your comedy journey
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-3">
                <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                <p className="text-red-400 font-body-md text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="username" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className={inputClass}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 00000 00000"
                  className={inputClass}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${inputClass} pr-12`}
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary-container transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 pt-2">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => setIsChecked(prev => !prev)}
                    className="h-4 w-4 border-white/20 bg-surface-container-lowest text-primary-container focus:ring-primary-container focus:ring-offset-background rounded-none accent-primary-container"
                  />
                </div>
                <label htmlFor="terms" className="font-body-md text-body-md text-on-surface-variant text-sm">
                  I agree to the{' '}
                  <Link href="/policies" className="text-primary hover:underline underline-offset-4 transition-all">
                    Terms and Conditions
                  </Link>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isChecked || isLoading}
                  className="w-full bg-primary-container text-[#0A0A0A] font-headline-sm text-headline-sm font-bold py-4 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary-container/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sign in link */}
              <div className="text-center pt-2 border-t border-white/5">
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-primary-container font-bold hover:underline underline-offset-4 ml-1">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
