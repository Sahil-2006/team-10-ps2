import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stops `next dev` from overwriting our own AGENTS.md
  agentRules: false,
} as NextConfig;

export default nextConfig;
