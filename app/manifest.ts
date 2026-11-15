import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Fio a Fio — O seu cuidado, ao seu ritmo",
    short_name: "Fio a Fio",
    description: "Acompanhe o seu pacote de engomadoria e registe entregas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fafbf9",
    theme_color: "#fafbf9",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
