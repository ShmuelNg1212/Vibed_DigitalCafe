"use server";

import { createOrder } from "@/lib/orders/checkout";
import { getSession } from "@/lib/auth/session";
import { submitOrderSchema, type SubmitOrderInput } from "@/lib/validation/catalog";

export async function submitOrder(input: SubmitOrderInput) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Sign in before placing an order" };

  const parsed = submitOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check your details and try again" };

  try {
    const order = await createOrder({ ...parsed.data, userId: session.userId });
    return { ok: true as const, orderId: order.id, orderNumber: order.orderNumber };
  } catch (error) {
    console.error("[orders] checkout failed", error instanceof Error ? error.message : error);
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to place your order" };
  }
}
