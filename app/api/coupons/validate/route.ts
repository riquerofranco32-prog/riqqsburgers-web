import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    tenant_id?: string;
    code?: string;
    subtotal?: number;
  };

  if (
    !body.tenant_id ||
    !body.code ||
    typeof body.subtotal !== "number" ||
    !isFinite(body.subtotal) ||
    body.subtotal < 0
  ) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const result = await validateCoupon(body.tenant_id, body.code, body.subtotal);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    discount_type: result.coupon!.discount_type,
    discount_value: result.coupon!.discount_value,
    discount_amount: result.discountAmount,
  });
}
