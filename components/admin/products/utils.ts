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

export async function uploadImage(
  file: File,
  tenantSlug: string,
  productId?: string,
): Promise<string> {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("La imagen no puede superar 5 MB");
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error("Formato no permitido. Usá JPG, PNG, WebP o GIF.");
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
