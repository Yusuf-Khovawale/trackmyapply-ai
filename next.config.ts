import type { NextConfig } from "next";

const securityHeaders = [
  // Blocks this app from being embedded in an iframe (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Prevents MIME-type sniffing of responses.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs (which can contain ids) to external sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Opt out of browser features this app never uses.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Enforce HTTPS on repeat visits (no-op over plain-HTTP localhost dev).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
