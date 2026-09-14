import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";

import { CatalogMenu } from "@/components/catalog-menu";
import { CartProvider } from "@/lib/cart/context";
import type { CatalogProduct } from "@/lib/catalog/queries";

const product: CatalogProduct = {
  id: "00000000-0000-4000-8000-000000000201",
  name: "Sheet Latte",
  slug: "sheet-latte",
  description: "A test latte.",
  category: "COFFEE",
  priceCents: 500,
  imageUrl: null,
  modifierGroups: [],
};

describe("CatalogMenu cart handoff", () => {
  beforeEach(() => window.localStorage.clear());

  it("opens the cart sheet after a direct add", async () => {
    render(<CartProvider><CatalogMenu products={[product]} /></CartProvider>);
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText("Sheet Latte").length).toBeGreaterThan(0);
  });
});
