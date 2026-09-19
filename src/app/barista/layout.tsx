import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Coffee Beans — barista",
  applicationName: "Barista",
  manifest: "/barista.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Barista",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Barista",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2a1810",
};

export default function BaristaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
