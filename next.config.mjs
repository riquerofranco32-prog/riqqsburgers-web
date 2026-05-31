/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'postimg.cc' },
      { protocol: 'https', hostname: 'i.postimg.cc' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};
export default nextConfig;
