import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['shiki'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
