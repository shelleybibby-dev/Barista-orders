import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Coffee Beans",
    short_name: "Coffee Beans",
    description: "Dual-iPad café ordering: customer kiosk and live barista queue.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "en-GB",
    background_color: "#f4eadc",
    theme_color: "#6e1a27",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
