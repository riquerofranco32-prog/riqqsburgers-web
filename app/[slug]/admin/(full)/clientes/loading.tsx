import TableSkeleton from "@/components/admin/TableSkeleton";

export default function ClientesLoading() {
  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 w-full">
      <div
        className="h-4 w-24 animate-pulse rounded-md"
        style={{ background: "var(--dash-surface-2)" }}
      />
      <div className="flex flex-col gap-1">
        <div
          className="h-5 w-32 animate-pulse rounded-md"
          style={{ background: "var(--dash-surface-2)" }}
        />
        <div
          className="h-3 w-56 animate-pulse rounded-md"
          style={{ background: "var(--dash-surface-2)" }}
        />
      </div>
      <TableSkeleton rows={7} columns={3} />
    </div>
  );
}
