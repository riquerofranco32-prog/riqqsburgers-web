import TableSkeleton from "@/components/admin/TableSkeleton";

export default function PedidosLoading() {
  return (
    <div className="p-5 md:p-8 flex flex-col gap-6 w-full">
      <div
        className="h-4 w-24 animate-pulse rounded-md"
        style={{ background: "var(--dash-surface-2)" }}
      />
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl"
            style={{
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
            }}
          />
        ))}
      </div>
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}
