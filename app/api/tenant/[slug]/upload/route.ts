import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";
import { safeDbError } from "@/lib/db-error";

const BUCKET = "restaurant-logos";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    await assertTenantAdmin(slug);
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Body inválido — se esperaba multipart/form-data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const field = formData.get("field");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Campo 'file' requerido" },
      { status: 400 },
    );
  }

  if (field !== "logo_url" && field !== "banner_url") {
    return NextResponse.json(
      { error: "Campo 'field' debe ser 'logo_url' o 'banner_url'" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "La imagen no puede superar 5 MB" },
      { status: 413 },
    );
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no permitido. Usá JPG, PNG, WebP o GIF." },
      { status: 415 },
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${slug}/${field}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const supabase = createServerClient(); // service role — bypassa RLS

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("[upload-logo] Supabase storage error:", uploadError);
    return NextResponse.json(
      { error: safeDbError(uploadError, "Error al subir imagen") },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Append timestamp so browser/CDN don't serve a stale cached version
  // when the same path is overwritten with a new image.
  const url = `${publicUrl}?t=${Date.now()}`;

  revalidatePath(`/${slug}`, "layout");
  return NextResponse.json({ url });
}
