import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/jobs', destination: '/hiring/jobs', permanent: false },
      { source: '/jobs/:path*', destination: '/hiring/jobs/:path*', permanent: false },
      { source: '/pool', destination: '/workforce/pool', permanent: false },
      { source: '/schedule', destination: '/workforce/schedule', permanent: false },
      { source: '/analytics', destination: '/activity/analytics', permanent: false },
      { source: '/qr', destination: '/hiring/qr', permanent: false },
    ];
  },
};

export default nextConfig;
