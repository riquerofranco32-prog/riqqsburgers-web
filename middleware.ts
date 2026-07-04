import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiting per Edge instance.
// Resets on redeploy/cold start — adequate for burst protection
// without requiring external dependencies.
const ipHits = new Map<string, { count: number; resetAt: number }>();

// Separate buckets per endpoint category
const uploadHits = new Map<string, { count: number; resetAt: number }>();
const adminMutationHits = new Map<string, { count: number; resetAt: number }>();
const couponValidateHits = new Map<
  string,
  { count: number; resetAt: number }
>();
const reviewHits = new Map<string, { count: number; resetAt: number }>();
const signupHits = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute

// Per-route limits
const LIMITS = {
  orders: 10, // 10 orders/min per IP
  uploads: 20, // 20 uploads/min per IP (logo + product images)
  adminMutations: 60, // 60 admin writes/min per IP (products/categories/orders/tenant)
  couponValidate: 15, // 15 tries/min per IP — public endpoint, guards against code enumeration
  reviews: 5, // 5 reseñas/min per IP — público sin auth, evita spam
  signup: 8, // 8 intentos/min per IP — cubre chequeos de slug + el submit real
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

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Cross-site form/fetch forgery defense: state-changing API calls must come
// from our own origin. Same-origin browser requests always send Origin (or
// Referer as fallback for older clients); a forged cross-site POST won't
// match. Public order creation still needs this since it's the highest-value
// mutation exposed to anon users.
function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin) return true; // non-browser clients (no Origin/Referer) pass through
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;
  const isApiMutation =
    pathname.startsWith("/api/") && MUTATING_METHODS.has(method);

  if (isApiMutation && !isSameOrigin(req)) {
    return NextResponse.json({ error: "Origen inválido." }, { status: 403 });
  }

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

  // Rate limit: public coupon code validation (checkout, no auth)
  if (method === "POST" && pathname === "/api/coupons/validate") {
    const ip = getClientIp(req);
    if (!checkRateLimit(couponValidateHits, ip, LIMITS.couponValidate)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Esperá un minuto." },
        { status: 429 },
      );
    }
  }

  // Rate limit: public review submission (no auth)
  if (method === "POST" && pathname === "/api/reviews") {
    const ip = getClientIp(req);
    if (!checkRateLimit(reviewHits, ip, LIMITS.reviews)) {
      return NextResponse.json(
        { error: "Demasiadas reseñas. Esperá un minuto." },
        { status: 429 },
      );
    }
  }

  // Rate limit: self-serve signup (público sin auth, crea tenant + usuario real)
  if (pathname.startsWith("/api/signup")) {
    const ip = getClientIp(req);
    if (!checkRateLimit(signupHits, ip, LIMITS.signup)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Esperá un minuto." },
        { status: 429 },
      );
    }
  }

  // Rate limit: other admin mutations (products/categories/orders/tenant writes)
  if (
    isApiMutation &&
    pathname !== "/api/orders" &&
    pathname !== "/api/coupons/validate" &&
    !pathname.endsWith("/upload") &&
    (pathname.startsWith("/api/products") ||
      pathname.startsWith("/api/categories") ||
      pathname.startsWith("/api/orders") ||
      pathname.startsWith("/api/tenant") ||
      pathname.startsWith("/api/coupons"))
  ) {
    const ip = getClientIp(req);
    if (!checkRateLimit(adminMutationHits, ip, LIMITS.adminMutations)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Esperá un minuto." },
        { status: 429 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/orders",
    "/api/orders/:path*",
    "/api/admin/:path*",
    "/api/products/:path*",
    "/api/categories/:path*",
    "/api/tenant/:path*",
    "/api/coupons/:path*",
    "/api/reviews/:path*",
    "/api/signup/:path*",
  ],
};
