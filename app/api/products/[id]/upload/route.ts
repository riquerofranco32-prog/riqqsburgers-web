import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { assertTenantAdmin } from "@/lib/authz";

const BUCKET = "product-images";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Body inválido — se esperaba multipart/form-data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const slug = formData.get("slug");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Campo 'file' requerido" },
      { status: 400 },
    );
  }

  if (typeof slug !== "string") {
    return NextResponse.json(
      { error: "Campo 'slug' requerido" },
      { status: 400 },
    );
  }

  let tenantId: string;
  try {
    const result = await assertTenantAdmin(slug);
    tenantId = result.tenantId;
  } catch (res) {
    if (res instanceof NextResponse) return res;
    throw res;
  }

  const supabaseCheck = createServerClient();

  // For temp IDs (new product not yet saved), skip the product ownership check
  if (!id.startsWith("temp-")) {
    const { data: productCheck } = await supabaseCheck
      .from("products")
      .select("id")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!productCheck) {
      return NextResponse.json(
        { error: "Producto no encontrado o no pertenece a este restaurante" },
        { status: 403 },
      );
    }
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
  const path = `${slug}/${id}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = supabaseCheck;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("[upload-product-image] storage error:", uploadError);
    return NextResponse.json(
      { error: "Error al subir imagen" },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  revalidatePath(`/${slug}`, "layout");
  return NextResponse.json({ url: publicUrl });
}
