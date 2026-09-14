# Cart Interaction Bug Plan

This plan addresses the add/customize failure documented in
`doc/study/007-cart-interaction-bug-study.md`. It was approved and executed on
`fix/cart-interactions`.

## Preconditions and Branch

- [x] Review and approve this plan.
- [x] Confirm the intended behavior: signed-out visitors can add and customize
      products; authentication is required only at checkout.
- [x] From clean `main`, create and check out:
      `git switch -c fix/cart-interactions`.

## Reproduce the Client Failure

- [x] Start the configured database and Next.js dev server using the same
      environment, then open the menu in a browser.
- [x] Click a direct-add product immediately after page load and after
      hydration; record whether the cart count and cart line update.
- [x] Click a customizable product, verify the picker opens, select a required
      option, and verify `Add to order` becomes enabled.
- [x] Confirm a configured cart line contains the selected modifier and the
      expected display price.
- [x] Inspect browser console and Next dev logs for hydration, runtime, or
      overlay errors during both flows.
- [x] Verify localStorage state before and after each click.

## Hydration Race Fix

- [x] Make the cart hydration lifecycle explicit and atomic.
- [x] Prevent add, customize, modifier confirmation, quantity, and remove
      controls from acting before `CartProvider.hydrated` is true.
- [x] Choose a clear UX for the pending window: disable actions with an
      accessible restoring label or render a brief client restoring state.
- [x] Ensure the hydration action cannot overwrite an interaction that has
      already been accepted.
- [x] Persist state only after hydration has completed.
- [x] Validate nested persisted modifier fields and discard malformed line items
      without breaking the menu.
- [x] Preserve signed-out cart access and do not add an authentication check to
      product interactions.

## Explicit Interaction and Modifier Controls

- [x] Add `type="button"` to all non-submit card, modifier, quantity, remove,
      and cancel controls.
- [x] Keep direct-add products adding one normalized cart item.
- [x] Keep customizable products opening the picker without adding an
      incomplete line.
- [x] Ensure required modifier groups with active options enable confirmation
      only after valid selections.
- [x] Show a useful unavailable-options state when a required group has no
      selectable active options.
- [x] Add visible add confirmation or a reliably updated cart count after a
      successful add.
- [x] Confirm the desktop sidebar, mobile sheet, and checkout page consume the
      same provider instance.

## Component and Browser-Like Tests

- [x] Add a browser-like component test setup if the current Vitest node
      environment cannot mount client components.
- [x] Test direct-add click behavior through `ProductCard`.
- [x] Test customize opening, required option selection, and configured add.
- [x] Test modifier price deltas and modifier-aware separate cart keys.
- [x] Test hydration with an existing valid localStorage payload.
- [x] Test an immediate pre-hydration click and verify it is disabled or safely
      preserved, never overwritten.
- [x] Test malformed localStorage and verify the controls become usable after
      hydration.
- [x] Retain reducer unit tests for pure state transitions.

## Verification and Diagnostics

- [x] Verify direct-add behavior for a product without modifiers on desktop and
      mobile widths.
- [x] Verify customization for required milk and optional modifier groups.
- [x] Verify cart count, sidebar/sheet line items, quantity controls, remove,
      localStorage persistence, and refresh restoration.
- [x] Verify no sign-in is required before adding or customizing.
- [x] Verify external image 404s fall back without blocking card events.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- [x] Inspect the full diff for accidental auth gates, client/server boundary
      violations, or untrusted price changes.

## Commit, Rendezvous, and Documentation Sync

- [ ] Inspect `git status`, full diff, and recent commits before committing.
- [ ] Commit the interaction fix with a Conventional Commit such as
      `fix(cart): prevent hydration from dropping menu interactions`.
- [ ] Update `doc/wiki/architecture.md` with the cart hydration interaction
      contract if the provider boundary changes.
- [ ] Update `doc/wiki/setup.md` with the browser-like interaction test command
      if a new test dependency is added.
- [ ] Merge `fix/cart-interactions` into `main` only after all checks pass.
- [ ] Verify `main` is clean and direct-add/customize flows work without sign-in.
