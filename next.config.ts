import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,

  images: {
    qualities: [25, 40, 50, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "grateful-fly-712.eu-west-1.convex.cloud",
        pathname: "/api/storage/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/7.x/**",
      },
    ],
  },
};

export default nextConfig;
