import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://mystack.com.ar";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/register"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/appointments/",
          "/login",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
