import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://i.postimg.cc https://postimg.cc https://api.qrserver.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://prod.spline.design https://*.spline.design https://unpkg.com https://www.google-analytics.com https://www.googletagmanager.com https://vitals.vercel-insights.com https://*.ingest.us.sentry.io",
      "worker-src 'self' blob:",
      "font-src 'self' data:",
      "frame-src 'self' https://vercel.live https://*.vercel.live",
      "media-src 'self' data: blob:",
      "frame-ancestors 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  compress: true, // gzip/brotli compression
  async headers() {
    return [
      // Security headers for all routes
      { source: "/(.*)", headers: securityHeaders },
      // Aggressive cache for hashed static assets (JS, CSS, fonts)
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache images for 30 days
      {
        source: "/(.*)\\.(png|jpg|jpeg|gif|webp|svg|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'postimg.cc' },
      { protocol: 'https', hostname: 'i.postimg.cc' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
    formats: ['image/avif', 'image/webp'], // prefer avif → smaller files
    minimumCacheTTL: 86400, // 24h cache for optimized images (default: 60s)
  },
  experimental: {
    // Tree-shake icon libs — only import what's actually used
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true, // no imprimir logs del plugin en cada build
  // Sin org/project/authToken: el upload de source maps se saltea (no hace
  // falta para que la captura de errores funcione), agregar si se quiere
  // ver stack traces desminificados en el dashboard de Sentry.
  webpack: {
    treeshake: { removeDebugLogging: true }, // tree-shake el logger del bundle del cliente
  },
});
