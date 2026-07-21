import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

// Sliding-window limiter backed by RateLimitHit (see schema comment) — no
// external Redis/Upstash dependency, at the cost of a couple of extra DB
// round-trips per rate-limited request. Fine at this app's scale.
export async function checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMs);

  // Opportunistic cleanup, scoped to this one key — keeps the table from
  // growing unbounded without needing a separate cron job just for this.
  await prisma.rateLimitHit.deleteMany({ where: { key, createdAt: { lt: windowStart } } });

  const count = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: windowStart } } });

  if (count >= maxRequests) {
    const oldest = await prisma.rateLimitHit.findFirst({
      where: { key, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "asc" },
    });
    const retryAfterMs = oldest ? oldest.createdAt.getTime() + windowMs - Date.now() : windowMs;
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  await prisma.rateLimitHit.create({ data: { key } });
  return { allowed: true, remaining: maxRequests - count - 1, retryAfterMs: 0 };
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "Too many requests — please slow down." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) } },
  );
}
