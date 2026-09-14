"use client";

import { useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { categoryOrder, categoryPresentation, formatMoney } from "@/lib/catalog/presentation";
import type { CatalogProduct } from "@/lib/catalog/queries";
import { useCart } from "@/lib/cart/context";
import type { SelectedModifier } from "@/lib/cart/types";
import { ProductImage } from "@/components/product-image";

function ModifierPicker({
  product,
  onAdd,
  onCancel,
  disabled,
}: {
  product: CatalogProduct;
  onAdd: (modifiers: SelectedModifier[]) => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  function toggle(groupId: string, optionId: string, maxSelections: number) {
    setSelected((current) => {
      const currentOptions = current[groupId] ?? [];
      const next = currentOptions.includes(optionId)
        ? currentOptions.filter((id) => id !== optionId)
        : maxSelections === 1
          ? [optionId]
          : currentOptions.length < maxSelections
            ? [...currentOptions, optionId]
            : currentOptions;
      return { ...current, [groupId]: next };
    });
  }

  const ready = product.modifierGroups.every((group) => (selected[group.id]?.length ?? 0) >= group.minSelections);
  const selectedModifiers = product.modifierGroups.flatMap((group) => {
    const optionIds = selected[group.id] ?? [];
    return optionIds.length
      ? [{
          groupId: group.id,
          groupName: group.name,
          optionIds,
          optionNames: group.options.filter((option) => optionIds.includes(option.id)).map((option) => option.name),
          priceDeltaCents: group.options.filter((option) => optionIds.includes(option.id)).reduce((sum, option) => sum + option.priceDeltaCents, 0),
        }]
      : [];
  });

  return (
    <div className="mt-5 space-y-5 border-t border-stone-100 pt-5">
      {product.modifierGroups.map((group) => (
        <fieldset key={group.id}>
          <legend className="text-sm font-semibold text-stone-800">{group.name} <span className="font-normal text-stone-400">{group.minSelections ? "Required" : "Optional"}</span></legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {group.options.map((option) => {
              const active = selected[group.id]?.includes(option.id);
              return <button type="button" key={option.id} aria-pressed={active} disabled={disabled} onClick={() => toggle(group.id, option.id, group.maxSelections)} className={`rounded-full border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-500"}`}>{option.name}{option.priceDeltaCents ? ` · +${formatMoney(option.priceDeltaCents)}` : ""}</button>;
            })}
          </div>
          {!group.options.length && group.minSelections > 0 && <p className="mt-2 text-xs text-red-700">This option is currently unavailable.</p>}
        </fieldset>
      ))}
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button><Button type="button" size="sm" disabled={disabled || !ready} onClick={() => onAdd(selectedModifiers)}>Add to order <ArrowRight /></Button></div>
    </div>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const { addItem } = useCart();
  const [customizing, setCustomizing] = useState(false);
  const [added, setAdded] = useState(false);

  function add(modifiers: SelectedModifier[] = []) {
    const modifierDelta = modifiers.reduce((sum, modifier) => sum + modifier.priceDeltaCents, 0);
    addItem({ productId: product.id, productName: product.name, basePriceCents: product.priceCents, selectedModifiers: modifiers, unitPriceCents: product.priceCents + modifierDelta });
    setCustomizing(false);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="group rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <ProductImage name={product.name} category={product.category} imageUrl={product.imageUrl} />
      <div className="p-3">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-2xl text-stone-900">{product.name}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-stone-600">{product.description}</p></div><span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900">{formatMoney(product.priceCents)}</span></div>
        <div className="mt-5 flex items-center justify-between"><Badge variant="outline">{product.modifierGroups.length ? "Customizable" : "Ready to enjoy"}</Badge><Button type="button" size="sm" onClick={() => product.modifierGroups.length ? setCustomizing((open) => !open) : add()}>{product.modifierGroups.length ? (customizing ? "Close" : "Customize") : <><Plus /> Add</>}</Button></div>
        <p aria-live="polite" className="mt-3 min-h-5 text-right text-xs font-semibold text-emerald-700">{added ? "Added to your order" : ""}</p>
        {customizing && <ModifierPicker product={product} onAdd={add} onCancel={() => setCustomizing(false)} />}
      </div>
    </article>
  );
}

function CartLines() {
  const { items, increment, decrement, removeItem } = useCart();
  return <div className="space-y-5">{items.map((item) => <div key={item.key} className="border-b border-stone-100 pb-5"><div className="flex justify-between gap-3"><div><p className="font-medium text-stone-900">{item.productName}</p>{item.selectedModifiers.length > 0 && <p className="mt-1 text-xs leading-5 text-stone-500">{item.selectedModifiers.flatMap((modifier) => modifier.optionNames).join(" · ")}</p>}</div><p className="text-sm font-semibold text-stone-900">{formatMoney(item.unitPriceCents * item.quantity)}</p></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2 rounded-full border border-stone-200 p-1"><button type="button" aria-label={`Decrease ${item.productName}`} className="grid size-7 place-items-center rounded-full hover:bg-stone-100" onClick={() => decrement(item.key)}><Minus className="size-3" /></button><span className="w-5 text-center text-sm">{item.quantity}</span><button type="button" aria-label={`Increase ${item.productName}`} className="grid size-7 place-items-center rounded-full hover:bg-stone-100" onClick={() => increment(item.key)}><Plus className="size-3" /></button></div><button type="button" aria-label={`Remove ${item.productName}`} className="text-stone-400 hover:text-red-700" onClick={() => removeItem(item.key)}><Trash2 className="size-4" /></button></div></div>)}</div>;
}

function CartContent() {
  const { items, itemCount, subtotalCents, taxCents, totalCents } = useCart();
  return <>{items.length ? <><CartLines /><div className="mt-auto border-t border-stone-200 pt-5"><div className="space-y-2 text-sm text-stone-600"><div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(subtotalCents)}</span></div><div className="flex justify-between"><span>Estimated tax</span><span>{formatMoney(taxCents)}</span></div><div className="flex justify-between text-base font-semibold text-stone-900"><span>Total</span><span>{formatMoney(totalCents)}</span></div></div><p className="mt-2 text-xs leading-5 text-stone-500">Final pricing is confirmed securely at checkout.</p><Button asChild className="mt-4 w-full"><Link href="/checkout">Checkout · {itemCount} {itemCount === 1 ? "item" : "items"}</Link></Button></div></> : <div className="flex flex-1 flex-col items-center justify-center py-12 text-center"><ShoppingBag className="size-9 text-amber-700" /><p className="mt-4 font-serif text-2xl text-stone-900">Your basket is quiet.</p><p className="mt-2 max-w-xs text-sm leading-6 text-stone-500">Add a favorite from the menu and we&apos;ll have it ready.</p></div>}</>;
}

function DesktopCart() {
  const { items, itemCount, subtotalCents, taxCents, totalCents } = useCart();
  return <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] min-h-[28rem] flex-col rounded-2xl bg-stone-900 p-6 text-stone-50 lg:flex"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">At a glance</p><h2 className="mt-1 font-serif text-2xl">Your order</h2></div><ShoppingBag className="size-5 text-amber-300" /></div><div className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1"><div className="[&_.border-stone-100]:border-stone-700 [&_.text-stone-900]:text-stone-50 [&_.text-stone-500]:text-stone-300 [&_.text-stone-400]:text-stone-400"><CartLines /></div>{!items.length && <div className="flex flex-1 flex-col items-center justify-center text-center"><p className="font-serif text-xl">A little room for something good.</p><p className="mt-2 text-sm leading-6 text-stone-400">Add from the menu to start your order.</p></div>}</div><div className="mt-5 border-t border-stone-700 pt-5"><div className="space-y-2 text-sm text-stone-300"><div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(subtotalCents)}</span></div><div className="flex justify-between"><span>Estimated tax</span><span>{formatMoney(taxCents)}</span></div><div className="flex justify-between text-base font-semibold text-white"><span>Total</span><span>{formatMoney(totalCents)}</span></div></div><Button asChild className="mt-4 w-full" variant="secondary" disabled={!items.length}><Link href="/checkout">Checkout · {itemCount} {itemCount === 1 ? "item" : "items"}</Link></Button></div></aside>;
}

function CartTrigger({ "aria-label": ariaLabel }: { "aria-label"?: string }) {
  const { itemCount } = useCart();
  return <SheetTrigger asChild><Button variant="outline" aria-label={ariaLabel} className="relative rounded-full border-stone-300"><ShoppingBag /><span className="hidden sm:inline">Order</span>{itemCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-stone-900 text-[10px] text-white">{itemCount}</span>}</Button></SheetTrigger>;
}

export function CatalogMenu({ products }: { products: CatalogProduct[] }) {
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();
  const cartLabel = itemCount === 0 ? "Open order, empty" : `Open order, ${itemCount} ${itemCount === 1 ? "item" : "items"}`;

  return <Sheet open={cartOpen} onOpenChange={setCartOpen}><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-8"><div className="sticky top-3 z-10 flex items-center justify-between rounded-full border border-stone-200/80 bg-[#f7f4ef]/90 px-3 py-2 shadow-sm backdrop-blur"><nav className="flex max-w-[calc(100%-70px)] gap-1 overflow-x-auto">{categoryOrder.map((category) => <a key={category} href={`#${category.toLowerCase()}`} className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 hover:bg-white hover:text-stone-900">{categoryPresentation[category].label}</a>)}</nav><CartTrigger aria-label={cartLabel} /></div>{categoryOrder.map((category) => { const categoryProducts = products.filter((product) => product.category === category); if (!categoryProducts.length) return null; const presentation = categoryPresentation[category]; return <section id={category.toLowerCase()} key={category} className="scroll-mt-24"><div className="mb-5 flex items-end justify-between border-b border-stone-200 pb-4"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">{presentation.eyebrow}</p><h2 className="mt-1 font-serif text-4xl text-stone-900">{presentation.label}</h2><p className="mt-2 text-sm text-stone-500">{presentation.description}</p></div><span className="hidden text-sm text-stone-500 sm:block">{categoryProducts.length} items</span></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{categoryProducts.map((product) => <ProductCard product={product} key={product.id} />)}</div></section>; })}</div><DesktopCart /></div><SheetContent className="w-full sm:max-w-md"><SheetHeader><SheetTitle className="font-serif text-2xl">Your order</SheetTitle><SheetDescription>Review your picks before checkout.</SheetDescription></SheetHeader><div className="flex flex-1 flex-col overflow-y-auto px-4"><CartContent /></div><SheetFooter /></SheetContent></Sheet>;
}
