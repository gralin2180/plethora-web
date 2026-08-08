import type { MetadataRoute } from "next";
import { getSiteUrl } from "./sitemap";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/auth/", "/settings/", "/api/", "/growth"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base.includes("localhost") ? undefined : base,
  };
}
