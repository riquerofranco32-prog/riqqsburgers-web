import { createServerClient } from "@/lib/supabase";
import { getTenant } from "@/lib/tenants";
import type { Metadata } from "next";
import type { Category, Product } from "@/types/supabase";
import ProductsAdmin from "@/components/ProductsAdmin";
import BackButton from "@/components/BackButton";
import { canAddProduct } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administrar productos" };

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = createServerClient();

  const tenant = await getTenant(slug);
  if (!tenant) return null;

  const [{ data: rawCats }, { data: rawProds }, planCheck] = await Promise.all([
    db
      .from("categories")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("active", true)
      .order("sort_order"),
    db
      .from("products")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("sort_order"),
    canAddProduct(tenant.id),
  ]);

  const categories = (rawCats ?? []) as Category[];
  const products = (rawProds ?? []) as Product[];
  const { allowed: canAddMore, max: productLimit } = planCheck;

  return (
    <>
      <div className="px-5 pt-5 md:px-8">
        <BackButton href={`/${slug}/admin`} label="Dashboard" />
      </div>
      <ProductsAdmin
        tenant={tenant}
        categories={categories}
        initialProducts={products}
        canAddMore={canAddMore}
        productLimit={productLimit}
      />
    </>
  );
}
