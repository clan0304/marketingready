/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      // Add your Supabase project URL domain
      'your-project.supabase.co',
      // Also allow avatars from Google Auth
      'lh3.googleusercontent.com',
    ],
  },
};

module.exports = nextConfig;
