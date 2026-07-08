export function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "vibrate" in navigator)
    navigator.vibrate(pattern);
}

export type UploadState = "idle" | "uploading" | "success" | "error";

// Mismos límites que app/api/products/[id]/upload/route.ts (autoridad real) —
// esto solo evita subir un archivo entero por la red para que el servidor
// recién ahí lo rechace, típico con una foto pesada sacada del celular.
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Compresión automática antes de subir: una foto de celular pesa 3-10 MB y
// 4000px de ancho; en la carta se muestra a <800px. Reescalamos y re-encodeamos
// a WebP en el browser (canvas nativo, sin dependencias). GIF se deja pasar
// para no romper animaciones.
const MAX_DIMENSION = 1600;
const COMPRESS_QUALITY = 0.82;
const COMPRESS_THRESHOLD_BYTES = 300 * 1024; // por debajo de esto no vale la pena
const COMPRESSIBLE_MIME = ["image/jpeg", "image/png", "image/webp"];

async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE_MIME.includes(file.type)) return file;
  if (file.size <= COMPRESS_THRESHOLD_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", COMPRESS_QUALITY),
    );
    // Si el re-encode no achica (raro: webp chico ya optimizado), original
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", {
      type: "image/webp",
    });
  } catch {
    // Browser sin soporte o imagen indecodificable — seguimos con el original
    // y que decida el límite de 5 MB.
    return file;
  }
}

export async function uploadImage(
  file: File,
  tenantSlug: string,
  productId?: string,
): Promise<string> {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error("Formato no permitido. Usá JPG, PNG, WebP o GIF.");
  }
  file = await compressImage(file);
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("La imagen no puede superar 5 MB");
  }
  const id = productId ?? `temp-${Date.now()}`;
  const form = new FormData();
  form.append("file", file);
  form.append("slug", tenantSlug);
  const res = await fetch(`/api/products/${id}/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Error al subir imagen");
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}
