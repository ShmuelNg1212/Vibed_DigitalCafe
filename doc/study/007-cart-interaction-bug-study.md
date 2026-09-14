# Cart Interaction Bug Study

## Scope

Customers report that product add buttons do not add items to the cart and that
customizable products cannot be customized. This study traces the interaction
path without changing application code. The goal is to identify the most likely
failure modes and define a focused repair and verification plan.

## Current Interaction Path

The catalog is rendered by the client component `components/catalog-menu.tsx`.
Each `ProductCard` gets `addItem` from `useCart`:

```tsx
const { addItem } = useCart();
```

Non-customizable products call `add()` from the card button. Customizable
products toggle local `customizing` state, render `ModifierPicker`, and later
call the same `add()` callback with selected modifier snapshots. The reducer
creates a normalized cart item and the provider exposes the updated state to the
cart sidebar and sheet.

The provider is mounted globally through `components/cart-shell.tsx` in the root
layout. This is the correct scope for sharing cart state with `/checkout`, but
it introduced a hydration path that is relevant to the bug.

## Evidence Collected

- The server-rendered page contains product names and both `Add` and
  `Customize` controls, so the catalog query and product-card rendering path are
  working.
- Seeded products include modifier groups, and the page contains multiple
  `Customize` labels, so the customization branch is present in the rendered
  application.
- The root `CartProvider` is present around all application pages.
- The development server logs show only external Unsplash 404s, not a Prisma
  catalog failure or an application render exception.
- The reducer correctly supports `add`, `hydrate`, increment, decrement,
  remove, and clear actions in source inspection.
- The existing automated tests cover reducer behavior in isolation but do not
  mount `ProductCard`, click the real buttons, or exercise the provider's
  hydration lifecycle.

The symptom is therefore most likely a client interaction/lifecycle problem,
not missing database records or missing modifier data.

## Primary Suspected Cause: Hydration Race

`CartProvider` starts with an empty state and restores localStorage in an effect:

```tsx
useEffect(() => {
  dispatch({ type: "hydrate", items: readStoredItems() });
  const hydrationFrame = window.requestAnimationFrame(() => setHydrated(true));
  return () => window.cancelAnimationFrame(hydrationFrame);
}, []);
```

The same provider accepts clicks immediately after the first client render. If a
customer clicks `Add` or `Customize` while the initial hydration effect is
pending, the subsequent `hydrate` action can replace the reducer state with the
items read before that click. With an empty localStorage value, the newly added
item disappears. This is a real ordering bug because hydration is modeled as a
normal reducer action with no protection against user actions that occur before
it completes.

The race directly explains failed add operations. It can also make a customize
interaction appear broken when a customer selects a modifier and the provider
hydration reset occurs before the final add action: the local picker may close or
the resulting cart line may disappear immediately.

The current `hydrated` flag is exposed to consumers, but catalog controls remain
enabled while it is false. The UI does not prevent an interaction during the
unsafe window.

## Secondary Suspected Causes to Verify

### Real Client Click/Hydration Errors

The server HTML cannot prove that React successfully hydrated the controls. A
browser console or component test should verify that:

- `CartShell` hydrates without a mismatch.
- `useCart` resolves to the root provider.
- `ProductCard` click handlers are attached.
- No runtime error is thrown by `localStorage`, `requestAnimationFrame`, or
  the Radix Sheet primitives.

The provider currently catches localStorage read/write failures, which is good,
but does not surface hydration state or log an unexpected browser API issue.

### Missing Explicit Button Types

The card and modifier controls are not inside a form today, so omitted `type`
attributes are not the leading cause of this particular symptom. Nevertheless,
all interactive `Button` and native button controls should explicitly use
`type="button"` where they are not submissions. This removes an implicit HTML
behavior and prevents regressions when cards are later placed inside a form.

### Modifier Selection Constraints

The picker uses local state and computes `ready` from required group minimums.
The logic is reasonable for the current single-select groups, but it should be
verified with seeded required and optional groups. A required group with no
active options will remain impossible to submit; that should render a useful
availability message rather than look like an unresponsive button.

### CSS or Overlay Interference

The product image and card layout do not intentionally overlay the action row.
The Radix Sheet is closed by default, so its overlay should not intercept card
clicks. Browser-level testing should still inspect the element at the click
point and verify that no fixed overlay has an unexpected open state.

External image 404s are visible in the dev log but should be isolated to
`ProductImage`'s error fallback and should not prevent card event handlers. They
are an asset issue, not the likely cart state cause.

## State Management Assessment

The existing Context/reducer approach remains appropriate. Replacing it with
Zustand would not fix a hydration ordering problem; the important change is to
make hydration explicit and atomic.

Recommended provider behavior:

1. Start in a non-interactive or hydration-pending state.
2. Read and validate localStorage once.
3. Dispatch one hydrate action before exposing the interactive menu, or queue
   user actions until hydration completes.
4. Persist only after hydration is complete.
5. Enable add/customize controls once the state is safe.

The smallest robust implementation is to expose `hydrated` and make the menu
render a short client-side restoring state or disable card actions until it is
true. If preserving immediate interaction is important, the reducer can queue
actions, but that is more complex than the current UX requires.

The provider should also validate nested modifier fields during hydration, not
only top-level quantity and price fields. Persisted data is untrusted and can
contain stale or malformed modifier names, IDs, or deltas. The server remains
authoritative at checkout, but invalid local state should not break rendering.

## Recommended Fix Architecture

### Hydration Gate

Add a shared client menu shell or provider-level gate that prevents product
actions from being used before cart restoration completes. A visible, minimal
restoring state is preferable to silently dropping a customer's first click.
The page can still render product cards, but `Add` and `Customize` should be
disabled with a short accessible label until `hydrated` is true.

Alternatively, move the initial localStorage read into a client-only boundary
that renders the catalog only after hydration. This avoids disabled buttons but
causes a larger initial client transition. The disabled-action approach is less
disruptive to the existing menu.

### Explicit Interaction Contracts

- Set `type="button"` on card, modifier, quantity, remove, and cancel controls.
- Keep `ProductCard` responsible for adding complete configurations only.
- Keep modifier selection local until the customer confirms `Add to order`.
- Show a visible confirmation or cart-count update after a successful add.
- Show a message when a required modifier group has no active options.
- Keep the cart trigger and sidebar driven by the same provider instance.

### Test Coverage

Add component-level tests that mount a provider and a representative product:

- Click a direct-add product and assert one cart line appears.
- Click `Customize`, assert the modifier picker appears.
- Select a required option, assert the add action becomes enabled.
- Confirm the configured item and assert modifier IDs/names and price delta are
  present in the cart.
- Start with persisted localStorage data and click immediately; assert the
  action is disabled until hydration and the restored state is not overwritten.
- Exercise malformed storage and confirm the menu remains usable after the
  provider reaches hydrated state.

These tests should run in a browser-like environment because reducer-only tests
cannot detect missing event handlers, provider placement, or hydration races.

## Root Cause Conclusion

The most actionable confirmed defect in the source is that localStorage
hydration is asynchronous while cart and customization controls are enabled.
The provider can overwrite a newly-added item with the pre-click persisted
state. The codebase lacks component/browser tests to catch this race, so the
first repair should add a hydration gate and test the real click path.

If the bug persists after the gate, the next diagnostic step is a browser-level
runtime check for hydration errors or overlay interception. The current source
does not show evidence that sign-in, Prisma, product data, or checkout auth is
required to add or customize an item.

## Out of Scope

This bug cycle does not redesign checkout, change Prisma order transactions,
replace Context with Zustand, add payments, or solve external Unsplash 404s
beyond ensuring they do not block product interaction.
