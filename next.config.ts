import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  env: {
    NEWSAPI_KEY: process.env.NEWSAPI_KEY!,
  },
};

export default nextConfig;