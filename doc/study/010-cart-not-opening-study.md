# Cart Not Opening Study

## Scope

The cart state path and component tests now pass, but the demo still appears not
to add items. The remaining issue is the presentation handoff after a successful
add, especially on mobile and tablet layouts.

## Confirmed Finding

`CatalogMenu` owns controlled sheet state:

```tsx
const [cartOpen, setCartOpen] = useState(false);
return <Sheet open={cartOpen} onOpenChange={setCartOpen}>...</Sheet>;
```

However, `ProductCard` only receives `product` and `useCart().addItem`. Its
`add()` function dispatches the cart line and closes customization, but it does
not notify `CatalogMenu`:

```tsx
addItem(...);
setCustomizing(false);
```

No code calls `setCartOpen(true)` after an add. The only way to open the mobile
cart is the separate `CartTrigger`, which is easy to miss. The desktop cart is
hidden below the `lg` breakpoint. Therefore the state can update correctly while
the customer sees no cart line or open cart surface.

This explains the reported behavior more directly than a reducer or hydration
failure. Existing component tests render `ProductCard` and `CartLines` together,
so they prove state updates but do not test the real `CatalogMenu` add-to-sheet
handoff.

## Recommended Fix

Pass an `onAdded` callback from `CatalogMenu` to every `ProductCard`. After a
successful direct or customized add:

1. Dispatch the normalized cart item.
2. Close the modifier picker if applicable.
3. Set the controlled sheet state to open.
4. Keep the existing live confirmation and shared provider state.

The same callback should be used for direct-add products and the modifier
confirmation action. No authentication or pricing behavior changes are needed.

Add a component test that renders the menu, clicks a direct-add action, and
asserts that the sheet content becomes visible. Add the equivalent customized
path if practical. Keep the existing provider/reducer tests because they cover
the state contract independently.

## Residual Considerations

- The cart trigger should remain available for customers who close the sheet.
- The desktop sidebar continues to show the shared cart state at `lg` widths.
- Product data and server checkout remain unchanged.
- Unsplash image 404 fallback messages are unrelated to cart interaction.

## Out of Scope

This fix does not change Prisma, checkout transactions, authentication, cart
persistence, or reducer semantics.
