import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CampusOS",
    short_name: "CampusOS",
    description: "The academic home for Nigerian students.",
    start_url: "/today",
    display: "standalone",
    background_color: "#FFF6E6",
    theme_color: "#FFF6E6",
    orientation: "portrait",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Today", url: "/today" },
      { name: "Rooms", url: "/community" },
    ],
  };
}
