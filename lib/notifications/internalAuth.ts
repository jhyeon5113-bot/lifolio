import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on length mismatch rather than returning false —
  // guard that first (this length check itself is not constant-time, but
  // secret *length* leaking isn't the threat being defended against here,
  // only leaking its *contents* character-by-character is).
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Internal notification routes (compute-daily, deliver) are called by the
// GitHub Actions cron workflow (.github/workflows/notifications-cron.yml),
// not by a logged-in browser — there's no NextAuth session to check.
// proxy.ts already lets /api/internal/* bypass the normal session redirect
// (see its isPublic check); this bearer-token check is these routes'
// actual protection.
export function requireInternalSecret(request: Request): NextResponse | null {
  const expected = process.env.INTERNAL_NOTIFICATIONS_SECRET;
  if (!expected) {
    // Fails closed — an unset secret must never be treated as "no auth
    // required," or these routes would be wide open in an environment
    // where the env var was simply forgotten.
    return NextResponse.json({ error: "INTERNAL_NOTIFICATIONS_SECRET is not configured" }, { status: 500 });
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!provided || !safeEqual(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
