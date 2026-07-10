"use client";

import { useState, useEffect } from "react";
import {
  GripVertical,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/types/supabase";

const EMOJI_SUGGESTIONS = [
  "🍔",
  "🍟",
  "🥤",
  "🌭",
  "🍕",
  "🥗",
  "🍰",
  "🍗",
  "🌮",
  "☕",
  "🍦",
  "🔥",
  "🥪",
  "🍣",
  "🧁",
  "🍩",
];

function vibrate(pattern: number | number[]) {
  if (typeof window !== "undefined" && "vibrate" in navigator)
    navigator.vibrate(pattern);
}

function reorder(list: Category[], fromId: string, toId: string): Category[] {
  const from = list.findIndex((c) => c.id === fromId);
  const to = list.findIndex((c) => c.id === toId);
  if (from === -1 || to === -1 || from === to) return list;
  const copy = [...list];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

interface CategoriesAdminProps {
  slug: string;
  initialCategories: Category[];
  productCounts: Record<string, number>;
}

interface CategoryForm {
  name: string;
  emoji: string;
  visible_from: string;
  visible_to: string;
  allow_half: boolean;
}

export default function CategoriesAdmin({
  slug,
  initialCategories,
  productCounts,
}: CategoriesAdminProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>({
    name: "",
    emoji: "🍽️",
    visible_from: "",
    visible_to: "",
    allow_half: false,
  });
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // Snapshot del form al abrir el modal, para detectar cambios sin guardar
  // al cerrar (mismo patrón que ProductModal).
  const [formSnapshot, setFormSnapshot] = useState("");

  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  function countFor(id: string) {
    return productCounts[id] ?? 0;
  }

  // ── Modal ────────────────────────────────────────────────────────────────
  function openNew() {
    setEditing(null);
    const initial: CategoryForm = {
      name: "",
      emoji: "🍽️",
      visible_from: "",
      visible_to: "",
      allow_half: false,
    };
    setForm(initial);
    setFormSnapshot(JSON.stringify(initial));
    setNameError("");
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    const initial: CategoryForm = {
      name: cat.name,
      emoji: cat.emoji ?? "🍽️",
      visible_from: cat.visible_from ?? "",
      visible_to: cat.visible_to ?? "",
      allow_half: cat.allow_half,
    };
    setForm(initial);
    setFormSnapshot(JSON.stringify(initial));
    setNameError("");
    setModalOpen(true);
  }

  function requestCloseModal() {
    if (JSON.stringify(form) !== formSnapshot) {
      if (!confirm("¿Descartar los cambios sin guardar?")) return;
    }
    setModalOpen(false);
  }

  async function handleSave() {
    const name = form.name.trim();
    if (!name) {
      setNameError("El nombre es obligatorio");
      return;
    }
    const emoji = form.emoji.trim() || "🍽️";
    const visible_from = form.visible_from || null;
    const visible_to = form.visible_to || null;
    setSaving(true);

    try {
      if (editing) {
        const res = await fetch(`/api/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            emoji,
            visible_from,
            visible_to,
            allow_half: form.allow_half,
          }),
        });
        if (!res.ok) throw new Error();
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editing.id
              ? {
                  ...c,
                  name,
                  emoji,
                  visible_from,
                  visible_to,
                  allow_half: form.allow_half,
                }
              : c,
          ),
        );
        vibrate(40);
        toast.success("Categoría actualizada");
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, name, emoji }),
        });
        if (!res.ok) throw new Error();
        const created = (await res.json()) as Category;
        setCategories((prev) => [...prev, created]);
        vibrate(40);
        toast.success("Categoría creada");
      }
      setModalOpen(false);
    } catch {
      vibrate([50, 30, 50]);
      toast.error(
        editing ? "Error al actualizar" : "Error al crear la categoría",
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Reordering ───────────────────────────────────────────────────────────
  async function persistOrder(newList: Category[]) {
    const prev = categories;
    setCategories(newList);
    try {
      const res = await fetch("/api/categories/order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, order: newList.map((c) => c.id) }),
      });
      if (!res.ok) throw new Error();
      vibrate(30);
    } catch {
      setCategories(prev);
      vibrate([50, 30, 50]);
      toast.error("No se pudo guardar el orden");
    }
  }

  function moveBy(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= categories.length) return;
    const copy = [...categories];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    persistOrder(copy);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const newList = reorder(categories, dragId, targetId);
    setDragId(null);
    setOverId(null);
    if (newList !== categories) persistOrder(newList);
  }

  // ── Active toggle ────────────────────────────────────────────────────────
  async function toggleActive(cat: Category) {
    const nextActive = !cat.active;
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, active: nextActive } : c)),
    );
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      if (!res.ok) throw new Error();
      vibrate(30);
      toast.success(
        nextActive ? "Categoría visible" : "Categoría oculta del menú",
      );
    } catch {
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, active: cat.active } : c)),
      );
      vibrate([50, 30, 50]);
      toast.error("No se pudo cambiar la visibilidad");
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  function requestDelete(cat: Category) {
    if (countFor(cat.id) > 0) {
      toast.error("Movés o eliminás sus productos antes de borrarla");
      return;
    }
    setConfirmId(cat.id);
  }

  async function confirmDelete(cat: Category) {
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "");
      }
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setConfirmId(null);
      vibrate(40);
      toast.success("Categoría eliminada");
    } catch (err) {
      vibrate([50, 30, 50]);
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "No se pudo eliminar",
      );
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 w-full pb-12">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "var(--dash-text)",
              letterSpacing: "-0.02em",
            }}
          >
            Categorías
          </h1>
          <p style={{ fontSize: 13, color: "var(--dash-muted)", marginTop: 2 }}>
            {categories.length} categoría{categories.length !== 1 ? "s" : ""} ·
            arrastrá o usá las flechas para reordenar
          </p>
        </div>
        <button
          onClick={openNew}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            flexShrink: 0,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          + Agregar
        </button>
      </div>

      {/* Empty state */}
      {categories.length === 0 ? (
        <div
          style={{
            background: "var(--dash-surface)",
            border: "1px dashed var(--dash-border)",
            borderRadius: 16,
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--dash-muted)",
          }}
        >
          <p style={{ fontSize: 32, marginBottom: 8 }}>📂</p>
          <p
            style={{ fontSize: 14, marginBottom: 4, color: "var(--dash-text)" }}
          >
            Todavía no hay categorías
          </p>
          <p style={{ fontSize: 13 }}>
            Creá la primera para empezar a organizar el menú.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {categories.map((cat, index) => {
            const count = countFor(cat.id);
            const isDragging = dragId === cat.id;
            const isOver = overId === cat.id && dragId !== cat.id;
            const isConfirming = confirmId === cat.id;

            return (
              <div
                key={cat.id}
                draggable={!isConfirming}
                onDragStart={() => setDragId(cat.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overId !== cat.id) setOverId(cat.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                onDrop={() => handleDrop(cat.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--dash-surface)",
                  border: `1px solid ${
                    isOver ? "var(--accent)" : "var(--dash-border)"
                  }`,
                  borderRadius: 14,
                  padding: "12px 14px",
                  opacity: isDragging ? 0.4 : cat.active ? 1 : 0.5,
                  boxShadow: isOver ? "0 0 0 1px var(--accent)" : "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
              >
                {/* Drag handle */}
                <span
                  title="Arrastrar para reordenar"
                  style={{
                    color: "var(--dash-muted)",
                    cursor: "grab",
                    display: "flex",
                    flexShrink: 0,
                    touchAction: "none",
                  }}
                >
                  <GripVertical size={16} />
                </span>

                {/* Emoji */}
                <span
                  style={{
                    fontSize: 22,
                    width: 32,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {cat.emoji ?? "🍽️"}
                </span>

                {/* Name + count */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--dash-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.name}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                    {count} producto{count !== 1 ? "s" : ""}
                    {!cat.active && " · oculta del menú"}
                    {cat.visible_from &&
                      cat.visible_to &&
                      ` · visible ${cat.visible_from}–${cat.visible_to}`}
                  </p>
                </div>

                {isConfirming ? (
                  /* Inline delete confirm */
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--dash-muted)",
                        marginRight: 2,
                      }}
                    >
                      ¿Eliminar?
                    </span>
                    <button
                      onClick={() => confirmDelete(cat)}
                      style={{
                        background: "#f87171",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 12px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      Sí
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      style={{
                        background: "var(--dash-surface-2)",
                        color: "var(--dash-text)",
                        border: "1px solid var(--dash-border)",
                        borderRadius: 8,
                        padding: "6px 12px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  /* Actions */
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => moveBy(index, -1)}
                      disabled={index === 0}
                      title="Subir"
                      className="hidden sm:flex items-center justify-center"
                      style={iconBtn(index === 0)}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveBy(index, 1)}
                      disabled={index === categories.length - 1}
                      title="Bajar"
                      className="hidden sm:flex items-center justify-center"
                      style={iconBtn(index === categories.length - 1)}
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={() => openEdit(cat)}
                      title="Editar"
                      className="flex items-center justify-center"
                      style={iconBtn(false)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => toggleActive(cat)}
                      title={
                        cat.active
                          ? "Ocultar del menú público"
                          : "Mostrar en el menú público"
                      }
                      className="flex items-center justify-center"
                      style={iconBtn(false)}
                    >
                      {cat.active ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      onClick={() => requestDelete(cat)}
                      title={
                        count > 0
                          ? "Tiene productos asignados"
                          : "Eliminar categoría"
                      }
                      className="flex items-center justify-center"
                      style={{
                        ...iconBtn(false),
                        color: count > 0 ? "var(--dash-muted)" : "#f87171",
                        opacity: count > 0 ? 0.5 : 1,
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) requestCloseModal();
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid var(--dash-border)",
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--dash-text)",
                }}
              >
                {editing ? "Editar categoría" : "Nueva categoría"}
              </h2>
              <button
                onClick={requestCloseModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--dash-surface-2)",
                  border: "none",
                  color: "var(--dash-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {/* Preview */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--dash-surface-2)",
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <span style={{ fontSize: 26 }}>{form.emoji || "🍽️"}</span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: form.name ? "var(--dash-text)" : "var(--dash-muted)",
                  }}
                >
                  {form.name || "Vista previa"}
                </span>
              </div>

              {/* Name */}
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input
                  value={form.name}
                  autoFocus
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    if (nameError) setNameError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                  }}
                  placeholder="Ej: Hamburguesas"
                  style={{
                    ...inputStyle,
                    borderColor: nameError ? "#f87171" : "var(--dash-border)",
                  }}
                />
                {nameError && (
                  <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>
                    {nameError}
                  </p>
                )}
              </div>

              {/* Emoji */}
              <div>
                <label style={labelStyle}>Emoji</label>
                <input
                  value={form.emoji}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, emoji: e.target.value }))
                  }
                  placeholder="🍔"
                  maxLength={8}
                  style={{ ...inputStyle, width: 80, textAlign: "center" }}
                />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  {EMOJI_SUGGESTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                      style={{
                        width: 38,
                        height: 38,
                        fontSize: 20,
                        borderRadius: 10,
                        cursor: "pointer",
                        background:
                          form.emoji === e
                            ? "var(--accent)"
                            : "var(--dash-surface-2)",
                        border: `1px solid ${
                          form.emoji === e
                            ? "var(--accent)"
                            : "var(--dash-border)"
                        }`,
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Franja horaria */}
              <div>
                <label style={labelStyle}>
                  Visible solo en esta franja horaria (opcional)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="time"
                    value={form.visible_from}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, visible_from: e.target.value }))
                    }
                    style={{ ...inputStyle, width: "auto", flex: 1 }}
                  />
                  <span style={{ color: "var(--dash-muted)", fontSize: 13 }}>
                    a
                  </span>
                  <input
                    type="time"
                    value={form.visible_to}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, visible_to: e.target.value }))
                    }
                    style={{ ...inputStyle, width: "auto", flex: 1 }}
                  />
                  {(form.visible_from || form.visible_to) && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          visible_from: "",
                          visible_to: "",
                        }))
                      }
                      title="Quitar franja horaria"
                      style={{
                        ...iconBtn(false),
                        flexShrink: 0,
                      }}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--dash-muted)",
                    marginTop: 6,
                  }}
                >
                  Ej: categoría &quot;Desayuno&quot; de 08:00 a 12:00. Dejá
                  ambos campos vacíos para que se muestre siempre.
                </p>
              </div>

              {/* Mitad y mitad */}
              {editing && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "var(--dash-text)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.allow_half}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, allow_half: e.target.checked }))
                    }
                  />
                  Permite pedir mitad y mitad
                  <span style={{ fontSize: 11, color: "var(--dash-muted)" }}>
                    (combinar 2 productos de esta categoría en un ítem)
                  </span>
                </label>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--dash-border)",
              }}
            >
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: "100%",
                  background: saving
                    ? "var(--dash-surface-2)"
                    : "var(--accent)",
                  color: saving ? "var(--dash-muted)" : "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "13px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {saving
                  ? "Guardando..."
                  : editing
                    ? "Guardar cambios"
                    : "Crear categoría"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────────────────

function iconBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 34,
    height: 34,
    background: "none",
    border: "none",
    borderRadius: 8,
    color: "var(--dash-muted)",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.3 : 1,
    flexShrink: 0,
    WebkitTapHighlightColor: "transparent",
  };
}

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "var(--dash-muted)",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--dash-surface-2)",
  border: "1px solid var(--dash-border)",
  borderRadius: 10,
  padding: "11px 14px",
  color: "var(--dash-text)",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
