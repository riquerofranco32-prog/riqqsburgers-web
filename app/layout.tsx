import type { Metadata, Viewport } from "next";
import {
  Syne,
  Inter,
  Anton,
  Space_Grotesk,
  JetBrains_Mono,
  Playfair_Display,
  DM_Sans,
} from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-anton",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Takefyy — Tu carta, online en minutos",
  description:
    "Creá el menú digital de tu restaurante y recibí pedidos por WhatsApp. Sin apps, sin comisiones. Probá gratis 14 días.",
  keywords: [
    "menu digital",
    "restaurante",
    "WhatsApp",
    "carta digital",
    "Argentina",
    "pedidos online",
  ],
  authors: [{ name: "Franco Riquero" }],
  creator: "Takefyy",
  openGraph: {
    title: "Takefyy — Tu carta, online en minutos",
    description:
      "Creá el menú digital de tu restaurante y recibí pedidos por WhatsApp.",
    url: "https://takefyy.vercel.app",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Takefyy — Tu carta, online en minutos",
    description:
      "Menú digital + pedidos por WhatsApp para restaurantes en Argentina.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${syne.variable} ${inter.variable} ${anton.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${playfair.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
