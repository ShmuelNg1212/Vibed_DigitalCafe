import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireRole("ADMIN");
  const [products, orders] = await Promise.all([
    db.product.findMany({ orderBy: { name: "asc" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { items: true } }),
  ]);
  return <main className="min-h-screen bg-[#f7f4ef] px-6 py-10 text-stone-900 lg:px-10"><div className="mx-auto max-w-6xl"><Link href="/" className="text-sm text-stone-600">← Back to menu</Link><h1 className="mt-12 font-serif text-5xl">Cafe console</h1><div className="mt-10 grid gap-8 lg:grid-cols-2"><section className="rounded-2xl bg-white p-6"><h2 className="font-serif text-2xl">Catalog availability</h2><div className="mt-5 space-y-3">{products.map((product) => <div key={product.id} className="flex items-center justify-between border-b border-stone-100 pb-3 text-sm"><span>{product.name}</span><span className={product.isActive ? "text-emerald-700" : "text-stone-400"}>{product.isActive ? "Active" : "Hidden"}</span></div>)}</div></section><section className="rounded-2xl bg-white p-6"><h2 className="font-serif text-2xl">Recent orders</h2><div className="mt-5 space-y-3">{orders.map((order) => <div key={order.id} className="flex items-center justify-between border-b border-stone-100 pb-3 text-sm"><span>{order.orderNumber}</span><span>{order.status} · ${(order.totalCents / 100).toFixed(2)}</span></div>)}</div></section></div></div></main>;
}
