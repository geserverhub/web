const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
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
      // Energy dashboard short-path aliases
      { source: "/dashboard", destination: "/energy-dashboard/dashboard" },
      { source: "/overview", destination: "/energy-dashboard/overview" },
      { source: "/monitor", destination: "/energy-dashboard/monitor" },
      { source: "/location", destination: "/energy-dashboard/location" },
      { source: "/devices-setting", destination: "/energy-dashboard/devices-setting" },
      { source: "/devices-setting/:path*", destination: "/energy-dashboard/devices-setting/:path*" },
      { source: "/meter-seting", destination: "/energy-dashboard/meter-seting" },
      { source: "/notifications", destination: "/energy-dashboard/notifications" },
      // SP FOODS API → Express backend at port 3001
      { source: "/sp-api/:path*", destination: "http://localhost:3001/:path*" },
      // SP FOODS SPA routing — serve index.html for /sp and all /sp/* except static assets
      { source: "/sp", destination: "/sp/index.html" },
      { source: "/sp/:path((?!assets|logo\\.jpg|main-Photo\\.jpg).*)", destination: "/sp/index.html" },
    ];
  },
};

export default nextConfig;
