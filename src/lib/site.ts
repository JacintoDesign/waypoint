export const SITE_NAME = "Waypoint";

export const SITE_DESCRIPTION =
  "Editorial, photo-forward travel guides — a printed guidebook on screen, not a dashboard.";

export function getSiteUrl(): URL {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  if (candidate) {
    const normalized = candidate.startsWith("http")
      ? candidate
      : `https://${candidate}`;
    return new URL(normalized);
  }

  return new URL("http://localhost:3000");
}
