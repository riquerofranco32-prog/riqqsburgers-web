import { createServerClient } from "@/lib/supabase";
import type { Metadata } from "next";
import type { Tenant, Category } from "@/types/supabase";
import CategoriesAdmin from "@/components/admin/CategoriesAdmin";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categorías" };

export default async function CategoriasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = createServerClient();

  const { data: rawTenant } = await db
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const tenant = rawTenant as Tenant | null;
  if (!tenant) return null;

  const [{ data: rawCats }, { data: rawProds }] = await Promise.all([
    db
      .from("categories")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("sort_order"),
    db.from("products").select("category_id").eq("tenant_id", tenant.id),
  ]);

  const categories = (rawCats ?? []) as Category[];

  const productCounts: Record<string, number> = {};
  for (const p of (rawProds ?? []) as { category_id: string | null }[]) {
    if (p.category_id) {
      productCounts[p.category_id] = (productCounts[p.category_id] ?? 0) + 1;
    }
  }

  return (
    <>
      <div className="px-5 pt-5 md:px-8">
        <BackButton href={`/${slug}/admin`} label="Dashboard" />
      </div>
      <CategoriesAdmin
        slug={slug}
        initialCategories={categories}
        productCounts={productCounts}
      />
    </>
  );
}
