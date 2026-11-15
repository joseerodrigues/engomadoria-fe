import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fio a Fio — O seu cuidado, ao seu ritmo",
  description: "Acompanhe o seu pacote de engomadoria, registe entregas e veja as suas estatísticas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
