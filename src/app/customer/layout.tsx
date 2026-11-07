import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Coffee Beans — order kiosk",
  applicationName: "Orders",
  manifest: "/customer.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Orders",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Orders",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6e1a27",
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
