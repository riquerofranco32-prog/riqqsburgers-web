import type { Metadata, Viewport } from "next";
import {
  Syne,
  Inter,
  Anton,
  Space_Grotesk,
  JetBrains_Mono,
  Playfair_Display,
  DM_Sans,
  Cormorant_Garamond,
  Montserrat,
} from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
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

// ALTUM SDI primary fonts
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Takefyy — Tu carta digital, lista en minutos",
  description:
    "Creá el menú digital de tu negocio y recibí pedidos por WhatsApp. Sin apps, sin comisiones. Empezá gratis.",
  keywords: [
    "menu digital",
    "restaurante",
    "WhatsApp",
    "carta digital",
    "Argentina",
    "pedidos online",
    "Takefyy",
  ],
  authors: [{ name: "Franco Riquero" }],
  creator: "Takefyy",
  openGraph: {
    title: "Takefyy — Tu carta digital, lista en minutos",
    description:
      "Creá el menú digital de tu negocio y recibí pedidos por WhatsApp.",
    url: "https://takefyy.com",
    siteName: "Takefyy",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Takefyy — Tu carta digital, lista en minutos",
    description:
      "Menú digital + pedidos por WhatsApp para negocios en Argentina.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/takefyy-logo.png",
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
      className={`${syne.variable} ${inter.variable} ${anton.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${playfair.variable} ${dmSans.variable} ${cormorant.variable} ${montserrat.variable}`}
    >
      <body className="min-h-screen antialiased">
        {children}
        <GoogleAnalytics gaId="G-TFXZJ347RM" />
      </body>
    </html>
  );
}
