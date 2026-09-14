export type SelectedModifier = {
  groupId: string;
  groupName: string;
  optionIds: string[];
  optionNames: string[];
  priceDeltaCents: number;
};

export type CartItem = {
  key: string;
  productId: string;
  productName: string;
  quantity: number;
  basePriceCents: number;
  selectedModifiers: SelectedModifier[];
  unitPriceCents: number;
};

export type AddCartItem = Omit<CartItem, "key" | "quantity"> & { quantity?: number };

export type CartState = { items: CartItem[] };

export type CartAction =
  | { type: "add"; item: AddCartItem }
  | { type: "increment"; key: string }
  | { type: "decrement"; key: string }
  | { type: "remove"; key: string }
  | { type: "clear" };
