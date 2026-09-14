"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";

import { cartItemCount, cartReducer, cartSubtotalCents, initialCartState } from "@/lib/cart/reducer";
import { cartTotals } from "@/lib/cart/totals";
import type { AddCartItem, CartAction, CartItem, CartState } from "@/lib/cart/types";

const storageKey = "digital-cafe-cart";
const storageVersion = 1;
const taxRateBps = Number.parseInt(process.env.NEXT_PUBLIC_TAX_RATE_BPS ?? "0", 10) || 0;

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return typeof item.key === "string" && typeof item.productId === "string" && typeof item.productName === "string" && typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity > 0 && Array.isArray(item.selectedModifiers) && typeof item.unitPriceCents === "number" && Number.isInteger(item.unitPriceCents) && item.unitPriceCents >= 0;
}

function readStoredItems() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "null") as { version?: number; items?: unknown } | null;
    return parsed?.version === storageVersion && Array.isArray(parsed.items) ? parsed.items.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

type CartContextValue = CartState & {
  hydrated: boolean;
  itemCount: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  dispatch: React.Dispatch<CartAction>;
  addItem: (item: AddCartItem) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dispatch({ type: "hydrate", items: readStoredItems() });
    const hydrationFrame = window.requestAnimationFrame(() => setHydrated(true));
    return () => window.cancelAnimationFrame(hydrationFrame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ version: storageVersion, items: state.items }));
    } catch {
      // Private browsing and quota errors should not disable in-memory checkout.
    }
  }, [hydrated, state.items]);

  const subtotalCents = cartSubtotalCents(state);
  const totals = cartTotals(subtotalCents, taxRateBps);
  const value = useMemo(() => ({
    ...state,
    hydrated,
    itemCount: cartItemCount(state),
    subtotalCents,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
    dispatch,
    addItem: (item: AddCartItem) => dispatch({ type: "add", item }),
    increment: (key: string) => dispatch({ type: "increment", key }),
    decrement: (key: string) => dispatch({ type: "decrement", key }),
    removeItem: (key: string) => dispatch({ type: "remove", key }),
    clear: () => dispatch({ type: "clear" }),
  }), [hydrated, state, subtotalCents, totals.taxCents, totals.totalCents]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
