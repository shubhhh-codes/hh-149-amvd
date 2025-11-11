/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */

import { SessionProvider } from 'next-auth/react';
import { ToastContainer } from 'react-toastify';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { AppProps } from 'next/app';
import 'react-toastify/dist/ReactToastify.css';
import '@/styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <ErrorBoundary>
      <SessionProvider session={session}>
        <Component {...pageProps} />
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
      </SessionProvider>
    </ErrorBoundary>
  );
}
