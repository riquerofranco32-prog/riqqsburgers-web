import { NextRequest, NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/authz";
import { publishStory, uploadCarouselImages } from "@/lib/instagram";

export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

// POST /api/admin/instagram/publish-story
// multipart/form-data: file (1 imagen)
// Sube la imagen a Supabase Storage y publica la historia en @takefyy.
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

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Campo 'file' requerido" },
      { status: 400 },
    );
  }
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

  try {
    const [imageUrl] = await uploadCarouselImages([file]);
    const mediaId = await publishStory(imageUrl);
    return NextResponse.json({ mediaId, imageUrl });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
