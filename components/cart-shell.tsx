"use client";

import { CartProvider } from "@/lib/cart/context";

export function CartShell({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
