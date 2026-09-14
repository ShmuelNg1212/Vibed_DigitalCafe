import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["itent-45-1t-2526-p22-3000.coderange.net"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
