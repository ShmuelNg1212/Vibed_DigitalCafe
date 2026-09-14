import "server-only";

import { db } from "@/lib/db";
import { checkoutInputSchema, type CheckoutInput } from "@/lib/validation/catalog";

const taxRateBps = Number.parseInt(process.env.TAX_RATE_BPS ?? "0", 10);

export async function createOrder(input: CheckoutInput) {
  const parsed = checkoutInputSchema.parse(input);

  return db.$transaction(async (tx) => {
    const productIds = [...new Set(parsed.items.map((item) => item.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { modifierGroups: { include: { options: { where: { isActive: true } } } } },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    const itemData = parsed.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error("Product is unavailable");

      const selectedOptionIds = item.modifiers.flatMap((group) => group.optionIds);
      const groupMap = new Map(product.modifierGroups.map((group) => [group.id, group]));
      const selectedOptions = item.modifiers.flatMap((selection) => {
        const group = groupMap.get(selection.groupId);
        if (!group) throw new Error("Invalid modifier group");
        const optionMap = new Map(group.options.map((option) => [option.id, option]));
        return selection.optionIds.map((optionId) => {
          const option = optionMap.get(optionId);
          if (!option) throw new Error("Invalid modifier option");
          return option;
        });
      });
      for (const group of product.modifierGroups) {
        const selection = item.modifiers.find((entry) => entry.groupId === group.id);
        const selectedCount = selection?.optionIds.length ?? 0;
        if (
          selectedCount < group.minSelections ||
          selectedCount > group.maxSelections ||
          new Set(selection?.optionIds).size !== selectedCount
        ) {
          throw new Error(`Invalid selections for ${group.name}`);
        }
      }
      if (selectedOptions.length !== selectedOptionIds.length) {
        throw new Error("One or more modifiers are unavailable");
      }

      const unitPriceCents = product.priceCents + selectedOptions.reduce((sum, option) => sum + option.priceDeltaCents, 0);
      return {
        product,
        quantity: item.quantity,
        selectedOptions,
        unitPriceCents,
        lineTotalCents: unitPriceCents * item.quantity,
      };
    });

    const subtotalCents = itemData.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const taxCents = Math.round((subtotalCents * taxRateBps) / 10_000);
    return tx.order.create({
      data: {
        userId: parsed.userId,
        subtotalCents,
        taxCents,
        totalCents: subtotalCents + taxCents,
        items: {
          create: itemData.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            unitPriceCents: item.unitPriceCents,
            quantity: item.quantity,
            lineTotalCents: item.lineTotalCents,
            modifiers: {
              create: item.selectedOptions.map((option) => ({
                modifierOptionId: option.id,
                name: option.name,
                priceDeltaCents: option.priceDeltaCents,
              })),
            },
          })),
        },
      },
      include: { items: { include: { modifiers: true } } },
    });
  });
}
