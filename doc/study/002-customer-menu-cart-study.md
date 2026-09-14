# Customer Menu and Shopping Cart Study

## Scope

Phase 2 turns the current catalog prototype into a reusable customer menu and
shopping-cart experience. The existing application already has a dynamic home
page, a Prisma-backed `getActiveCatalog` query, a `CatalogMenu` client
component, and a basic in-component cart. The phase should preserve the
server-authoritative pricing boundary while separating catalog presentation,
cart state, modifier selection, and cart review into maintainable units.

The target experience is a responsive cafe menu grouped into customer-facing
categories such as Hot Coffee, Iced Drinks, and Bakery. Customers should be
able to inspect product details, choose modifiers, add distinct configurations
to a cart, adjust quantities, and see an accurate subtotal in a persistent
sidebar or slide-out cart.

## Current Constraints and Gaps

The current schema has a `ProductCategory` enum with only `COFFEE` and
`PASTRY`. That is sufficient for the first seed data but cannot express the
requested presentation categories without either adding an `ICED_DRINK`
category or introducing a more flexible category model. The existing
`Product.imageUrl` field can support imagery, but current seed records do not
populate it and the UI does not render it.

The current `CatalogMenu` component keeps cart state in local React state and
uses only `productId` as the cart identity. That incorrectly merges two
configurations of the same product, such as a latte with whole milk and a
latte with oat milk. It also keeps catalog rendering, modifier selection, cart
mutations, and cart display in one component, which makes a slide-out cart and
future checkout payload difficult to evolve.

The existing checkout service already recalculates prices from Prisma records,
validates active modifiers, and stores snapshots. The client cart must therefore
carry product IDs, quantities, and modifier option IDs, but must not become the
source of truth for prices or totals at order creation time.

## Data Fetching Architecture

### Server Component Reads

The public menu should remain a server-rendered read. The route-level server
component should call a server-only catalog query, serialize only the fields
needed by the client boundary, and pass those records to the interactive menu.
This preserves the current architecture:

1. Query active products from Prisma on the server.
2. Include active modifier groups and active options in stable sort order.
3. Group or filter products by customer-facing category.
4. Pass serializable product view models to client components.

Server Components are the best default for the initial page because catalog
data is read-heavy, does not need browser credentials, and can be rendered
without a loading waterfall. A `revalidate` policy can be added later if
catalog freshness requirements allow caching; `force-dynamic` remains valid
while administrators can change availability during development.

The query should return a category key and presentation fields such as
`imageUrl`, description, price in cents, and modifiers. Formatting dollars and
choosing placeholder image treatment belong in the UI layer, not the Prisma
query.

### Server Actions and Route Handlers

Server Actions are appropriate for mutations that belong directly to the UI,
such as a future admin availability toggle. They are not necessary for every
cart interaction because adding or removing a local cart item should not write
to the database. The existing checkout route/server service remains the
boundary that validates IDs, active records, modifier constraints, and prices.

If the cart needs persistence in a later phase, a server action or route handler
can accept the same normalized cart payload. Phase 2 should avoid persistence
until authentication and checkout semantics require it.

### Failure and Empty States

The menu route should distinguish an empty active catalog from a database read
failure. The page can render a friendly empty state when there are no products,
while an `error.tsx` boundary handles unexpected server failures. A loading
boundary is useful if the route becomes dynamic or the query is moved behind a
streamed section.

## Product Category Strategy

There are two viable approaches:

### Extend the Enum

Add `ICED_DRINK` to `ProductCategory`, keep `COFFEE` for hot coffee, and map
`PASTRY` to the Bakery section. This is the smallest change and preserves typed
Prisma filtering. The UI can display friendly labels independently of enum
names.

The tradeoff is that every future merchandising category requires a Prisma
enum migration. For a focused cafe menu with a small, controlled taxonomy, that
constraint is acceptable and clearer than arbitrary strings.

### Add a Category Model

Create a `Category` model with a slug, display name, sort order, and active
flag, then relate products to it. This supports admin-managed categories and
custom ordering without schema changes.

The tradeoff is additional migration and seed complexity for a requirement that
currently names a small fixed set of categories. It should be deferred unless
category management is part of the near-term admin scope.

### Recommendation

Extend the enum for Phase 2 with `ICED_DRINK`, seed all three customer-facing
sections, and maintain a presentation mapping in a typed catalog module. Keep
the category model as a future study if merchandising becomes administrator
managed.

## Menu UI and UX

The menu should have a clear hierarchy rather than a generic product grid:

- A compact header can expose the Digital Cafe identity, menu anchor, orders,
  and cart trigger.
- A category navigation strip can jump to Hot Coffee, Iced Drinks, and Bakery
  sections on smaller screens.
- Each category section should show a title, short supporting label, item count,
  and responsive product grid.
- Each product card should show a placeholder image treatment, product name,
  concise description, formatted base price, modifier availability, and a
  strong add/customize action.
- Modifier selection should be explicit when a product has required groups.
  Optional modifiers can be represented with a clear skip path.
- The UI should show a small confirmation state after adding an item, such as a
  cart count update or toast, without relying on animation for meaning.

Placeholder imagery should use a deterministic visual treatment based on the
product category rather than remote image URLs that may fail or require an
additional image host configuration. A local gradient, category icon, or
`imageUrl` with a fallback can satisfy the requirement without introducing
external asset dependencies. If `imageUrl` is rendered with `next/image`, the
implementation must configure trusted remote hosts or use local assets.

Tailwind should provide layout, spacing, responsive breakpoints, and states.
shadcn/ui primitives should be used for reusable buttons, sheet/dialog,
separator, badge, and any toast or empty-state primitives added during the
phase. Domain components should remain outside `components/ui`.

The menu should remain usable on narrow screens: product cards collapse to one
column, category navigation can scroll horizontally, and the cart becomes a
sheet rather than forcing a permanently visible sidebar.

## Cart State Management

### React Context with Reducer

React Context plus `useReducer` provides a dependency-free, explicit state
machine. It is adequate when the cart is only needed in the menu subtree and
keeps the state transitions easy to test. It can expose actions such as
`addItem`, `removeItem`, `incrementItem`, `decrementItem`, `clearCart`, and
derived selectors such as item count and subtotal.

The main cost is provider placement and rerender behavior. A context value that
contains the entire cart causes all consumers to rerender for every quantity
change unless the context is split or selectors are introduced.

### Zustand

Zustand would provide a small external store with selective subscriptions and
convenient persistence middleware. It is attractive if the cart must be shared
across many unrelated route segments or persisted to local storage.

The tradeoff is adding a state library for one bounded interaction and making
hydration/persistence behavior an explicit concern in a Next.js App Router
application. It also adds another convention to a small codebase.

### Standard Hooks in the Existing Component

Keeping `useState` in `CatalogMenu` is the smallest immediate change, but it
does not scale to a header cart trigger, a sheet rendered outside the menu
grid, or a future checkout page. It also makes cart logic difficult to test in
isolation.

### Recommendation

Use a client-only `CartProvider` backed by `useReducer` for Phase 2. The cart
is currently scoped to the customer menu experience, so Context avoids a new
dependency while giving the header, product cards, modifier dialog, and cart
sheet a shared API. Keep the provider near the route layout or menu shell so
the entire customer menu can access it without making server components
client components.

Use a normalized cart item shape:

```ts
type CartItem = {
  key: string;
  productId: string;
  productName: string;
  quantity: number;
  basePriceCents: number;
  selectedModifiers: Array<{
    groupId: string;
    optionIds: string[];
    names: string[];
    priceDeltaCents: number;
  }>;
  unitPriceCents: number;
};
```

The `key` must be derived from the product ID and a canonical sorted modifier
selection. Two identical configurations should combine quantities; different
configurations should remain separate line items. `unitPriceCents` and
subtotal are useful for display only. Checkout must send IDs and quantities to
the server and recalculate the authoritative price.

The reducer should clamp or reject non-positive quantities, remove an item at
zero, and use integer cents for all calculations. Local storage persistence is
not recommended for the first implementation because it introduces stale
catalog and hydration edge cases. It can be added later with an explicit
versioned storage format.

## Cart UI

Use a shadcn/ui `Sheet` as the primary cart surface:

- Desktop: a sticky cart summary sidebar can remain visible beside the menu,
  while the same provider powers the sheet for a consistent interaction.
- Mobile: a floating or header cart trigger opens the sheet from the right or
  bottom, showing line items and quantity controls.
- Empty cart: show an inviting message and a link or button that closes the
  sheet and returns focus to the menu.
- Non-empty cart: show each product, modifier summary, unit price, quantity
  decrement/increment controls, remove affordance, subtotal, and a checkout
  button.
- The cart count should be visible on the trigger and use an accessible label.

Use `SheetTitle` and `SheetDescription` so the overlay is accessible. Quantity
buttons should have explicit labels, a sufficiently large touch target, and
keyboard focus styles. The checkout action should navigate to the existing
order flow only once a real checkout payload is wired; the plan should avoid
pretending that client-only cart contents have already been persisted.

## Testing and Verification Strategy

The reducer and cart selectors should have focused tests for:

- Adding a new item.
- Combining identical product/modifier configurations.
- Keeping different modifier configurations separate.
- Incrementing, decrementing, removing, and clearing items.
- Calculating item count and integer-cent subtotal.
- Rejecting invalid quantities.

The catalog query and rendering should be checked with seeded records for all
three categories, active/inactive products, products with and without
modifiers, and missing descriptions/images. The production build and typecheck
must confirm that Prisma remains server-only and that serializable data is the
only boundary passed to client components.

## Recommended Decisions

1. Extend `ProductCategory` with `ICED_DRINK`; keep a typed presentation map
   for Hot Coffee, Iced Drinks, and Bakery.
2. Keep catalog reads in a server component backed by the existing server-only
   Prisma query, with a focused serializable view model.
3. Replace the local `CatalogMenu` cart with a `CartProvider` and reducer.
4. Derive cart identity from product plus canonical modifier selections.
5. Use shadcn/ui `Sheet` for the mobile cart and a responsive persistent
   summary for desktop.
6. Use deterministic local placeholder imagery and preserve `imageUrl` as an
   optional future asset source.
7. Keep cart state client-side for this phase; let checkout recalculate all
   authoritative prices on the server.

## Out of Scope

This phase does not implement payment, inventory reservation, guest checkout,
cart persistence, a full admin category editor, or changes to order pricing
semantics. It should prepare a normalized payload for the existing checkout
service without weakening its validation or snapshot guarantees.
