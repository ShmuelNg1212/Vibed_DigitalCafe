import "server-only";

import { db } from "@/lib/db";

export function getOrdersForUser(userId: string) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { modifiers: true } } },
  });
}

export function getOrderForUser(orderId: string, userId: string) {
  return db.order.findFirst({
    where: { id: orderId, userId },
    include: { items: { include: { modifiers: true } } },
  });
}
