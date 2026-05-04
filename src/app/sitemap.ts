import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { RUBRO_SLUGS } from "@/lib/rubro-seo-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://mystack.com.ar";

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/legal/terminos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/privacidad`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/cookies`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    // Páginas de rubros para SEO
    ...RUBRO_SLUGS.map((slug) => ({
      url: `${baseUrl}/para/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  // Páginas de negocios (dinámicas)
  try {
    const businesses = await prisma.business.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    const businessPages: MetadataRoute.Sitemap = businesses.map((business) => ({
      url: `${baseUrl}/${business.slug}`,
      lastModified: business.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...businessPages];
  } catch {
    // Si hay error con la DB, retornar solo páginas estáticas
    return staticPages;
  }
}
