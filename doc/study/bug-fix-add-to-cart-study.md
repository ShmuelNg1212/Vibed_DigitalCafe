# Add-to-Cart Bug Diagnosis

## Scope

Customers report that clicking an add action either does nothing or does not
produce a visible cart update. This study inspects the client boundary, event
handlers, Context/reducer state flow, and localStorage hydration path. It does
not execute a fix.

## Client Boundaries

The relevant components are client components:

- `components/catalog-menu.tsx` begins with `"use client"` and contains
  `ProductCard`, `ModifierPicker`, `CartLines`, `CartContent`, `DesktopCart`,
  and `CatalogMenu`.
- `components/cart-shell.tsx` begins with `"use client"` and mounts the cart
  provider.
- `components/ui/button.tsx` is a client-compatible shadcn primitive and uses
  Radix `Slot` only when `asChild` is requested.
- `app/layout.tsx` renders `CartShell` around the complete application tree.

The client boundary is therefore present and correctly placed. Prisma data is
still fetched in the server `Home` component and passed as serializable
`CatalogProduct` data into the client menu. The symptom is not caused by
`ProductCard` being rendered as a Server Component.

## Event Handler and Payload Analysis

For products without modifiers, the product action calls:

```tsx
<Button type="button" onClick={() => add()}>
  Add
</Button>
```

`add()` computes no modifier delta and dispatches:

```tsx
addItem({
  productId: product.id,
  productName: product.name,
  basePriceCents: product.priceCents,
  selectedModifiers: [],
  unitPriceCents: product.priceCents,
});
```

For products with modifiers, the first click toggles local `customizing` state.
The modifier buttons update a local selection map. The confirmation button
passes `selectedModifiers` to the same `add()` callback, which calculates the
modifier delta and dispatches a complete cart item.

The event handlers are wired and the payload contains the required fields for
the reducer. The controls use `type="button"`, so accidental form submission is
not the likely cause. Required modifier groups disable confirmation until the
minimum selection count is satisfied, which is intentional behavior rather than
a general add failure.

The plan should still add temporary development logging at the action boundary
to distinguish these cases in a browser:

1. Product action handler fired.
2. Normalized payload created.
3. Provider dispatch received.
4. Provider item count changed.

Logs must be development-only or removed before the final commit.

## State Management Analysis

`CartProvider` owns a `useReducer` state and is mounted once at the root through
`CartShell`. There is no second provider around `CatalogMenu`, so `ProductCard`
and the cart surfaces should read the same Context instance.

The reducer returns new state objects for every action:

- `add` returns a new array and new item when needed, or maps to a new array
  when combining a matching key.
- `increment` maps to a new array.
- `decrement` returns a new filtered/mapped array.
- `remove` filters to a new array.
- `clear` returns the shared empty state object.
- `hydrate` calls `mergeCartItems`, which returns a new array.

There is no direct mutation bug in the reducer. Cart identity is also
deterministic: product ID plus canonical modifier group/option IDs. The payload
uses valid product UUIDs from Prisma and valid modifier UUIDs from the catalog.

The provider derives `itemCount`, subtotal, tax, and total from the same state
object and memoizes a new Context value when state changes. State updates should
therefore propagate to `CartTrigger`, `DesktopCart`, and `CartContent`.

## Hydration and localStorage Analysis

The provider starts empty, then reads localStorage in an effect and dispatches
`hydrate`. Persistence waits for `hydrated`, so the initial empty state should
not overwrite stored data. Hydration merges stored and in-memory items instead
of replacing them, and malformed localStorage is treated as empty.

This path can cause a brief initial empty display, but it should not erase an
item after a later click. The remaining risk is observability: the page can be
rendered before hydration, and the cart surfaces may initially show their empty
state. A real click after client hydration should still update the provider.

The browser response contains server-rendered product actions, but server HTML
cannot prove that the client event listeners attached. A browser-like component
test is required to exercise the actual `ProductCard` click path. The current
tests cover the provider and reducer in isolation, not the product button or
cart summary.

## Cart Surface Analysis

`CatalogMenu` owns a controlled `Sheet` and `cartOpen` state. `CartTrigger` is a
Radix `SheetTrigger`, while `CartContent` is rendered inside `SheetContent`.
The desktop summary is visible only at the `lg` breakpoint.

An add action does not automatically open the mobile Sheet. It only updates the
shared item count and displays a temporary product-card announcement. A user
who is below the desktop breakpoint must explicitly click the cart trigger to
inspect the line. If the trigger badge is missed or a browser event is not
attached, the interaction appears to have failed.

The most likely failure categories are therefore:

1. **Runtime hydration/listener failure:** the button HTML renders, but the
   client component did not hydrate or threw before attaching handlers.
2. **Presentation/feedback gap:** the reducer updates, but the cart is closed
   and the user receives no persistent visible cart line.
3. **Context update regression:** less likely from source inspection, but a
   component test must verify the real button and shared summary update.

The existing source does not show a direct state mutation or missing `use client`
directive. The diagnostic plan should prioritize component-level interaction
coverage and an explicit cart-open/visible-count assertion rather than replacing
the Context implementation prematurely.

## Recommended Repair Strategy

- Add a focused client component test that renders a representative product card
  and cart summary under one `CartProvider`.
- Click a direct-add action and assert the cart count and product name appear.
- Click a customizable action, select a required modifier, confirm, and assert
  modifier name and adjusted price appear in the same cart state.
- Control the Sheet state and open it after a successful add on compact layouts,
  or provide a clearly testable cart trigger update if automatic opening is not
  desired.
- Add temporary development-only logs around `add`, `addItem`, and the provider
  state transition if the component test does not reproduce the failure.
- Keep localStorage persistence and server-authoritative checkout unchanged.

## Verification Requirements

The fix must demonstrate:

- Signed-out users can add products.
- Direct-add products create visible cart lines.
- Customizable products can open the picker and create visible configured lines.
- Duplicate configurations combine, while different configurations remain
  separate.
- Cart changes remain after refresh through localStorage.
- No second CartProvider or authentication gate is introduced.
- `npm test`, lint, typecheck, and build pass.

## Out of Scope

This diagnosis does not change Prisma schema, checkout transactions, product
pricing, authentication, or image assets. It focuses on the client event-to-cart
state path and making successful additions observable.
