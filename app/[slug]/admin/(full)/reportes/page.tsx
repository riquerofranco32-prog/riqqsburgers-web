import { getTenant } from "@/lib/tenants";
import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import ReportsAdmin from "@/components/admin/reports/ReportsAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reportes" };

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) return null;

  return (
    <>
      <div className="px-5 pt-5 md:px-8">
        <BackButton href={`/${slug}/admin`} label="Dashboard" />
      </div>
      <ReportsAdmin slug={slug} />
    </>
  );
}
