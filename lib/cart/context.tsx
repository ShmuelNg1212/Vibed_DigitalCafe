"use client";

import { createContext, useContext, useMemo, useReducer } from "react";

import {
  cartItemCount,
  cartReducer,
  cartSubtotalCents,
  initialCartState,
} from "@/lib/cart/reducer";
import type { AddCartItem, CartAction, CartState } from "@/lib/cart/types";

type CartContextValue = CartState & {
  itemCount: number;
  subtotalCents: number;
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
  const value = useMemo(
    () => ({
      ...state,
      itemCount: cartItemCount(state),
      subtotalCents: cartSubtotalCents(state),
      dispatch,
      addItem: (item: AddCartItem) => dispatch({ type: "add", item }),
      increment: (key: string) => dispatch({ type: "increment", key }),
      decrement: (key: string) => dispatch({ type: "decrement", key }),
      removeItem: (key: string) => dispatch({ type: "remove", key }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [state],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
