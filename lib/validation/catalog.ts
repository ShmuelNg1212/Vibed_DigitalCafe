import { z } from "zod";

export const productInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(1000).optional(),
  category: z.enum(["COFFEE", "PASTRY"]),
  priceCents: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional(),
});

export const modifierSelectionSchema = z.object({
  groupId: z.string().uuid(),
  optionIds: z.array(z.string().uuid()),
});

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(50),
  modifiers: z.array(modifierSelectionSchema).default([]),
});

export const checkoutInputSchema = z.object({
  userId: z.string().uuid().optional(),
  items: z.array(cartItemSchema).min(1).max(100),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
