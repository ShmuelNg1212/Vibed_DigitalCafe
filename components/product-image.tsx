"use client";

import Image from "next/image";
import { useState } from "react";
import { Sparkles } from "lucide-react";

import { categoryPresentation } from "@/lib/catalog/presentation";
import type { CatalogCategory } from "@/lib/catalog/queries";

function PlaceholderImage({ category }: { category: CatalogCategory }) {
  const presentation = categoryPresentation[category];

  return (
    <div
      aria-hidden="true"
      className={`relative flex h-full min-h-44 items-end overflow-hidden rounded-xl bg-gradient-to-br ${presentation.accent} p-4`}
    >
      <div className="absolute -right-4 -top-10 size-36 rounded-full border-[18px] border-white/40" />
      <div className="absolute right-10 top-8 size-12 rounded-full bg-white/50 blur-sm" />
      <div className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-700/70">
        <Sparkles className="size-4" /> Digital Cafe
      </div>
    </div>
  );
}

export function ProductImage({
  name,
  category,
  imageUrl,
}: {
  name: string;
  category: CatalogCategory;
  imageUrl: string | null;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100">
      {imageUrl && !hasError ? (
        <Image
          src={imageUrl}
          alt={`${name} from Digital Cafe`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
          onError={() => setHasError(true)}
        />
      ) : (
        <PlaceholderImage category={category} />
      )}
    </div>
  );
}
