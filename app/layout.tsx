import type { Metadata, Viewport } from "next";
import {
  Syne,
  Anton,
  Space_Grotesk,
  JetBrains_Mono,
  Playfair_Display,
  DM_Sans,
} from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
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
  preload: false, // only used in code blocks, not critical path
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
  display: "swap",
  preload: false, // only used in CatalogClient tenant theme
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm",
  display: "swap",
  preload: false, // only used in CatalogClient tenant theme
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://takefyy.com"),
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
  },
  manifest: "/manifest.json",
  robots: { index: true, follow: true },
  verification: {
    google: "hOLlft_b-QqSqQPzBTVd6eEgyMok-R0tNb7TnvLHedI",
  },
  alternates: {
    canonical: "https://takefyy.com",
    types: {
      "application/rss+xml": "https://takefyy.com/feed.xml",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es-AR"
      className={`${syne.variable} ${anton.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${playfair.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": "https://takefyy.com/#website",
              name: "Takefyy",
              url: "https://takefyy.com",
              description:
                "Plataforma de menú digital para restaurantes argentinos. Pedidos directo por WhatsApp.",
              publisher: {
                "@id": "https://takefyy.com/#organization",
              },
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://takefyy.com/blog?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {children}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
