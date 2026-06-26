import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Preconnect to Google Fonts for faster DNS resolution */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Non-blocking font load with display=swap to avoid FOIT */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=Hind:wght@400;600;700&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=Hind:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols — load non-blocking */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0..1&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="font-body-md antialiased overflow-x-hidden">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
