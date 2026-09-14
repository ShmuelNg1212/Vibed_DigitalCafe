# Cart Not Opening Plan

This plan implements `doc/study/010-cart-not-opening-study.md`.

## Branch and Diagnosis

- [x] Inspect clean `main` and create:
      `git switch -c fix/cart-not-opening`.
- [x] Confirm the controlled sheet state is only opened by `CartTrigger` today.
- [x] Confirm `ProductCard` has no successful-add callback to `CatalogMenu`.

## Implementation

- [x] Add an optional `onAdded` callback to `ProductCard`.
- [x] Call `onAdded` after direct product adds.
- [x] Call `onAdded` after customized product adds.
- [x] Pass `() => setCartOpen(true)` from `CatalogMenu` to every product card.
- [x] Preserve the existing live add confirmation, shared Context state, and
      cart trigger behavior.
- [x] Do not add an authentication gate or change server-authoritative pricing.

## Tests and Verification

- [x] Add a menu-level component test that adds a direct product and verifies
      the controlled cart sheet opens and shows the line.
- [x] Add a customized add test that verifies the sheet opens with modifier text
      and adjusted display price.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- [x] Verify the flow at compact and desktop viewport layouts.
- [x] Verify `main` remains clean after merge.

## Documentation and Rendezvous

- [x] Check off this plan as tasks are completed.
- [x] Update `doc/wiki/architecture.md` with the add-to-cart-to-sheet callback.
- [x] Update `doc/wiki/setup.md` with the menu-level interaction test note.
- [x] Commit with a Conventional Commit such as
      `fix(cart): open cart after product add`.
- [x] Merge `fix/cart-not-opening` into `main`.
