"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    if (!response.ok) setError("Those credentials did not work.");
    else router.push(searchParams.get("next") || "/");
    setPending(false);
  }

  return <main className="grid min-h-screen place-items-center bg-[#f7f4ef] px-6 text-stone-900"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"><Link href="/" className="text-sm text-stone-500">← Digital Cafe</Link><h1 className="mt-10 font-serif text-4xl">Welcome back.</h1><p className="mt-2 text-sm text-stone-600">Sign in to keep your order history close.</p><label className="mt-8 block text-sm font-medium">Email<input name="email" type="email" required className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 outline-none focus:border-amber-700" /></label><label className="mt-4 block text-sm font-medium">Password<input name="password" type="password" minLength={8} required className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 outline-none focus:border-amber-700" /></label>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}<button disabled={pending} className="mt-6 w-full rounded-lg bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Signing in..." : "Sign in"}</button><p className="mt-5 text-xs text-stone-500">Demo customer: customer@digitalcafe.local / digitalcafe-demo</p></form></main>;
}
