import type { NextConfig } from "next";

// Nonce-based CSP (Next.js's stricter recommended approach) forces every
// page into dynamic rendering — no static optimization, no ISR, no CDN
// caching, anywhere in the app. That's a real cost this MVP-stage app on
// Vercel doesn't need to pay yet, so this uses the simpler 'unsafe-inline'
// form instead (still a real improvement over no CSP at all: it blocks
// script/object/frame loads from any origin not explicitly listed below).
// Origins here are exactly what this app actually loads, verified against
// the deployed site's console rather than guessed:
//   - fonts.googleapis.com / fonts.gstatic.com: Material Symbols icon font
//     (app/layout.tsx loads it via a plain <link>, unlike the Plus Jakarta
//     Sans / Noto Sans KR fonts, which next/font self-hosts under 'self')
//   - lh3.googleusercontent.com: Google account avatar images (matches the
//     images.remotePatterns entry below)
function buildCsp(): string {
  const isDev = process.env.NODE_ENV === "development";
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: buildCsp() },
        ],
      },
    ];
  },
};

export default nextConfig;
