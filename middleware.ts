import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiting per Edge instance.
// Resets on redeploy/cold start — adequate for burst protection
// without requiring external dependencies.
const ipHits = new Map<string, { count: number; resetAt: number }>();

// Separate buckets per endpoint category
const uploadHits = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute

// Per-route limits
const LIMITS = {
  orders: 10, // 10 orders/min per IP
  uploads: 20, // 20 uploads/min per IP (logo + product images)
} as const;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(
  store: Map<string, { count: number; resetAt: number }>,
  key: string,
  max: number,
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true; // allowed
  }

  entry.count += 1;
  return entry.count <= max; // allowed if within limit
}

export function middleware(req: NextRequest) {
  const { pathname, method } = req.nextUrl;

  // Rate limit: order creation
  if (method === "POST" && pathname === "/api/orders") {
    const ip = getClientIp(req);
    if (!checkRateLimit(ipHits, ip, LIMITS.orders)) {
      return NextResponse.json(
        { error: "Demasiados pedidos. Esperá un minuto e intentá de nuevo." },
        { status: 429 },
      );
    }
  }

  // Rate limit: file uploads (product images + tenant logos/banners)
  if (
    method === "POST" &&
    ((pathname.startsWith("/api/tenant/") && pathname.endsWith("/upload")) ||
      pathname.match(/^\/api\/products\/[^/]+\/upload$/))
  ) {
    const ip = getClientIp(req);
    if (!checkRateLimit(uploadHits, ip, LIMITS.uploads)) {
      return NextResponse.json(
        { error: "Demasiadas subidas de imagen. Esperá un minuto." },
        { status: 429 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/orders",
    "/api/admin/:path*",
    "/api/products/:path*",
    "/api/tenant/:slug/upload",
  ],
};
