import type { CartItem } from "@/lib/cart/types";

export function cartItemsToCheckoutPayload(items: CartItem[]) {
  return items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    modifiers: item.selectedModifiers.map((modifier) => ({
      groupId: modifier.groupId,
      optionIds: modifier.optionIds,
    })),
  }));
}
