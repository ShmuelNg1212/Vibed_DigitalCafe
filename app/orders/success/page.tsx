import Link from "next/link";
import { Check, Coffee } from "lucide-react";
import { notFound } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { getOrderByNumberForUser } from "@/lib/orders/queries";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const session = await getSession();
  const orderNumber = (await searchParams).order;
  if (!session || !orderNumber) notFound();
  const order = await getOrderByNumberForUser(orderNumber, session.userId);
  if (!order) notFound();

  return <main className="min-h-screen bg-[#f7f4ef] px-6 py-12 text-stone-900 lg:px-10"><div className="mx-auto max-w-2xl"><div className="text-center"><div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-8" /></div><p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-amber-700">Order confirmed</p><h1 className="mt-3 font-serif text-5xl">The good part is underway.</h1><p className="mt-4 text-stone-600">We&apos;ve sent your order to the cafe. Keep this number close.</p><p className="mt-6 font-mono text-lg font-semibold tracking-widest text-stone-900">{order.orderNumber}</p></div><section className="mt-12 rounded-2xl bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-3 border-b border-stone-100 pb-5"><Coffee className="size-5 text-amber-700" /><div><h2 className="font-serif text-2xl">Your order</h2><p className="text-sm text-stone-500">{order.createdAt.toLocaleDateString()} · {order.status}</p></div></div><div className="mt-6 space-y-3 text-sm">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4"><div><p>{item.quantity} × {item.productName}</p>{item.modifiers.length > 0 && <p className="mt-1 text-xs text-stone-500">{item.modifiers.map((modifier) => modifier.name).join(" · ")}</p>}</div><span>{money(item.lineTotalCents)}</span></div>)}</div><div className="mt-6 space-y-2 border-t border-stone-100 pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotalCents)}</span></div><div className="flex justify-between"><span>Tax</span><span>{money(order.taxCents)}</span></div><div className="flex justify-between text-base font-semibold"><span>Total</span><span>{money(order.totalCents)}</span></div></div></section><div className="mt-8 flex justify-center gap-4 text-sm"><Link href="/" className="rounded-full bg-stone-900 px-5 py-3 font-semibold text-white">Back to menu</Link><Link href="/orders" className="rounded-full border border-stone-300 px-5 py-3 font-semibold">Order history</Link></div></div></main>;
}
