"use client";

import { useState } from "react";
import { ShoppingBag, Plus, Minus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type CatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  priceCents: number;
  modifierGroups: Array<{
    id: string;
    name: string;
    minSelections: number;
    maxSelections: number;
    options: Array<{ id: string; name: string; priceDeltaCents: number }>;
  }>;
};

type CartItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function CatalogMenu({ products }: { products: CatalogProduct[] }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  function addToCart(product: CatalogProduct, unitPriceCents = product.priceCents) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { productId: product.id, productName: product.name, quantity: 1, unitPriceCents }];
    });
    setSelectedProduct(null);
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="space-y-8">
        {(["COFFEE", "PASTRY"] as const).map((category) => {
          const categoryProducts = products.filter((product) => product.category === category);
          if (!categoryProducts.length) return null;
          return (
            <div key={category}>
              <div className="mb-4 flex items-end justify-between border-b border-stone-200 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">{category === "COFFEE" ? "Brewed with care" : "From the pastry case"}</p>
                  <h2 className="mt-1 font-serif text-3xl text-stone-900">{category === "COFFEE" ? "Coffee" : "Something sweet"}</h2>
                </div>
                <span className="text-sm text-stone-500">{categoryProducts.length} items</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {categoryProducts.map((product) => (
                  <article key={product.id} className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-2xl text-stone-900">{product.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-stone-600">{product.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900">{money(product.priceCents)}</span>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.16em] text-stone-400">{product.modifierGroups.length ? "Customizable" : "Ready to enjoy"}</span>
                      <Button size="sm" onClick={() => product.modifierGroups.length ? setSelectedProduct(product.id) : addToCart(product)}>
                        <Plus /> Add
                      </Button>
                    </div>
                    {selectedProduct === product.id && product.modifierGroups.length > 0 && (
                      <div className="mt-5 border-t border-stone-100 pt-4">
                        <p className="text-sm font-semibold text-stone-800">Choose your milk</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {product.modifierGroups[0].options.map((option) => (
                            <Button key={option.id} variant="outline" size="sm" onClick={() => addToCart(product, product.priceCents + option.priceDeltaCents)}>
                              {option.name}{option.priceDeltaCents ? ` +${money(option.priceDeltaCents)}` : ""}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </section>
      <aside className="h-fit rounded-2xl bg-stone-900 p-6 text-stone-50 lg:sticky lg:top-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Your order</h2>
          <ShoppingBag className="size-5 text-amber-300" />
        </div>
        {cart.length ? (
          <>
            <div className="mt-6 space-y-4">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-3 text-sm">
                  <div><p>{item.productName}</p><p className="text-stone-400">{money(item.unitPriceCents)} each</p></div>
                  <div className="flex items-center gap-2"><button aria-label={`Decrease ${item.productName}`} onClick={() => setCart((current) => current.flatMap((entry) => entry.productId === item.productId && entry.quantity > 1 ? [{ ...entry, quantity: entry.quantity - 1 }] : entry.productId === item.productId ? [] : [entry]))}><Minus className="size-4" /></button><span>{item.quantity}</span><button aria-label={`Increase ${item.productName}`} onClick={() => setCart((current) => current.map((entry) => entry.productId === item.productId ? { ...entry, quantity: entry.quantity + 1 } : entry))}><Plus className="size-4" /></button></div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-stone-700 pt-4"><div className="flex justify-between font-semibold"><span>Total</span><span>{money(cartTotal)}</span></div><Button className="mt-4 w-full" variant="secondary" onClick={() => router.push("/orders")}>Checkout · {cartCount} {cartCount === 1 ? "item" : "items"}</Button></div>
          </>
        ) : <p className="mt-8 text-sm leading-6 text-stone-400">Your basket is waiting. Add a favorite from the menu and we&apos;ll have it ready.</p>}
      </aside>
    </div>
  );
}
