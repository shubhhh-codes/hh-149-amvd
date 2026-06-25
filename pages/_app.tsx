import React from 'react';
/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 */
import { SessionProvider } from 'next-auth/react';
import { ToastContainer } from 'react-toastify';
import { Analytics } from '@vercel/analytics/next';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import 'react-toastify/dist/ReactToastify.css';
import '@/styles/globals.css';

import { SpeedInsights } from '@vercel/speed-insights/next';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, interactive-widget=overlays-content" />
      </Head>
      <ErrorBoundary>
        <Component {...pageProps} />
        <SpeedInsights />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Analytics />
      </ErrorBoundary>
    </SessionProvider>
  );
}
