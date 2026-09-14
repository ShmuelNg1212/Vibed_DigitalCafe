import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";

import { CartProvider, useCart } from "@/lib/cart/context";

const item = {
  productId: "product-1",
  productName: "Test Latte",
  basePriceCents: 500,
  unitPriceCents: 550,
  selectedModifiers: [],
};

describe("CartProvider hydration", () => {
  beforeEach(() => window.localStorage.clear());

  it("hydrates stored items before enabling cart actions", async () => {
    window.localStorage.setItem("digital-cafe-cart", JSON.stringify({ version: 1, items: [{ ...item, key: "stored", quantity: 2 }] }));
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    expect(result.current.hydrated).toBe(false);
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.itemCount).toBe(2);
    act(() => result.current.addItem(item));
    expect(result.current.itemCount).toBe(3);
  });

  it("discards malformed stored entries and remains usable", async () => {
    window.localStorage.setItem("digital-cafe-cart", "not-json");
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.addItem(item));
    expect(result.current.itemCount).toBe(1);
  });
});
