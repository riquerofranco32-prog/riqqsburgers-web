import { describe, it, expect } from "vitest";

// Rate limiter logic extracted for unit testing (stateless version)
function createRateLimiter(maxPerWindow: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function check(ip: string, now: number): boolean {
    const entry = hits.get(ip);
    if (!entry || now > entry.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return true; // allowed
    }
    entry.count += 1;
    return entry.count <= maxPerWindow;
  };
}

describe("rate limiter — /api/orders protection", () => {
  it("allows requests under the limit", () => {
    const check = createRateLimiter(10, 60_000);
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      expect(check("1.2.3.4", now)).toBe(true);
    }
  });

  it("blocks requests over the limit", () => {
    const check = createRateLimiter(10, 60_000);
    const now = Date.now();
    for (let i = 0; i < 10; i++) check("1.2.3.4", now);
    expect(check("1.2.3.4", now)).toBe(false);
  });

  it("resets after the window expires", () => {
    const check = createRateLimiter(2, 1_000);
    const now = Date.now();
    check("1.2.3.4", now);
    check("1.2.3.4", now);
    expect(check("1.2.3.4", now)).toBe(false);
    // After window expires
    expect(check("1.2.3.4", now + 2_000)).toBe(true);
  });

  it("tracks IPs independently", () => {
    const check = createRateLimiter(2, 60_000);
    const now = Date.now();
    check("1.1.1.1", now);
    check("1.1.1.1", now);
    expect(check("1.1.1.1", now)).toBe(false);
    // Different IP unaffected
    expect(check("2.2.2.2", now)).toBe(true);
  });
});
