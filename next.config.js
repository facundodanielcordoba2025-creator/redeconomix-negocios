/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@grpc/grpc-js', 'firebase-admin', 'firebase'],
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
};

module.exports = nextConfig;
