export function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "vibrate" in navigator)
    navigator.vibrate(pattern);
}

export type UploadState = "idle" | "uploading" | "success" | "error";

export async function uploadImage(
  file: File,
  tenantSlug: string,
  productId?: string,
): Promise<string> {
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
