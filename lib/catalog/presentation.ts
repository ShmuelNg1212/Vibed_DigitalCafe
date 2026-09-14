import type { CatalogCategory } from "@/lib/catalog/queries";

export const categoryPresentation: Record<
  CatalogCategory,
  { label: string; eyebrow: string; description: string; accent: string }
> = {
  COFFEE: {
    label: "Hot Coffee",
    eyebrow: "Brewed with care",
    description: "Comforting classics with a little room to linger.",
    accent: "from-amber-100 via-orange-50 to-stone-100",
  },
  ICED_DRINK: {
    label: "Iced Drinks",
    eyebrow: "Cool and bright",
    description: "A crisp pause for warmer afternoons.",
    accent: "from-sky-100 via-cyan-50 to-stone-100",
  },
  PASTRY: {
    label: "Bakery",
    eyebrow: "From the pastry case",
    description: "Laminated, glazed, and ready for the walk home.",
    accent: "from-rose-100 via-orange-50 to-stone-100",
  },
};

export const categoryOrder: CatalogCategory[] = ["COFFEE", "ICED_DRINK", "PASTRY"];

export function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
