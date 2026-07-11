/**
 * Mirrors public.generate_guide_slug() in the waypoint schema migration.
 */
export function slugifyGuideTitle(title: string): string {
  let base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base === "") {
    base = "guide";
  }

  return base;
}

export function normalizeGuideSlug(input: string): string {
  return slugifyGuideTitle(input);
}

const GUIDE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidGuideSlug(slug: string): boolean {
  return GUIDE_SLUG_PATTERN.test(slug);
}

export function resolveUniqueGuideSlug(
  baseSlug: string,
  takenSlugs: ReadonlySet<string>,
): string {
  let candidate = baseSlug;
  let suffix = 0;

  while (takenSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}
