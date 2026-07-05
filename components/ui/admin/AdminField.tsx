export const adminLabelStyle: React.CSSProperties = {
  display: "block",
  color: "var(--dash-muted)",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 6,
};

export const adminInputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--dash-surface-2)",
  border: "1px solid var(--dash-border)",
  borderRadius: 10,
  padding: "11px 14px",
  color: "var(--dash-text)",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export function AdminLabel({ children }: { children: React.ReactNode }) {
  return <label style={adminLabelStyle}>{children}</label>;
}

export function AdminField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <AdminLabel>{label}</AdminLabel>
      {children}
      {error && (
        <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}
