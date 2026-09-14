import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";

import { getSession } from "@/lib/auth/session";
import { getOrdersForUser } from "@/lib/orders/queries";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getSession();
  const orders = session ? await getOrdersForUser(session.userId) : [];

  return (
    <main className="min-h-screen bg-[#f7f4ef] px-6 py-10 text-stone-900 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-950"><ArrowLeft className="size-4" /> Back to menu</Link>
        <div className="mt-14 flex items-end justify-between border-b border-stone-200 pb-6"><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">Your history</p><h1 className="mt-2 font-serif text-5xl">Orders</h1></div><ClipboardList className="size-8 text-amber-700" /></div>
        {!session ? <p className="mt-10 rounded-2xl bg-white p-6 text-stone-600">Sign in to see your order history. Checkout is reserved for signed-in customers.</p> : orders.length === 0 ? <p className="mt-10 rounded-2xl bg-white p-6 text-stone-600">No orders yet. Your next good decision is waiting on the menu.</p> : <div className="mt-8 space-y-4">{orders.map((order) => <article key={order.id} className="rounded-2xl border border-stone-200 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-serif text-2xl">{order.orderNumber}</p><p className="mt-1 text-sm text-stone-500">{order.createdAt.toLocaleDateString()}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">{order.status}</span></div><div className="mt-5 space-y-2 border-t border-stone-100 pt-4 text-sm">{order.items.map((item) => <div key={item.id} className="flex justify-between"><span>{item.quantity} × {item.productName}</span><span>{money(item.lineTotalCents)}</span></div>)}</div><div className="mt-5 flex justify-between border-t border-stone-100 pt-4 font-semibold"><span>Total</span><span>{money(order.totalCents)}</span></div></article>)}</div>}
      </div>
    </main>
  );
}
