import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.serveo.net",
    "*.serveousercontent.com",
    "*.lhr.life",
    "*.loca.lt",
    "*.ngrok-free.app",
    "*.trycloudflare.com",
    "localhost:3000",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;


