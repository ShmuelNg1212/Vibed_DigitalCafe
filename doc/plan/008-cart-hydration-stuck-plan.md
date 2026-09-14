# Cart Hydration Stuck Plan

This plan implements `doc/study/008-cart-hydration-stuck-study.md`. It was
approved and executed on `fix/cart-hydration-stuck`.

## Preconditions and Branch

- [x] Review and approve this plan.
- [x] Confirm signed-out product add/customize actions must remain available.
- [x] From clean `main`, create and check out:
      `git switch -c fix/cart-hydration-stuck`.

## Reproduction and Diagnosis

- [x] Open the live menu and verify whether `Restoring...` remains after the
      client should have hydrated.
- [x] Inspect browser console and Next dev logs for hydration/runtime errors.
- [x] Verify product data and action controls are present in the server response.
- [x] Inspect localStorage availability and current `digital-cafe-cart` value.
- [x] Confirm the failure is independent of database seeding and sign-in state.

## State Fix

- [x] Add a pure reducer merge path for localStorage hydration.
- [x] Preserve in-memory actions that occur before the storage read completes.
- [x] Combine quantities for matching cart keys rather than replacing current
      state with stored state.
- [x] Remove the `requestAnimationFrame` dependency from hydration completion.
- [x] Mark the provider hydrated immediately after the storage read attempt,
      including empty, malformed, unavailable, and throwing storage cases.
- [x] Keep persistence disabled until hydration is complete so initial state does
      not overwrite stored data.
- [x] Keep all cart interactions signed-out and client-only.

## Test Coverage

- [x] Add reducer tests for storage/current line merging and quantity behavior.
- [x] Add provider tests for immediate hydration completion without animation
      frame scheduling.
- [x] Add provider tests for an add before hydration and verify it survives.
- [x] Add provider tests for malformed and unavailable localStorage.
- [x] Verify persisted state is written only after merged hydration.
- [x] Keep direct-add and modifier-aware reducer tests passing.

## Verification

- [x] Verify the menu changes from `Restoring...` to `Add`/`Customize` in a live
      browser session.
- [x] Verify direct-add products add one line without sign-in.
- [x] Verify customizable products open, accept required options, and add a
      configured line with modifier pricing.
- [x] Verify existing localStorage lines and immediate new actions are retained.
- [x] Verify localStorage failures do not disable interactions.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- [x] Inspect the full diff for accidental auth gates or price authority changes.

## Commit, Rendezvous, and Sync Docs

- [ ] Inspect `git status`, full diff, and recent commits before committing.
- [ ] Commit the fix with a Conventional Commit such as
      `fix(cart): make hydration completion reliable`.
- [ ] Update `doc/wiki/architecture.md` with the merge-based hydration contract.
- [ ] Update `doc/wiki/setup.md` with the hydration regression test command if
      the test workflow changes.
- [ ] Merge `fix/cart-hydration-stuck` into `main` after all checks pass.
- [ ] Verify `main` is clean and the live menu actions are usable.
