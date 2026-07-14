export default function QrLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 w-full pb-12 flex flex-col gap-4 items-center">
      <div
        className="h-4 w-24 self-start animate-pulse rounded-md"
        style={{ background: "var(--dash-surface-2)" }}
      />
      <div
        className="h-64 w-64 animate-pulse rounded-xl"
        style={{
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border)",
        }}
      />
    </div>
  );
}
