import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow iPads on the same Wi-Fi to open the dev server by LAN IP.
  allowedDevOrigins: ["*"],
};

export default nextConfig;
