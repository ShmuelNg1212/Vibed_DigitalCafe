"use client";

export default function Error({ reset }: { reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-[#f7f4ef] px-6 text-center text-stone-900"><div><h1 className="font-serif text-4xl">Checkout needs a moment.</h1><p className="mt-3 text-stone-600">We couldn&apos;t load the checkout page.</p><button onClick={reset} className="mt-6 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white">Try again</button></div></main>;
}
