import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";

import { CartProvider, useCart } from "@/lib/cart/context";
import { ProductCard, CartLines } from "@/components/catalog-menu";
import type { CatalogProduct } from "@/lib/catalog/queries";

const product = (overrides: Partial<CatalogProduct> = {}): CatalogProduct => ({
  id: "00000000-0000-4000-8000-000000000101",
  name: "Test Latte",
  slug: "test-latte",
  description: "A test drink.",
  category: "COFFEE",
  priceCents: 500,
  imageUrl: null,
  modifierGroups: [],
  ...overrides,
});

function CartPreview() {
  const { items } = useCart();
  return <><CartLines /><div role="status">{items.length ? "has item" : "empty"}</div></>;
}

describe("catalog add-to-cart interactions", () => {
  beforeEach(() => window.localStorage.clear());

  it("adds a direct product and renders it through the shared provider", async () => {
    render(<CartProvider><ProductCard product={product()} /><CartPreview /></CartProvider>);
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect((await screen.findAllByText("Added to your order")).length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toHaveTextContent("has item");
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("digital-cafe-cart") ?? "{}").items).toHaveLength(1));
  });

  it("adds a configured product with modifier text and price", async () => {
    const milkGroupId = "00000000-0000-4000-8000-000000000102";
    const optionId = "00000000-0000-4000-8000-000000000103";
    render(<CartProvider><ProductCard product={product({ modifierGroups: [{ id: milkGroupId, name: "Milk", minSelections: 1, maxSelections: 1, options: [{ id: optionId, name: "Oat milk", priceDeltaCents: 70 }] }] })} /><CartPreview /></CartProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Customize" }));
    fireEvent.click(screen.getByRole("button", { name: /Oat milk/ }));
    fireEvent.click(screen.getByRole("button", { name: /Add to order/ }));
    expect((await screen.findAllByText("Added to your order")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Oat milk").length).toBeGreaterThan(0);
    expect(screen.getByText("$5.70")).toBeInTheDocument();
  });
});
