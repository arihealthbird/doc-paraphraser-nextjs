/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Note: Vercel has limits on body size
  // Hobby plan: ~4.5MB, Pro plan: ~50MB
  serverRuntimeConfig: {
    maxFileSizeMB: 50,
  },
};

module.exports = nextConfig;
