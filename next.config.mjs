/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },
  // Allow Prisma + Auth.js to bundle correctly on Vercel
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  experimental: {
    // Server actions and instrumentation defaults
  },
};

export default nextConfig;
