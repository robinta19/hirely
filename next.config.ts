import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    '172.19.221.174',
    '172.19.221.*',
    '172.19.*',
    '172.*',
    '192.168.*',
    'localhost'
  ],
};

export default nextConfig;
