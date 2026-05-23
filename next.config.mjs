import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/** LAN / WSL host IPs when dev runs with -H 0.0.0.0 (comma-separated in .env.local). */
const extraDevOrigins = (process.env.ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow browsers hitting dev via WSL/LAN IP (e.g. http://172.20.24.10:3005)
  allowedDevOrigins: ["localhost", "127.0.0.1", "172.20.24.10", ...extraDevOrigins],
  // Force this folder as app root (parent C:\web\package-lock.json must not win)
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // WSL + /mnt/c: avoid stale chunks and slow file watches (ChunkLoadError on app/page.js)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.zyrosite.com',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      // Legacy K-Energy API path → ge-energy
      { source: "/api/kenergy/:path*", destination: "/api/ge-energy/:path*" },
      // Energy dashboard short-path aliases
      { source: "/dashboard", destination: "/energy-dashboard/dashboard" },
      { source: "/current-monitor", destination: "/energy-dashboard/current-monitor" },
      { source: "/overview", destination: "/energy-dashboard/overview" },
      { source: "/monitor", destination: "/energy-dashboard/monitor" },
      { source: "/location", destination: "/energy-dashboard/location" },
      { source: "/devices-setting", destination: "/energy-dashboard/devices-setting" },
      { source: "/devices-setting/:path*", destination: "/energy-dashboard/devices-setting/:path*" },
      { source: "/meter-seting", destination: "/energy-dashboard/meter-seting" },
      { source: "/notifications", destination: "/energy-dashboard/notifications" },
    ];
  },
};

export default nextConfig;
