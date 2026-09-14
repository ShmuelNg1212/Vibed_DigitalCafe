"use client";

export default function Error({ reset }: { reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-[#f7f4ef] px-6 text-center text-stone-900"><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">A small pause</p><h1 className="mt-3 font-serif text-4xl">The menu needs a moment.</h1><p className="mt-3 max-w-md text-stone-600">We couldn&apos;t connect to today&apos;s menu. Check the cafe database connection, then try again.</p><button onClick={reset} className="mt-6 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white">Try again</button></div></main>;
}
