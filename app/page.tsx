import { Coffee, ArrowRight } from "lucide-react";
import Link from "next/link";

import { CatalogMenu } from "@/components/catalog-menu";
import { getActiveCatalog } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getActiveCatalog().catch(() => []);

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-stone-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-stone-900 text-amber-200"><Coffee className="size-5" /></span><span className="font-serif text-xl tracking-tight">Digital Cafe</span></Link>
        <nav className="flex items-center gap-5 text-sm text-stone-600"><a href="#menu" className="hidden hover:text-stone-950 sm:block">Menu</a><Link href="/orders" className="hover:text-stone-950">Your orders</Link><Link href="/login" className="rounded-full border border-stone-300 px-4 py-2 hover:border-stone-900 hover:text-stone-950">Sign in</Link></nav>
      </header>
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-10 lg:px-10 lg:pt-16">
        <div className="grid items-end gap-10 border-b border-stone-200 pb-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div><p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Your neighborhood, online</p><h1 className="max-w-3xl font-serif text-6xl leading-[0.96] tracking-tight text-stone-950 sm:text-8xl">Good coffee<br /><em className="font-normal text-amber-800">takes its time.</em></h1></div>
          <div className="max-w-sm justify-self-end"><p className="text-lg leading-8 text-stone-600">Small-batch coffee, warm pastries, and a quiet moment made for you. Order ahead, then take the scenic route.</p><a href="#menu" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-900 underline decoration-amber-500 decoration-2 underline-offset-8">Browse today&apos;s menu <ArrowRight className="size-4" /></a></div>
        </div>
      </section>
      <section id="menu" className="mx-auto max-w-7xl px-6 pb-20 lg:px-10"><CatalogMenu products={products} /></section>
    </main>
  );
}
