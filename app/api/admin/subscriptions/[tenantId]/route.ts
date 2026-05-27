import { NextRequest, NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/authz";
import { updatePlan } from "@/lib/subscriptions";
import type { PlanId } from "@/lib/plans";

const VALID_PLANS: PlanId[] = ["free", "pro", "premium"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  let user;
  try {
    user = await assertSuperAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  const { tenantId } = await params;

  let body: { plan?: unknown; notes?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { plan, notes } = body;

  if (!plan || !VALID_PLANS.includes(plan as PlanId)) {
    return NextResponse.json(
      { error: `Plan inválido. Valores aceptados: ${VALID_PLANS.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    await updatePlan(
      tenantId,
      plan as PlanId,
      user.id,
      typeof notes === "string" ? notes : undefined,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
