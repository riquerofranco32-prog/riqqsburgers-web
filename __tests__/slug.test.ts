import { describe, it, expect } from "vitest";

// Slug validation logic mirrored from the API route
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

describe("slug validation", () => {
  it("accepts valid slugs", () => {
    expect(isValidSlug("riqqsburgers")).toBe(true);
    expect(isValidSlug("mi-restaurante-123")).toBe(true);
    expect(isValidSlug("a")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(isValidSlug("Mi Restaurante")).toBe(false);
    expect(isValidSlug("MAYUSCULAS")).toBe(false);
    expect(isValidSlug("con_guion_bajo")).toBe(false);
    expect(isValidSlug("con.punto")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });
});

describe("slug auto-generation from name", () => {
  it("lowercases and replaces spaces", () => {
    expect(toSlug("Riqq's Burgers")).toBe("riqq-s-burgers");
  });

  it("strips accents", () => {
    expect(toSlug("Café del Ángel")).toBe("cafe-del-angel");
  });

  it("collapses multiple separators", () => {
    expect(toSlug("  La  Pizza  ")).toBe("la-pizza");
  });

  it("strips leading/trailing hyphens", () => {
    expect(toSlug("---test---")).toBe("test");
  });
});
