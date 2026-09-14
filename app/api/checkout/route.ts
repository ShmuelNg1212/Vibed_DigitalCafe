import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { createOrder } from "@/lib/orders/checkout";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const order = await createOrder({ ...(await request.json()), userId: session.userId });
    return NextResponse.json({ id: order.id, orderNumber: order.orderNumber }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
