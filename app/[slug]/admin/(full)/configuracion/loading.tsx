export default function ConfiguracionLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 w-full pb-12 flex flex-col gap-4">
      <div
        className="h-4 w-32 animate-pulse rounded-md"
        style={{ background: "var(--dash-surface-2)" }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 md:p-5 flex flex-col gap-3"
            style={{
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
            }}
          >
            {Array.from({ length: 4 }).map((_, j) => (
              <div
                key={j}
                className="h-9 animate-pulse rounded-md"
                style={{ background: "var(--dash-surface-2)" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
