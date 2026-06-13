export default async function MenuPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 0px)",
        background: "var(--dash-bg)",
      }}
    >
      {/* Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "var(--dash-surface)",
          borderBottom: "1px solid var(--dash-border)",
          flexShrink: 0,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#23C55E",
              boxShadow: "0 0 6px #23C55E",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 13,
              color: "var(--dash-muted)",
              fontWeight: 500,
            }}
          >
            Vista previa del menú público —{" "}
            <span style={{ color: "var(--dash-text)" }}>
              esto es lo que ven tus clientes
            </span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--dash-muted)",
              background: "var(--dash-surface-2)",
              border: "1px solid var(--dash-border)",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Abrir en nueva pestaña
          </a>
        </div>
      </div>

      {/* Iframe */}
      <iframe
        src={`/${slug}`}
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          background: "#000",
        }}
        title={`Vista previa del menú de ${slug}`}
      />
    </div>
  );
}
