const DEFAULT_REDIRECT = "/guides";

/** Allow same-origin relative paths only; block open redirects. */
export function getSafeRedirectPath(
  next: string | null | undefined,
  fallback = DEFAULT_REDIRECT,
): string {
  if (!next) {
    return fallback;
  }

  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }

  try {
    const resolved = new URL(next, "http://localhost");
    if (resolved.origin !== "http://localhost") {
      return fallback;
    }

    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
