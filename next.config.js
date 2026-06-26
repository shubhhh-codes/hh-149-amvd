/**
 * @copyright (c) 2024
 * @license MIT
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,

  experimental: {
    // ── CRITICAL: Force Vercel NFT to include Chromium binary files ───────────
    // @sparticuz/chromium decompresses its Chromium binary from .br files at
    // runtime using executablePath(). These files are in the package's bin/
    // directory and are never imported via JS, so Next.js's file tracer (NFT)
    // cannot discover them automatically.
    //
    // Without this, the Vercel deployment is missing:
    //   node_modules/@sparticuz/chromium/bin/chromium.br       (~62 MB)
    //   node_modules/@sparticuz/chromium/bin/fonts.tar.br      (~179 KB)
    //   node_modules/@sparticuz/chromium/bin/swiftshader.tar.br (~3.4 MB)
    //   node_modules/@sparticuz/chromium/bin/al2023.tar.br     (~1 MB)
    //
    // The route key is matched via picomatch against the normalized route string.
    // Source: next/dist/build/collect-build-traces.js:527–536
    outputFileTracingIncludes: {
      '/api/generate-ticket': [
        './node_modules/@sparticuz/chromium/bin/**/*',
      ],
    },
    // ─────────────────────────────────────────────────────────────────────────
  },

  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://*.vercel.live https://vercel.live https://*.vercel.app *.google.com *.googleapis.com; connect-src 'self' blob: https://*.razorpay.com https://*.vercel.live https://vercel.live https://*.vercel.app https://api.qrserver.com data: https://fonts.gstatic.com; frame-src 'self' https://*.razorpay.com *.google.com *.youtube.com; img-src 'self' data: blob: https://*.razorpay.com *.googleapis.com *.googleusercontent.com https://api.qrserver.com https://fonts.gstatic.com https://images.unsplash.com; style-src 'self' 'unsafe-inline' *.googleapis.com https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com;",

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/7.x/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        pathname: '/v1/**',
      },
      {
        protocol: 'https',
        hostname: 'fonts.gstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },

  webpack: (config) => {
    // ── CRITICAL: Prevent Webpack from bundling Chromium ─────────────────────
    // @sparticuz/chromium is a pure ESM package ("type":"module") that uses
    // import.meta.url inside paths.js to locate its .br binary files on disk.
    // When Webpack bundles the module, import.meta.url no longer points to the
    // package's actual on-disk location, so executablePath() throws:
    //   "The input directory does not exist... you must externalize @sparticuz/chromium"
    // Marking these as externals tells Webpack: "leave them alone, require() at runtime".
    // This applies to Pages Router API routes. The experimental.serverComponentsExternalPackages
    // key only affects App Router Server Components and has zero effect here.
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
      'puppeteer-core',
      '@sparticuz/chromium',
    ];
    // ─────────────────────────────────────────────────────────────────────────

    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://*.vercel.live https://vercel.live https://*.vercel.app *.google.com *.googleapis.com; connect-src 'self' blob: https://*.razorpay.com https://*.vercel.live https://vercel.live https://*.vercel.app https://api.qrserver.com data: https://fonts.gstatic.com; frame-src 'self' https://*.razorpay.com *.google.com *.youtube.com; img-src 'self' data: blob: https://*.razorpay.com *.googleapis.com https://api.qrserver.com https://fonts.gstatic.com https://images.unsplash.com; style-src 'self' 'unsafe-inline' *.googleapis.com https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com;",
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;