import { NextRequest, NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/authz";
import { publishCarousel, uploadCarouselImages } from "@/lib/instagram";

export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

// POST /api/admin/instagram/publish
// multipart/form-data: files (2-10 imágenes), caption (string)
// Sube las imágenes a Supabase Storage y publica el carrusel en @takefyy.
export async function POST(req: NextRequest) {
  try {
    await assertSuperAdmin();
  } catch (e) {
    return e as NextResponse;
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Body inválido — se esperaba multipart/form-data" },
      { status: 400 },
    );
  }

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File);
  const caption = formData.get("caption");

  if (files.length < 2 || files.length > 10) {
    return NextResponse.json(
      { error: "Subí entre 2 y 10 imágenes" },
      { status: 400 },
    );
  }
  if (typeof caption !== "string") {
    return NextResponse.json(
      { error: "Campo 'caption' requerido" },
      { status: 400 },
    );
  }
  for (const file of files) {
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `${file.name} supera 8 MB` },
        { status: 413 },
      );
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: `${file.name}: formato no permitido. Usá JPG, PNG o WebP.` },
        { status: 415 },
      );
    }
  }

  try {
    const imageUrls = await uploadCarouselImages(files);
    const mediaId = await publishCarousel(imageUrls, caption);
    return NextResponse.json({ mediaId, imageUrls });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
