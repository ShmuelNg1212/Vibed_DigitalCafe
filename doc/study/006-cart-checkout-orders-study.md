# Cart, Checkout, and Order Submission Study

## Scope

Phase 6 turns the current client-only cart into a durable checkout flow. The
current application already has a React Context and reducer cart, modifier-aware
line identity, integer-cent subtotal calculation, a Prisma transaction-backed
`createOrder` service, and an authenticated `submitOrder` server action stub.
The gaps are persistence, customer detail capture, a usable checkout route, a
safe server action contract, and success confirmation.

The target flow is:

1. A customer adds products and modifier configurations to the cart.
2. The cart survives a browser refresh through versioned `localStorage` state.
3. The customer opens a dedicated checkout page, reviews the cart, and enters
   their name, email, and optional special instructions.
4. A server action validates customer details and cart IDs, re-reads current
   catalog prices and active modifiers, and creates an `Order` plus all related
   `OrderItem` and modifier snapshot rows in one Prisma transaction.
5. On success, the client clears its cart and redirects to a success page that
   displays the order number and purchased-item summary.

## Current Architecture and Gaps

### Cart

`CartProvider` uses `useReducer` and keeps state only in memory. It exposes
add, increment, decrement, remove, and clear operations, plus item count and
subtotal. `CartItem` contains display snapshots and selected modifier IDs, and
`cartItemsToCheckoutPayload` already strips the display-only values before
checkout.

The cart is mounted inside the home page's menu section. That is adequate for
menu interaction but means a dedicated `/checkout` route needs the provider at
an application shell or shared client boundary to read the same cart state.
Alternatively, the checkout page can hydrate the provider from localStorage
independently, but a single provider boundary is simpler and avoids two stores.

### Checkout and Orders

`createOrder` already validates the cart payload with Zod, loads active
products/modifiers inside a Prisma transaction, calculates integer-cent prices,
and creates the order with nested item/modifier snapshots. It currently accepts
only `userId` and item payload; it does not capture customer name, email, or
special instructions.

The `Order` model has no customer detail or instruction fields. An authenticated
session can identify an existing user, but the checkout requirements explicitly
capture name and email. The schema therefore needs a decision:

- Update the authenticated `User` profile from checkout and keep only `userId`
  on `Order`; or
- Snapshot `customerName`, `customerEmail`, and optional `specialInstructions`
  on `Order`.

The second approach is recommended for order auditability and future guest
checkout. A customer can change their profile later without changing the
contact details used for a historical order. `userId` remains useful for order
history, while snapshot fields make the order self-contained. This requires a
Prisma migration.

The existing `/orders` page displays order history, but there is no dedicated
checkout page, success page, or route for a single newly-created order. Those
routes should be added without exposing arbitrary order IDs to unauthorized
customers.

## Cart Persistence

### Storage Design

Use the existing React Context and reducer rather than introducing Zustand for
this phase. The reducer is already isolated and tested, and persistence can be
added at the provider boundary with a small `useEffect`. A new store library
would add dependency and hydration complexity without solving a problem the
current bounded cart cannot handle.

Persist only the normalized `CartState` under a namespaced key such as
`digital-cafe-cart` with a versioned envelope:

```ts
type PersistedCart = {
  version: 1;
  items: CartItem[];
};
```

On the client:

1. Start with an empty cart during the first render so the server and client
   markup match.
2. In an effect, read and parse the storage envelope.
3. Validate the shape, quantities, IDs, and modifier arrays before hydrating.
4. Dispatch a `hydrate` action or replace state with the sanitized items.
5. Mark hydration complete so the UI can avoid claiming the cart is empty while
   storage is being restored.
6. Persist state changes after hydration, catching quota/security errors without
   breaking cart interaction.

Do not read `window.localStorage` during render or lazy state initialization in
a way that changes server-rendered markup. Do not persist Prisma objects,
prices from the server as authoritative values, or raw checkout form data.

### Stale Data and Security

Persisted cart prices are display snapshots only. Catalog prices, active status,
modifier availability, and selection constraints must be re-read by the server
at checkout. A stale or tampered localStorage payload must result in a safe
validation error, not a trusted price.

Storage can contain malformed JSON or an older schema version. Invalid data
should be discarded and the user should receive an empty cart rather than a
crash. Keep the payload small and avoid personal information. LocalStorage is
not a secure storage mechanism, but these fields are not secrets and the server
still validates all order data.

### Derived Totals

The cart should expose subtotal, tax, and final total as derived display values.
Use integer cents throughout. Tax should use the same configured `TAX_RATE_BPS`
as the server checkout service, but the browser calculation is only an estimate
until the transaction recalculates it.

To prevent client/server drift, centralize the calculation formula in a shared
client-safe module that accepts line totals and tax rate basis points. The
server may import the pure function or reproduce the formula in server-only
code, but it must still derive line prices from Prisma records first.

The current cart has subtotal only and `TAX_RATE_BPS` is read at module load in
the checkout service. The implementation should validate a non-negative,
finite tax rate and use rounded integer cents consistently. At a zero local tax
rate, subtotal and total remain equal.

## Checkout Form and Validation

### Route Choice

Use a dedicated `/checkout` page rather than a sheet. Checkout needs enough
space for customer fields, validation messages, order review, and a clear
submission state. The cart sheet should link to the route and remain useful for
review, while the checkout page owns the authoritative form submission.

The checkout page needs access to the persisted cart. Mount `CartProvider` in a
shared client-side shell rendered by the root layout, or create a small
`CartShell` client component in the root layout that wraps page content. The
server-rendered catalog data can still be passed into the menu as props; only
cart consumers become client components.

### React Hook Form and Zod

Use React Hook Form with a Zod resolver for the client form. The schema should
capture:

- `name`: trimmed, required, reasonable maximum length.
- `email`: normalized and valid email address.
- `specialInstructions`: optional trimmed text with a bounded maximum length.

The project currently has Zod but not React Hook Form or `@hookform/resolvers`.
Add both as dependencies. The client schema can be shared with the server
action only if it stays free of browser-specific imports. The server must call
the same Zod schema independently because client validation is not a security
boundary.

The form should show field-level messages, preserve entered values after a
validation failure, disable duplicate submission while pending, and present a
non-field server error for unavailable products or invalid modifiers.

### Customer Identity

The current checkout action requires an authenticated session. The form should
pre-fill name/email from the current user if a server-side profile query is
added, but still validate submitted values. The server should use the session's
user ID rather than trusting a client-supplied user ID.

Guest checkout is out of scope for this phase. If no session exists, the
checkout route should provide a clear sign-in path and retain the client cart.

## Server Action and Transaction

The server action should receive a serializable object containing customer
details and normalized cart input. It must not receive or trust client subtotal,
tax, total, base prices, unit prices, or modifier price deltas.

Recommended boundary:

```ts
type SubmitOrderInput = {
  customer: {
    name: string;
    email: string;
    specialInstructions?: string;
  };
  items: CheckoutInput["items"];
};
```

The action should:

1. Require an authenticated session.
2. Parse customer details and item payload with server-side Zod schemas.
3. Pass the session user ID and parsed data to an order service.
4. In one Prisma transaction, load active products and modifier options.
5. Validate every product, quantity, modifier group, option, and selection
   range.
6. Recalculate unit prices, line totals, subtotal, tax, and total in integer
   cents.
7. Create the `Order` with customer snapshots and totals.
8. Create nested `OrderItem` and `OrderItemModifier` snapshots.
9. Return only the order ID/order number and a minimal success summary.

If any validation or database operation fails, the transaction must roll back
and the cart must remain intact. The action should return a typed failure shape
or throw a safe known error that the form can display. Avoid returning Prisma
objects directly across the server action boundary.

### Idempotency and Duplicate Submissions

The submit button must be disabled while pending, but UI protection is not a
complete duplicate-submission guarantee. Before payment integration, a simple
client submission lock is likely enough for this phase. A future idempotency key
or unique checkout token should be added before payment or fulfillment side
effects are introduced.

## Order Schema Changes

Add nullable or required snapshot fields according to the selected policy:

- `customerName String`
- `customerEmail String`
- `specialInstructions String?`

For authenticated checkout, these can be required on new orders. Existing local
databases may contain no orders, but migration safety still matters. Prisma
migration defaults or a nullable-first migration may be needed if deployed data
already exists. Add an index on `customerEmail` only if an operational query
requires it; user-scoped history should continue to use `userId`.

The order number already exists and is the appropriate human-readable ID for the
success page. Do not expose database implementation details as the customer
confirmation identifier.

## Post-Checkout UX

On a successful server action:

1. Receive `{ orderId, orderNumber }` from the action.
2. Clear the persisted cart only after the server confirms the transaction.
3. Redirect with `router.replace` to `/orders/success?order=...` or a route
   segment containing the order number.
4. Render a polished confirmation page with order number, status, date, item
   summary, subtotal/tax/total, and a link back to the menu or order history.
5. Scope any server-fetched order detail to the current session user so a user
   cannot view another customer's order by changing the URL.

The success route should not rely only on query-string totals or item names.
Fetch the created order server-side by order number/id and current user, then
render the persisted snapshots. If the order cannot be found, show a safe
not-found/expired confirmation state without leaking whether another user's
order exists.

Use `router.replace` rather than `push` so browser back does not resubmit the
checkout form. If redirect occurs before client cart clear, the success page or
checkout transition should clear it deterministically, but the preferred order
is server success, clear, then replace.

## Testing and Verification Strategy

### Unit Tests

- Cart persistence serialization/hydration accepts version 1 and rejects
  malformed or unsupported payloads.
- Cart reducer add, remove, quantity, subtotal, tax, and total behavior.
- Checkout Zod schema accepts valid details and rejects invalid email,
  overlong instructions, and empty names.
- Checkout payload excludes client-calculated monetary fields.

### Integration Tests

- Successful checkout creates exactly one order and expected item/modifier
  snapshots.
- Invalid or inactive product causes a rollback and creates no order.
- Invalid modifier selection causes a rollback and creates no order.
- Customer snapshot fields persist independently from later profile changes.
- User-scoped success/order detail cannot access another user's order.
- Repeated client submission is blocked while pending.

### Manual UX Checks

- Add items, reload, and confirm cart restoration.
- Adjust quantities and verify subtotal/tax/total.
- Open checkout from desktop sidebar and mobile sheet.
- Verify field errors, server errors, disabled pending state, and recovery.
- Complete an order and confirm cart clear plus success redirect.
- Refresh the success page and confirm the persisted order summary remains.

## Recommended Decisions

1. Keep React Context/reducer and add versioned localStorage persistence.
2. Add derived tax and total calculations in integer cents using `TAX_RATE_BPS`.
3. Add a dedicated `/checkout` page using React Hook Form and Zod.
4. Add customer name, email, and optional instructions snapshots to `Order`.
5. Extend the existing authenticated server action and Prisma transaction;
   never trust browser prices or user IDs.
6. Clear cart only after a successful transaction and redirect with
   `router.replace` to a user-scoped order success page.
7. Keep guest checkout and payment/idempotency infrastructure out of scope.

## Out of Scope

This phase does not implement payment processing, inventory reservation, guest
checkout, delivery scheduling, email notifications, full profile editing, or a
production-grade distributed idempotency service.
