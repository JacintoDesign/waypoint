import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";
import { getPublicGuides } from "@/queries/guides";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const guides = await getPublicGuides();

  return [
    {
      url: siteUrl.origin,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl.origin}/guides`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...guides.map((guide) => ({
      url: `${siteUrl.origin}/g/${guide.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
