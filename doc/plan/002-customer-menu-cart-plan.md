# Customer Menu and Shopping Cart Plan

This plan implements the decisions in
`doc/study/002-customer-menu-cart-study.md`. It is awaiting approval and must
not be executed until the next workflow phase is authorized.

## Preconditions and Branch

- [x] Review and approve this plan.
- [x] Confirm that the fixed Prisma enum taxonomy is acceptable for Phase 2:
      `COFFEE`, `ICED_DRINK`, and `PASTRY`, presented as Hot Coffee, Iced
      Drinks, and Bakery.
- [x] Confirm that the cart remains client-side and non-persistent for this
      phase.
- [x] From clean `main`, create and check out the feature branch:
      `git switch -c feat/customer-menu-cart`.

## Dependencies and UI Primitives

- [x] Inspect the existing shadcn/ui setup and add only the required primitives
      using the CLI, such as `sheet`, `badge`, `separator`, and `skeleton`.
- [x] Add a focused test runner if the repository does not yet have one, then
      install the minimum test dependencies needed for reducer and selector
      tests.
- [x] Verify the dependency install, lint, and typecheck before feature edits.

## Catalog Data and Seed

- [x] Add `ICED_DRINK` to the Prisma `ProductCategory` enum.
- [x] Create and apply a named Prisma migration for the enum change.
- [x] Update `getActiveCatalog` to return a typed, serializable customer menu
      view model with active products, category, description, image URL,
      integer price, and active modifier options in deterministic order.
- [x] Add a typed category presentation map with labels, descriptions, sort
      order, and placeholder visual treatment for Hot Coffee, Iced Drinks, and
      Bakery.
- [x] Expand `prisma/seed.ts` with deterministic sample products in every
      section, including at least one customizable drink, one drink without
      modifiers, one pastry, and representative placeholder/image data.
- [x] Run the seed and verify the catalog query returns all intended sections,
      excludes inactive products, and includes only active modifier options.

## Cart Domain and Provider

- [x] Define the normalized `CartItem` and selected-modifier types in a
      client-safe module that does not import Prisma.
- [x] Implement a canonical modifier-selection key that sorts group and option
      IDs so equivalent selections share one cart identity.
- [x] Implement a `useReducer` cart state machine with actions for add,
      increment, decrement, remove, and clear.
- [x] Ensure adding the same product/configuration combines quantities while
      different modifier configurations remain separate lines.
- [x] Calculate item count, per-line unit price, and subtotal using integer
      cents; remove lines when quantity reaches zero.
- [x] Add a `CartProvider` and `useCart` hook with a clear error when consumed
      outside the provider.
- [x] Mount the provider at the smallest client boundary that covers the menu
      header, catalog interactions, and cart UI without converting the page's
      Prisma data fetch into a client component.
- [x] Add reducer/selector tests covering add, combine, separate variants,
      quantity changes, removal, clearing, invalid quantities, item count, and
      subtotal.

## Product Presentation

- [x] Split the current monolithic `CatalogMenu` into focused components for
      category navigation, category section, product card, modifier selector,
      and cart trigger.
- [x] Build a responsive category navigation row with anchor links and an
      active/selected visual state that works on mobile.
- [x] Build product cards with shadcn/ui buttons/badges, placeholder imagery,
      descriptions, prices, modifier indication, and accessible add/customize
      actions.
- [x] Render products in the requested category order and use friendly labels
      instead of leaking enum names into the UI.
- [x] Handle products with no modifiers by adding directly to the cart.
- [x] Handle products with required or optional modifiers using a focused
      dialog or inline selector, validate required selections in the UI, and
      add the complete normalized configuration to the cart.
- [x] Show an accessible add confirmation or cart-count update without making
      animation the only feedback.
- [x] Add loading, empty-catalog, and catalog-error states appropriate to the
      server-rendered route.

## Cart Surface

- [x] Add the shadcn/ui `Sheet` component with title, description, close
      behavior, and focus management.
- [x] Build a cart trigger with item count, accessible label, and empty/nonempty
      visual states.
- [x] Build cart line items showing product name, selected modifier names,
      integer-cent prices, quantity controls, and remove actions.
- [x] Add subtotal and a clearly labeled checkout action.
- [x] Render the cart as a persistent sticky summary on desktop and as a
      slide-out sheet on mobile, sharing the same provider state.
- [x] Add an empty-cart state that directs customers back to the menu.
- [x] Ensure touch targets, focus rings, keyboard operation, and contrast meet
      accessible interaction expectations.

## Checkout Boundary Integration

- [x] Convert cart state into the existing checkout payload shape using product
      IDs, quantities, and modifier group/option IDs only.
- [x] Do not submit client-calculated prices as authoritative values.
- [x] Decide and implement the Phase 2 checkout handoff: either route to the
      existing authenticated order flow with serialized cart data, or disable
      the action with a clear not-yet-available message until checkout can
      consume the cart. Do not silently discard cart contents.
- [x] Verify that the existing server checkout service still rejects inactive
      products, invalid modifier selections, and stale IDs.

## Verification

- [x] Run the seeded application and manually verify all three menu sections on
      desktop and mobile widths.
- [x] Verify direct-add products, required modifiers, optional modifiers, and
      two configurations of the same product.
- [x] Verify cart quantity increment/decrement, remove, clear, subtotal, count,
      sheet open/close, and keyboard navigation.
- [x] Verify that a refresh behaves according to the documented non-persistent
      cart decision.
- [x] Run reducer/component tests and database seed/query checks.
- [x] Run `npm run lint`, `npm run typecheck`, and `npm run build`.
- [x] Inspect the production output to confirm Prisma/database modules do not
      enter browser bundles.

## Commit, Rendezvous, and Documentation

- [ ] Inspect `git status`, the complete diff, and recent commits before each
      incremental commit.
- [ ] Commit setup/schema changes with a Conventional Commit such as
      `feat(menu): add customer catalog categories`.
- [ ] Commit cart domain/UI changes with a Conventional Commit such as
      `feat(cart): add reducer and responsive cart sheet`.
- [ ] Merge `feat/customer-menu-cart` back into `main` only after all checks
      pass.
- [ ] Update `doc/wiki/architecture.md` with the menu and cart boundaries.
- [ ] Update `doc/wiki/setup.md` with any new test or seed commands.
- [ ] Add a concise cart/menu section to `doc/wiki/data-models.md` if the
      category enum or client payload semantics changed.
- [ ] Verify `main` is clean and the living docs match the resulting code.
