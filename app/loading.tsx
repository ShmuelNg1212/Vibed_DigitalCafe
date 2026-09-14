import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <main className="min-h-screen bg-[#f7f4ef] px-6 py-20 lg:px-10"><div className="mx-auto max-w-7xl"><Skeleton className="h-10 w-56 bg-stone-200" /><Skeleton className="mt-12 h-12 w-96 bg-stone-200" /><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-80 rounded-2xl bg-stone-200" />)}</div></div></main>;
}
