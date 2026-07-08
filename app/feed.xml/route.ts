import { getAllPosts } from "@/lib/blog";
import { NextResponse } from "next/server";

const SITE = "https://takefyy.com";

export async function GET() {
  const posts = getAllPosts();

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${post.slug}</guid>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category><![CDATA[${post.category}]]></category>
      ${post.tags?.map((t: string) => `<category><![CDATA[${t}]]></category>`).join("\n      ") ?? ""}
    </item>`,
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Blog Takefyy — Recursos para restaurantes argentinos</title>
    <link>${SITE}/blog</link>
    <description>Guías, comparativas y consejos para dueños de restaurantes en Argentina. Menú digital, pedidos por WhatsApp, cómo vender más sin comisiones.</description>
    <language>es-AR</language>
    <managingEditor>hola@takefyy.com (Takefyy)</managingEditor>
    <webMaster>hola@takefyy.com (Takefyy)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE}/takefyy-logo.png</url>
      <title>Takefyy</title>
      <link>${SITE}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
