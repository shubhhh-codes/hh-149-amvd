/**
 * @copyright (c) 2024
 * @author 
 * @license MIT
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
  optimizeFonts: true,
  swcMinify: true,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://*.vercel.live https://vercel.live https://*.vercel.app *.google.com *.googleapis.com; connect-src 'self' https://*.razorpay.com https://*.vercel.live https://vercel.live https://*.vercel.app https://api.qrserver.com data: https://fonts.gstatic.com; frame-src 'self' https://*.razorpay.com *.google.com *.youtube.com; img-src 'self' data: blob: https://*.razorpay.com *.googleapis.com https://api.qrserver.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' *.googleapis.com https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com;",
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
      }
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'static/fonts/',
            publicPath: '/_next/static/fonts/',
          },
        },
      ],
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://*.vercel.live https://vercel.live https://*.vercel.app *.google.com *.googleapis.com; connect-src 'self' https://*.razorpay.com https://*.vercel.live https://vercel.live https://*.vercel.app https://api.qrserver.com data: https://fonts.gstatic.com; frame-src 'self' https://*.razorpay.com *.google.com *.youtube.com; img-src 'self' data: blob: https://*.razorpay.com *.googleapis.com https://api.qrserver.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' *.googleapis.com https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com;"
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      }
    ];
  },
}

module.exports = nextConfig;
