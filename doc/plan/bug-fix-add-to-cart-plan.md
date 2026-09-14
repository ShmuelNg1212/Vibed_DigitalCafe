# Add-to-Cart Bug-Fix Plan

This plan implements `doc/study/bug-fix-add-to-cart-study.md`. It was approved
and executed on `fix/add-to-cart`.

## Preconditions and Branch

- [x] Review and approve this plan.
- [x] Confirm signed-out visitors may add and customize products, with sign-in
      required only at checkout.
- [x] From clean `main`, create and check out:
      `git switch -c fix/add-to-cart`.

## Reproduce and Instrument

- [x] Run the configured database and Next.js dev server with the same
      environment.
- [x] Add a direct-add product and inspect browser console, cart trigger count,
      desktop summary, and `digital-cafe-cart` localStorage.
- [x] Open a customizable product, select a required option, confirm the item,
      and inspect the same state surfaces.
- [x] Add temporary development-only logs in
      `components/catalog-menu.tsx` around `ProductCard.add` and in
      `lib/cart/context.tsx` around `addItem`/state changes if component tests
      do not isolate the failure.
- [x] Remove diagnostic logs before committing unless they provide intentional
      non-sensitive development diagnostics.

## Client and State Fix

- [x] Preserve the existing `"use client"` boundaries in
      `components/catalog-menu.tsx` and `components/cart-shell.tsx`.
- [x] Verify `app/layout.tsx` provides exactly one `CartShell`/`CartProvider`.
- [x] Verify `ProductCard.add` passes product ID, name, base price, modifier
      snapshots, and calculated display unit price.
- [x] Verify `CartProvider` dispatches `add` and the reducer returns a new state
      object rather than mutating existing arrays/items.
- [x] Verify the hydration merge path cannot replace a newly-added line.
- [x] Preserve localStorage persistence while ensuring malformed storage does
      not block interaction.

## Visible Cart Interaction

- [x] Add a focused cart summary test consuming the same Context instance as a
      product card.
- [x] Assert direct add updates item count and renders the product line.
- [x] Assert customized add updates item count, modifier text, and display
      price.
- [x] Assert duplicate configuration quantity merging and distinct modifier
      variants.
- [x] Ensure the controlled Sheet opens or is directly triggerable after add,
      and that the desktop summary reads the updated provider state.
- [x] Keep an accessible `aria-live` add confirmation and accessible cart count.
- [x] Verify no authentication check is added to product actions.

## Verification

- [x] Run direct and customized add flows at mobile and desktop widths.
- [x] Verify cart item count, line content, modifier text, prices, quantity
      controls, remove, clear, and refresh persistence.
- [x] Verify localStorage is updated after the reducer state changes.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- [x] Inspect the diff for duplicate providers, direct state mutation, missing
      client directives, accidental auth gates, and temporary logs.

## Commit, Rendezvous, and Sync Docs

- [x] Inspect `git status`, full diff, and recent commits before committing.
- [x] Commit the fix with a Conventional Commit such as
      `fix(cart): repair add-to-cart state flow`.
- [x] Update `doc/wiki/architecture.md` with any confirmed client/state fix.
- [x] Update `doc/wiki/setup.md` with any new component-test command.
- [x] Merge `fix/add-to-cart` into `main` only after all checks pass.
- [x] Verify `main` is clean and direct/customized cart additions are visible.
