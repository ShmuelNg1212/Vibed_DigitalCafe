import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CheckoutForm } from "@/components/checkout-form";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getSession();
  return <main className="min-h-screen bg-[#f7f4ef] px-6 py-10 text-stone-900 lg:px-10"><div className="mx-auto max-w-5xl"><Link href="/#menu" className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-950"><ArrowLeft className="size-4" /> Back to menu</Link>{session ? <div className="mt-12"><CheckoutForm /></div> : <div className="mx-auto mt-16 max-w-md rounded-2xl bg-white p-8 text-center"><p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">One more step</p><h1 className="mt-3 font-serif text-4xl">Sign in to checkout.</h1><p className="mt-3 text-sm leading-6 text-stone-600">Your basket will stay here while you sign in.</p><Link href="/login?next=/checkout" className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white">Sign in</Link></div>}</div></main>;
}
