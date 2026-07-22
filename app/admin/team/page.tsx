import type { Metadata } from "next";
import { getAllTeamMembersAcrossTenants } from "@/lib/tenants";
import { GlobalTeamAdmin } from "@/components/admin/team/GlobalTeamAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Equipo — Takefyy Admin" };

export default async function SuperAdminTeamPage() {
  const members = await getAllTeamMembersAcrossTenants();

  return (
    <div style={{ padding: "24px 32px" }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: "var(--dash-text)",
          marginBottom: 4,
        }}
      >
        Equipo
      </h1>
      <p style={{ fontSize: 14, color: "var(--dash-muted)", marginBottom: 24 }}>
        Quién tiene acceso a cada restaurante, en un solo lugar
      </p>

      <GlobalTeamAdmin initialMembers={members} />
    </div>
  );
}
