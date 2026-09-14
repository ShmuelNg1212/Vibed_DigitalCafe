import { describe, expect, it } from "vitest";

import { cartItemCount, cartItemKey, cartReducer, cartSubtotalCents, initialCartState } from "@/lib/cart/reducer";
import { cartTotals } from "@/lib/cart/totals";

const latte = {
  productId: "latte",
  productName: "House Latte",
  basePriceCents: 480,
  unitPriceCents: 550,
  selectedModifiers: [{ groupId: "milk", groupName: "Milk", optionIds: ["oat"], optionNames: ["Oat milk"], priceDeltaCents: 70 }],
};

describe("cart reducer", () => {
  it("combines identical configurations and keeps variants separate", () => {
    const oatKey = cartItemKey(latte);
    const whole = { ...latte, unitPriceCents: 480, selectedModifiers: [{ ...latte.selectedModifiers[0], optionIds: ["whole"], optionNames: ["Whole milk"], priceDeltaCents: 0 }] };
    const state = cartReducer(cartReducer(initialCartState, { type: "add", item: latte }), { type: "add", item: { ...latte, quantity: 2 } });
    const withVariant = cartReducer(state, { type: "add", item: whole });
    expect(withVariant.items).toHaveLength(2);
    expect(withVariant.items.find((item) => item.key === oatKey)?.quantity).toBe(3);
  });

  it("updates quantities, removes at one, and calculates totals", () => {
    let state = cartReducer(initialCartState, { type: "add", item: { ...latte, quantity: 2 } });
    const key = state.items[0].key;
    state = cartReducer(state, { type: "increment", key });
    expect(cartItemCount(state)).toBe(3);
    expect(cartSubtotalCents(state)).toBe(1650);
    state = cartReducer(state, { type: "decrement", key });
    state = cartReducer(state, { type: "decrement", key });
    state = cartReducer(state, { type: "decrement", key });
    expect(state.items).toHaveLength(0);
  });

  it("rejects invalid quantities and clears the cart", () => {
    expect(() => cartReducer(initialCartState, { type: "add", item: { ...latte, quantity: 0 } })).toThrow();
    const state = cartReducer(initialCartState, { type: "add", item: latte });
    expect(cartReducer(state, { type: "clear" })).toEqual(initialCartState);
  });

  it("hydrates persisted items and calculates integer-cent tax totals", () => {
    const state = cartReducer(initialCartState, {
      type: "hydrate",
      items: [{ ...latte, key: cartItemKey(latte), quantity: 2 }],
    });
    expect(cartSubtotalCents(state)).toBe(1100);
    expect(cartTotals(cartSubtotalCents(state), 825)).toEqual({
      subtotalCents: 1100,
      taxCents: 91,
      totalCents: 1191,
    });
  });
});
