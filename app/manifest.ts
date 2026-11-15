import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Roupa em Dia — O cuidado da sua roupa, ao seu ritmo",
    short_name: "Roupa em Dia",
    description: "Acompanhe o seu pacote de engomadoria e registe entregas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fafbf9",
    theme_color: "#fafbf9",
    icons: [
      { src: "/icon-192-v2.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512-v2.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-v2.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
