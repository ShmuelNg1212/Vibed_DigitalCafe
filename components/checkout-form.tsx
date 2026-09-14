"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { submitOrder } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart/context";
import { cartItemsToCheckoutPayload } from "@/lib/cart/payload";
import { formatMoney } from "@/lib/catalog/presentation";
import { customerDetailsSchema, type CustomerDetails } from "@/lib/validation/catalog";

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotalCents, taxCents, totalCents, clear, hydrated } = useCart();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CustomerDetails>({ resolver: zodResolver(customerDetailsSchema) });

  async function onSubmit(customer: CustomerDetails) {
    setServerError("");
    const result = await submitOrder({ customer, items: cartItemsToCheckoutPayload(items) });
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    clear();
    router.replace(`/orders/success?order=${encodeURIComponent(result.orderNumber)}`);
  }

  if (!hydrated) return <div className="rounded-2xl bg-white p-8 text-stone-600">Restoring your basket...</div>;
  if (!items.length) return <div className="rounded-2xl bg-white p-8 text-center"><h2 className="font-serif text-3xl">Your basket is empty.</h2><p className="mt-2 text-sm text-stone-600">Add something from the menu before checking out.</p><Button className="mt-6" onClick={() => router.push("/#menu")}>Browse the menu</Button></div>;

  return <div className="grid gap-8 lg:grid-cols-[1fr_360px]"><form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">Almost yours</p><h2 className="mt-2 font-serif text-4xl">A few details.</h2><p className="mt-2 text-sm leading-6 text-stone-600">We&apos;ll attach these details to your order so the cafe knows who to call.</p><label className="mt-8 block text-sm font-medium text-stone-800">Name<input {...register("name")} autoComplete="name" className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 outline-none focus:border-amber-700" />{errors.name && <span className="mt-1 block text-xs text-red-700">{errors.name.message}</span>}</label><label className="mt-5 block text-sm font-medium text-stone-800">Email<input {...register("email")} type="email" autoComplete="email" className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 outline-none focus:border-amber-700" />{errors.email && <span className="mt-1 block text-xs text-red-700">{errors.email.message}</span>}</label><label className="mt-5 block text-sm font-medium text-stone-800">Special instructions <span className="font-normal text-stone-400">Optional</span><textarea {...register("specialInstructions")} rows={4} placeholder="A little note for the barista..." className="mt-2 w-full resize-none rounded-lg border border-stone-300 px-3 py-3 outline-none focus:border-amber-700" />{errors.specialInstructions && <span className="mt-1 block text-xs text-red-700">{errors.specialInstructions.message}</span>}</label>{serverError && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{serverError}</p>}<Button type="submit" disabled={isSubmitting} className="mt-6 w-full py-3">{isSubmitting ? "Placing your order..." : `Place order · ${formatMoney(totalCents)}`}</Button></form><aside className="h-fit rounded-2xl bg-stone-900 p-6 text-stone-50 lg:sticky lg:top-8"><h2 className="font-serif text-2xl">Order review</h2><div className="mt-6 space-y-4">{items.map((item) => <div key={item.key} className="flex justify-between gap-4 text-sm"><div><p>{item.quantity} × {item.productName}</p>{item.selectedModifiers.length > 0 && <p className="mt-1 text-xs text-stone-400">{item.selectedModifiers.flatMap((modifier) => modifier.optionNames).join(" · ")}</p>}</div><span>{formatMoney(item.quantity * item.unitPriceCents)}</span></div>)}</div><div className="mt-6 space-y-2 border-t border-stone-700 pt-5 text-sm text-stone-300"><div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(subtotalCents)}</span></div><div className="flex justify-between"><span>Estimated tax</span><span>{formatMoney(taxCents)}</span></div><div className="flex justify-between text-base font-semibold text-white"><span>Total</span><span>{formatMoney(totalCents)}</span></div></div></aside></div>;
}
