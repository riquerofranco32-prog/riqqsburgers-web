"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/supabase";
import { uploadImage, type UploadState } from "./utils";

export function ProductImageCell({
  product,
  tenantSlug,
  categoryEmoji,
  onUploaded,
}: {
  product: Product;
  tenantSlug: string;
  categoryEmoji: string;
  onUploaded: (productId: string, url: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview ?? product.image_url ?? null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setState("uploading");
    try {
      const publicUrl = await uploadImage(file, tenantSlug, product.id);
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: publicUrl }),
      });
      if (!res.ok) throw new Error("update failed");
      onUploaded(product.id, publicUrl);
      setState("success");
      setTimeout(() => setState("idle"), 2000);
    } catch (err) {
      setState("error");
      toast.error(err instanceof Error ? err.message : "Error al subir imagen");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <div className="relative w-14 h-14 flex-shrink-0 group/img">
      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-800">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={product.name}
            fill
            sizes="56px"
            className="object-cover object-center"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.setAttribute("data-error", "1");
              }
            }}
          />
        ) : null}
        {!displayUrl && (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {categoryEmoji}
          </div>
        )}
      </div>

      {/* Upload overlay */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={state === "uploading"}
        className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/0 group-hover/img:bg-black/55 transition-all"
      >
        {state === "uploading" && (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        )}
        {state === "success" && <Check className="w-5 h-5 text-emerald-400" />}
        {state === "error" && (
          <span className="text-[9px] text-red-400 font-bold text-center px-1">
            Error
          </span>
        )}
        {state === "idle" && (
          <Camera className="w-4 h-4 text-white opacity-40 group-hover/img:opacity-100 transition-opacity" />
        )}
      </button>

      {/* "Sin foto" badge */}
      {!product.image_url && !preview && (
        <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-orange-500 text-white px-1 py-0.5 rounded-full leading-none pointer-events-none">
          Sin foto
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
