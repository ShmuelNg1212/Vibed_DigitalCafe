import type { AddCartItem, CartAction, CartItem, CartState } from "@/lib/cart/types";

export const initialCartState: CartState = { items: [] };

function canonicalModifiers(item: Pick<AddCartItem, "selectedModifiers">) {
  return item.selectedModifiers
    .map((modifier) => ({
      groupId: modifier.groupId,
      optionIds: [...modifier.optionIds].sort(),
    }))
    .sort((left, right) => left.groupId.localeCompare(right.groupId));
}

export function cartItemKey(item: Pick<AddCartItem, "productId" | "selectedModifiers">) {
  return JSON.stringify({ productId: item.productId, modifiers: canonicalModifiers(item) });
}

function normalizedItem(input: AddCartItem): CartItem {
  const quantity = input.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Cart quantity must be a positive integer");
  }

  return {
    ...input,
    quantity,
    key: cartItemKey(input),
    selectedModifiers: input.selectedModifiers.map((modifier) => ({
      ...modifier,
      optionIds: [...modifier.optionIds].sort(),
    })),
  };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const next = normalizedItem(action.item);
      const existing = state.items.find((item) => item.key === next.key);
      if (!existing) return { items: [...state.items, next] };
      return {
        items: state.items.map((item) =>
          item.key === next.key ? { ...item, quantity: item.quantity + next.quantity } : item,
        ),
      };
    }
    case "increment":
      return {
        items: state.items.map((item) =>
          item.key === action.key ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      };
    case "decrement":
      return {
        items: state.items.flatMap((item) => {
          if (item.key !== action.key) return [item];
          return item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : [];
        }),
      };
    case "remove":
      return { items: state.items.filter((item) => item.key !== action.key) };
    case "clear":
      return initialCartState;
  }
}

export function cartItemCount(state: CartState) {
  return state.items.reduce((total, item) => total + item.quantity, 0);
}

export function cartSubtotalCents(state: CartState) {
  return state.items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
}
