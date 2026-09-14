# Cart, Checkout, and Order Submission Plan

This plan implements `doc/study/006-cart-checkout-orders-study.md`. It was
approved and executed on `feat/cart-checkout-orders`.

## Preconditions and Branch

- [x] Review and approve this plan.
- [x] Confirm authenticated checkout remains required and guest checkout stays
      out of scope.
- [x] Confirm `customerName`, `customerEmail`, and optional
      `specialInstructions` should be persisted as order snapshots.
- [x] From clean `main`, create and check out:
      `git switch -c feat/cart-checkout-orders`.

## Dependencies and Shared Validation

- [x] Add `react-hook-form` and `@hookform/resolvers` dependencies.
- [x] Verify the existing Zod version and choose a compatible resolver API.
- [x] Add a shared checkout/customer schema for name, email, instructions, and
      cart items without importing browser-only modules.
- [x] Add a typed server-action result/error shape that does not expose Prisma
      objects or raw database errors.
- [x] Run lint and typecheck before feature implementation.

## Prisma Order Snapshot Fields

- [x] Add `customerName`, `customerEmail`, and nullable
      `specialInstructions` to the Prisma `Order` model.
- [x] Choose safe nullability/default behavior for existing order rows.
- [x] Add and apply a named migration for the order snapshot fields.
- [x] Generate and validate the Prisma client.
- [x] Update order queries and any order UI to use the persisted snapshot fields
      where appropriate.

## Persistent Cart State

- [x] Add a versioned storage envelope and namespaced localStorage key.
- [x] Add a cart `hydrate` action or equivalent state replacement path.
- [x] Implement safe JSON parsing and shape validation for persisted cart data.
- [x] Discard malformed, unsupported-version, invalid-quantity, or invalid-item
      entries without crashing the app.
- [x] Add provider hydration state so the server/client render remains stable and
      the UI does not overwrite localStorage before restoration completes.
- [x] Persist cart changes only after hydration and tolerate storage quota or
      browser privacy errors.
- [x] Keep only normalized cart data in localStorage; never persist checkout
      customer details or authoritative monetary values.
- [x] Add derived integer-cent subtotal, tax, and total selectors using
      `TAX_RATE_BPS` as a display estimate.
- [x] Add tests for persistence round trips, invalid payloads, hydration, tax,
      total, and clear behavior.

## Shared Cart Shell and Checkout Page

- [x] Move `CartProvider` to a shared client shell that covers the menu and
      `/checkout` route without moving Prisma catalog fetching into the client.
- [x] Update the cart sheet/sidebar checkout action to navigate to `/checkout`
      while preserving the persisted cart.
- [x] Create `/checkout/page.tsx` with a responsive customer-details form and
      order review.
- [x] Use React Hook Form with the Zod resolver for name, email, and optional
      special instructions.
- [x] Show field-level validation messages, cart-empty guidance, server errors,
      and a pending submit state.
- [x] Show line items, selected modifier names, quantity controls, subtotal,
      estimated tax, and estimated total.
- [x] Require a valid authenticated session before submitting and provide a
      sign-in path that does not discard the cart.
- [x] Add loading/error boundaries appropriate to the checkout route.

## Secure Server Action and Transaction

- [x] Replace the current `submitOrder` stub with a server action accepting only
      customer details and normalized product/modifier IDs and quantities.
- [x] Require the current authenticated session and derive `userId` from the
      signed session cookie, never from the browser payload.
- [x] Validate customer details and cart items again on the server with Zod.
- [x] Extend `createOrder` to persist customer snapshots and optional
      instructions.
- [x] Keep all product/modifier re-reads, selection validation, price
      calculation, tax calculation, order creation, item creation, and modifier
      snapshot creation inside one Prisma transaction.
- [x] Ensure browser subtotal, tax, total, unit prices, base prices, and modifier
      deltas are ignored.
- [x] Return a minimal serializable success result with order ID and order
      number, or a safe typed failure result.
- [x] Verify transaction rollback on unavailable product, inactive modifier,
      invalid selection, invalid quantity, and database failure.
- [x] Disable duplicate submit while the action is pending and document that a
      durable idempotency key remains a future payment prerequisite.

## Success Page and Order Detail

- [x] Add a user-scoped order lookup by order number or ID for the confirmation
      route.
- [x] Create `/orders/success` with a polished confirmation layout, order
      number, status, date, item/modifier summary, subtotal, tax, and total.
- [x] Ensure the success page cannot render another user's order by changing a
      query parameter.
- [x] Clear the persisted cart only after successful server confirmation.
- [x] Redirect with `router.replace` after clearing the cart so checkout is not
      resubmitted through browser back navigation.
- [x] Add safe not-found and expired-confirmation states.
- [x] Add links back to the menu and order history.

## Verification

- [ ] Run migrations and seed against the configured local database.
- [ ] Test cart add/remove/increment/decrement, refresh persistence, malformed
      localStorage, clear, subtotal, tax, and total.
- [ ] Test checkout form validation and pending/error recovery.
- [ ] Complete an authenticated checkout and verify one order, expected item
      rows, modifier snapshots, customer snapshots, totals, and success redirect.
- [ ] Verify cart clears only after successful order creation.
- [ ] Verify failed checkout preserves the cart.
- [ ] Verify inactive/stale products and invalid modifiers roll back without
      creating partial orders.
- [ ] Verify another user's order cannot be viewed on the success route.
- [ ] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- [ ] Inspect the full diff for secrets, client-side Prisma imports, and
      untrusted monetary values crossing the server action.

## Commit, Rendezvous, and Documentation Sync

- [ ] Inspect `git status`, the complete diff, and recent commits before each
      commit.
- [ ] Commit schema/server changes with a Conventional Commit such as
      `feat(orders): add transactional checkout submission`.
- [ ] Commit cart persistence/UI changes with a Conventional Commit such as
      `feat(cart): persist cart and add checkout form`.
- [ ] Update `doc/wiki/setup.md` with checkout/test commands and localStorage
      behavior.
- [ ] Update `doc/wiki/architecture.md` with cart shell, server action, and
      success-page boundaries.
- [ ] Update `doc/wiki/data-models.md` with order customer snapshots and
      transaction semantics.
- [ ] Merge `feat/cart-checkout-orders` back into `main` only after all checks
      pass.
- [ ] Verify `main` is clean and the complete checkout workflow works locally.
