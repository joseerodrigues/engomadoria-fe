import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roupa em Dia — O cuidado da sua roupa, ao seu ritmo",
  description: "Acompanhe o seu pacote de engomadoria, registe entregas e veja as suas estatísticas.",
  applicationName: "Roupa em Dia",
  appleWebApp: {
    capable: true,
    title: "Roupa em Dia",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon-v2.ico", sizes: "any", type: "image/x-icon" },
      { url: "/icon-192-v2.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512-v2.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon-v2.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafbf9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
