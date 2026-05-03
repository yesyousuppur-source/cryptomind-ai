/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force all API routes to be dynamic — prevents build-time fetch errors
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
