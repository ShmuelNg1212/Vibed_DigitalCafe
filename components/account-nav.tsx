"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AccountNav({ name }: { name: string }) {
  const router = useRouter();
  async function signOut() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }
  return <div className="flex items-center gap-3"><span className="hidden text-sm text-stone-600 sm:inline">Hi, {name.split(" ")[0]}</span><details className="relative"><summary className="cursor-pointer list-none rounded-full border border-stone-300 px-4 py-2 text-sm hover:border-stone-900">Account</summary><div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-stone-200 bg-white p-2 shadow-lg"><Link href="/orders" className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-100">My Orders</Link><button type="button" onClick={signOut} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-100">Sign Out</button></div></details></div>;
}
