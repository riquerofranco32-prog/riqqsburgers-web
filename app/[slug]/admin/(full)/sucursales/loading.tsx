export default function SucursalesLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 w-full pb-12 flex flex-col gap-4">
      <div
        className="h-4 w-32 animate-pulse rounded-md"
        style={{ background: "var(--dash-surface-2)" }}
      />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl"
            style={{
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
