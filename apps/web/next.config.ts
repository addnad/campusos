import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf.js loads a worker file that the bundler does not carry across.
  // Left external, it resolves from node_modules at runtime.
  serverExternalPackages: ["pdf-parse"],
  /* config options here */
};

export default nextConfig;
