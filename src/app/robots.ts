import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/g/"],
      disallow: ["/guides/", "/sign-in", "/api/"],
    },
    sitemap: `${siteUrl.origin}/sitemap.xml`,
  };
}
