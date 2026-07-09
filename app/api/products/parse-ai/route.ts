import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { assertTenantAdmin } from "@/lib/authz";

const MAX_TEXT_LEN = 8000;
const MAX_IMAGE_BYTES = 5_000_000;

interface ParsedProduct {
  name: string;
  description: string | null;
  price: number;
  category_name: string | null;
  badge: string | null;
}

function isValidMediaType(
  t: string,
): t is "image/jpeg" | "image/png" | "image/webp" {
  return t === "image/jpeg" || t === "image/png" || t === "image/webp";
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug?: string;
    text?: string;
    imageBase64?: string;
    imageMediaType?: string;
  };

  if (!body.slug) {
    return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  }
  if (!body.text?.trim() && !body.imageBase64) {
    return NextResponse.json(
      { error: "Pegá una lista de productos o subí una foto del menú" },
      { status: 400 },
    );
  }
  if (body.text && body.text.length > MAX_TEXT_LEN) {
    return NextResponse.json(
      { error: `Texto demasiado largo (máx. ${MAX_TEXT_LEN} caracteres)` },
      { status: 400 },
    );
  }
  if (body.imageBase64) {
    if (!body.imageMediaType || !isValidMediaType(body.imageMediaType)) {
      return NextResponse.json(
        { error: "Formato de imagen no soportado" },
        { status: 400 },
      );
    }
    if (body.imageBase64.length > MAX_IMAGE_BYTES * 1.4) {
      return NextResponse.json(
        { error: "Imagen demasiado grande (máx. 5MB)" },
        { status: 400 },
      );
    }
  }

  try {
    await assertTenantAdmin(body.slug);
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Carga con IA no configurada (falta ANTHROPIC_API_KEY)" },
      { status: 501 },
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const content: Anthropic.Messages.ContentBlockParam[] = [];
  if (body.imageBase64 && body.imageMediaType) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: body.imageMediaType as
          "image/jpeg" | "image/png" | "image/webp",
        data: body.imageBase64,
      },
    });
  }
  content.push({
    type: "text",
    text: `Extraé la lista de productos de comida/bebida de este ${
      body.imageBase64 ? "menú (imagen)" : "texto"
    }${body.text?.trim() ? `:\n\n${body.text.trim()}` : "."}`,
  });

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      system:
        "Sos un asistente que extrae productos de un menú de restaurante (texto o foto) y los devuelve como JSON. " +
        "Para cada producto devolvé: name (string, requerido), description (string o null), price (number en ARS, requerido, sin símbolo $ ni puntos de miles), " +
        "category_name (string corta como 'Hamburguesas', 'Bebidas', 'Postres', o null si no está claro), badge (string corta como 'Nuevo' o 'Más vendido', o null). " +
        "Si un precio no está explícito, no inventes uno: omití ese producto. Devolvé SOLO el JSON, sin texto adicional, con esta forma: " +
        '{"products": [{"name": "...", "description": "...", "price": 0, "category_name": "...", "badge": null}]}',
      messages: [{ role: "user", content }],
    });
  } catch (err) {
    console.error("parse-ai anthropic error", err);
    return NextResponse.json(
      { error: "No se pudo procesar con IA. Probá de nuevo." },
      { status: 502 },
    );
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      { error: "La IA no devolvió resultados" },
      { status: 502 },
    );
  }

  let parsed: { products?: unknown };
  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
  } catch {
    return NextResponse.json(
      { error: "No se pudo interpretar la respuesta de la IA" },
      { status: 502 },
    );
  }

  if (!Array.isArray(parsed.products)) {
    return NextResponse.json(
      { error: "La IA no encontró productos" },
      { status: 502 },
    );
  }

  const products: ParsedProduct[] = parsed.products
    .filter(
      (p): p is Record<string, unknown> => typeof p === "object" && p !== null,
    )
    .map((p) => ({
      name: typeof p.name === "string" ? p.name.slice(0, 200) : "",
      description:
        typeof p.description === "string" ? p.description.slice(0, 1000) : null,
      price: typeof p.price === "number" && isFinite(p.price) ? p.price : NaN,
      category_name:
        typeof p.category_name === "string"
          ? p.category_name.slice(0, 60)
          : null,
      badge: typeof p.badge === "string" ? p.badge.slice(0, 50) : null,
    }))
    .filter(
      (p) => p.name.trim().length > 0 && isFinite(p.price) && p.price >= 0,
    );

  if (products.length === 0) {
    return NextResponse.json(
      { error: "No se encontraron productos válidos con nombre y precio" },
      { status: 422 },
    );
  }

  return NextResponse.json({ products });
}
