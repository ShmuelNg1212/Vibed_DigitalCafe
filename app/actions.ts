"use server";

import { createOrder } from "@/lib/orders/checkout";
import { getSession } from "@/lib/auth/session";
import type { CheckoutInput } from "@/lib/validation/catalog";

export async function submitOrder(input: Omit<CheckoutInput, "userId">) {
  const session = await getSession();
  if (!session) throw new Error("Sign in before placing an order");
  return createOrder({ ...input, userId: session.userId });
}
