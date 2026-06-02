import { NextRequest, NextResponse } from "next/server";

// In-memory store per Edge instance. Resets on redeploy/cold start — good enough
// for burst protection without external dependencies.
const ipHits = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_ORDERS_PER_WINDOW = 10; // 10 orders/min per IP

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function middleware(req: NextRequest) {
  if (req.method === "POST" && req.nextUrl.pathname === "/api/orders") {
    const ip = getClientIp(req);
    const now = Date.now();
    const entry = ipHits.get(ip);

    if (!entry || now > entry.resetAt) {
      ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      entry.count += 1;
      if (entry.count > MAX_ORDERS_PER_WINDOW) {
        return NextResponse.json(
          { error: "Demasiados pedidos. Esperá un minuto e intentá de nuevo." },
          { status: 429 },
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/orders", "/api/admin/:path*", "/api/products/:path*"],
};
