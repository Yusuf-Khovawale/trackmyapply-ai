// Single source of truth for the app's public base URL, used to build
// absolute links in outbound email (reminder emails, password reset, …).
//
// Production readiness: on Vercel, fall back to the platform's own
// auto-injected URL env vars (no protocol prefix) when APP_BASE_URL isn't
// explicitly set — VERCEL_PROJECT_PRODUCTION_URL (the stable production
// domain) takes priority over VERCEL_URL (the current deployment's own
// URL, which differs per preview deploy), so links point somewhere real
// without requiring extra config for the common case.
export function resolveAppBaseUrl(): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) {
    return `https://${vercelHost}`;
  }
  return "http://localhost:3000";
}
