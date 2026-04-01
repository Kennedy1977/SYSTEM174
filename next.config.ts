import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
    webpackBuildWorker: false,
    workerThreads: false,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
