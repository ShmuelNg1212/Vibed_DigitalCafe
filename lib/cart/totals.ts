export function taxCentsFor(subtotalCents: number, taxRateBps: number) {
  return Math.round((subtotalCents * taxRateBps) / 10_000);
}

export function cartTotals(subtotalCents: number, taxRateBps: number) {
  const taxCents = taxCentsFor(subtotalCents, taxRateBps);
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}
