import TableSkeleton from "@/components/admin/TableSkeleton";

export default function ProductosLoading() {
  return (
    <div className="px-5 pt-5 pb-8 md:px-8 flex flex-col gap-6 w-full">
      <div
        className="h-4 w-24 animate-pulse rounded-md"
        style={{ background: "var(--dash-surface-2)" }}
      />
      <TableSkeleton rows={8} columns={4} />
    </div>
  );
}
