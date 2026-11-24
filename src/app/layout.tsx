import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { themeScript } from "@/components/theme-toggle";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Agendaí — Agendamento online para o seu negócio", template: "%s · Agendaí" },
  description: "Seus clientes agendam sozinhos, 24h por dia. Menos faltas, mais tempo para atender.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: o script de tema altera a classe do <html> antes do React
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geist.variable} min-h-dvh font-sans`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
