import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = (await request.json()) as { isActive?: boolean };
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be boolean" }, { status: 400 });
    }
    const product = await db.product.update({ where: { id }, data: { isActive: body.isActive } });
    return NextResponse.json({ id: product.id, isActive: product.isActive });
  } catch {
    return NextResponse.json({ error: "Unauthorized or product not found" }, { status: 403 });
  }
}
