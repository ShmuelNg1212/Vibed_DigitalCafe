# Cart Display Fix Plan

This plan implements `doc/study/009-cart-display-study.md`. It was approved and
executed on `fix/cart-display`.

## Preconditions and Branch

- [x] Review and approve this plan.
- [x] Confirm signed-out add/customize behavior remains unchanged.
- [x] From clean `main`, create and check out:
      `git switch -c fix/cart-display`.

## Reproduction and State Verification

- [x] Reproduce direct-add and customizable-add behavior at mobile and desktop
      viewport widths.
- [x] Inspect `localStorage` and confirm `digital-cafe-cart` changes after an
      add.
- [x] Add a focused cart summary test that reads the same provider as the menu
      and asserts item count and product line content.
- [x] Confirm the reducer and provider retain added lines through hydration.

## Cart Visibility and Feedback

- [x] Make the cart sheet controlled by `CatalogMenu` state.
- [x] Keep the cart trigger visible and give it an accessible count label in
      empty and non-empty states.
- [x] Open the mobile cart sheet after a successful add.
- [x] Keep the desktop summary synchronized with the same provider state.
- [x] Add an `aria-live="polite"` confirmation after direct and customized adds.
- [x] Ensure customization closes only after the configured line is accepted.
- [x] Preserve the empty state when no items exist.

## Component Tests

- [x] Add a focused test harness for a product action and cart summary using
      the existing jsdom Testing Library setup.
- [x] Test direct add increments visible cart count and renders product name.
- [x] Test customized add renders selected modifier names and the adjusted
      display price.
- [x] Test duplicate configurations combine and distinct configurations remain
      separate.
- [x] Test cart trigger/sheet content uses the same provider state.
- [x] Retain hydration and reducer tests.

## Verification

- [x] Verify direct-add on mobile and desktop without authentication.
- [x] Verify required and optional customization updates the cart visibly.
- [x] Verify quantity changes, remove, persisted refresh, and clear behavior.
- [x] Verify add announcement and cart trigger accessible labels.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- [x] Inspect the diff for duplicate providers, auth gates, and client/server
      boundary regressions.

## Commit, Rendezvous, and Sync Docs

- [ ] Inspect `git status`, full diff, and recent commits before committing.
- [ ] Commit the fix with a Conventional Commit such as
      `fix(cart): show added items in cart surfaces`.
- [ ] Update `doc/wiki/architecture.md` with the controlled cart surface and
      add-feedback contract.
- [ ] Update `doc/wiki/setup.md` with any new component-test workflow.
- [ ] Merge `fix/cart-display` into `main` after all checks pass.
- [ ] Verify `main` is clean and added lines are visible in the cart.
