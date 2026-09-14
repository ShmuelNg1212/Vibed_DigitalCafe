"use client";

export default function Error({ reset }: { reset: () => void }) {
  return <main className="min-h-screen bg-[#f7f4ef] p-10 text-stone-700"><p>We couldn&apos;t load your orders.</p><button className="mt-4 underline" onClick={reset}>Try again</button></main>;
}
