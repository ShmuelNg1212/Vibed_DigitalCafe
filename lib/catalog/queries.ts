import "server-only";

import { db } from "@/lib/db";

export const catalogCategories = ["COFFEE", "ICED_DRINK", "PASTRY"] as const;

export type CatalogCategory = (typeof catalogCategories)[number];

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: CatalogCategory;
  priceCents: number;
  imageUrl: string | null;
  modifierGroups: Array<{
    id: string;
    name: string;
    minSelections: number;
    maxSelections: number;
    options: Array<{
      id: string;
      name: string;
      priceDeltaCents: number;
    }>;
  }>;
};

export async function getActiveCatalog(): Promise<CatalogProduct[]> {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: {
        modifierGroups: {
          orderBy: { sortOrder: "asc" },
          include: {
            options: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    return products.map(({ id, name, slug, description, category, priceCents, imageUrl, modifierGroups }) => ({
      id,
      name,
      slug,
      description,
      category,
      priceCents,
      imageUrl,
      modifierGroups: modifierGroups.map(({ id: groupId, name: groupName, minSelections, maxSelections, options }) => ({
        id: groupId,
        name: groupName,
        minSelections,
        maxSelections,
        options: options.map(({ id: optionId, name: optionName, priceDeltaCents }) => ({
          id: optionId,
          name: optionName,
          priceDeltaCents,
        })),
      })),
    }));
  } catch (error) {
    console.error("[catalog] failed to load active products", error instanceof Error ? error.message : error);
    throw error;
  }
}
