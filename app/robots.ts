import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/login",
          "/signup",
          "/reset-password",
          "/admin",
          "/pedido",
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: "https://takefyy.com/sitemap.xml",
  };
}
