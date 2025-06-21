/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [
      'localhost',
      'imagedelivery.net',
      'images.unsplash.com',
      'picsum.photos',
      'via.placeholder.com',
      'i.pravatar.cc', // Pravatar AI portraits
      'thispersondoesnotexist.com', // AI generated faces
      'api.dicebear.com', // DiceBear avatars
      'robohash.org', // Robohash avatars
      'maidreamin.com',
      'hanagatami.jp',
      'curemaid.jp'
    ],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://concafe-shift-tracker-api.railway.app/api/:path*'
          : 'http://localhost:8001/api/:path*'
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Content-Security-Policy',
            value: "img-src 'self' data: https: http:; default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig