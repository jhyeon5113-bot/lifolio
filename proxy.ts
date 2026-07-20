import { NextResponse } from "next/server";
import { auth } from "@/auth";

// /sw.js must be public: the matcher below only excludes a handful of image
// extensions, not .js, so without this the service worker script gets
// redirected to /login for anyone without a session cookie — and browsers
// reject a redirected response when fetching/updating a service worker
// script (spec requirement), which would break push notifications the
// moment a session expires and the browser re-checks for an update.
const PUBLIC_PATHS = new Set(["/", "/login", "/sw.js"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/api/auth") ||
    // Called by the GitHub Actions cron workflow
    // (.github/workflows/notifications-cron.yml), which has no browser
    // session — protected instead by a bearer-token check inside each
    // route (lib/notifications/internalAuth.ts).
    pathname.startsWith("/api/internal/");

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
