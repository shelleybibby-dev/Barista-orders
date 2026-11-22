import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow iPads on the same Wi-Fi to open the dev server by LAN IP.
  allowedDevOrigins: ["*"],
  async headers() {
    const noStore = [
      { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
      { key: "Pragma", value: "no-cache" },
      { key: "Expires", value: "0" },
    ];
    return [
      { source: "/barista", headers: noStore },
      { source: "/barista.webmanifest", headers: noStore },
      { source: "/api/orders", headers: noStore },
      { source: "/api/orders/:path*", headers: noStore },
    ];
  },
};

export default nextConfig;
