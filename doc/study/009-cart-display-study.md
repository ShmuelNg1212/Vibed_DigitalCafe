# Cart Display Bug Study

## Scope

Customers can interact with product actions, but added lines are not appearing
in the visible cart. This study traces the cart mutation, provider scope, cart
trigger, sheet, and desktop summary to identify why a successful reducer update
may not be observable.

## Current Data Flow

1. `ProductCard` calls `addItem` from `useCart`.
2. `CartProvider` in the root `CartShell` dispatches an `add` action.
3. The reducer returns a new `CartState` with the line item.
4. `CartProvider` calculates `itemCount`, subtotal, tax, and total from the new
   state.
5. `CartTrigger`, `DesktopCart`, and `CartContent` read the same provider.

The root provider scope is correct. There is no second provider around the
catalog after the hydration fix, so the menu and cart surfaces should share
state.

## Observed Risks

### Cart Surface Visibility Is Ambiguous

The mobile/cart trigger only renders the item count badge when `itemCount > 0`.
The desktop cart is hidden below the `lg` breakpoint. A customer on a narrow
viewport therefore needs to notice the small `Order` trigger, while a customer
on a larger viewport sees the sidebar. This can feel like the cart did not
update even when the state changed.

### The Sheet Is Not Explicitly Controlled

The cart sheet uses Radix's uncontrolled root. The trigger opens it, but the
product add action does not open the cart or provide confirmation. A successful
add can therefore occur with no visible cart change if the customer is looking
at the menu and not the trigger badge/sidebar.

### No Product-Level Confirmation

`ProductCard.add()` dispatches the item and immediately closes customization.
There is no `Added` state, toast, announcement, or automatic cart opening. The
cart line can be present while the interaction gives no local feedback.

### Hydration and Persistence Timing

The provider now merges localStorage items with current state and completes
hydration promptly. That should preserve an added line, but the current tests
only test provider state, not a cart surface reacting to `addItem`. A regression
test must mount a representative menu/cart view and assert that the visible
item count and line content change after the add action.

## Root Cause Hypothesis

The most likely defect is not the reducer. It is the lack of an observable cart
transition: the cart is represented by a hidden desktop/mobile-dependent
surface, a conditional badge, and an uncontrolled sheet that does not open on
add. The current UI gives no guaranteed visible confirmation that the line was
accepted.

The fix should make the cart state visibly observable and make the cart surface
easy to inspect:

- Keep a persistent cart trigger with a count, including zero state.
- Show an accessible live announcement after an item is added.
- Open the cart sheet after a successful add on small screens.
- Keep the desktop summary synchronized with the same provider.
- Add component-level coverage that clicks a real product action and asserts
  cart count/line content.

This also makes any future state failure obvious: if the live count does not
change, the test catches the provider/action issue; if it changes but the sheet
does not show the line, the test catches the presentation issue.

## Recommended Design

Use a controlled `Sheet` state inside `CatalogMenu`:

1. `CatalogMenu` owns `cartOpen`.
2. `CartTrigger` receives the current count and opens the sheet.
3. `ProductCard` receives an `onAdded` callback.
4. After `addItem`, the callback sets an accessible announcement and opens the
   sheet on narrow layouts. Desktop users still see the persistent summary.
5. The cart trigger always exposes a meaningful accessible label such as
   `Open order, 2 items`.

The product card should not own or duplicate cart state. It should only dispatch
the normalized line and report the successful action upward.

The cart line list should render a stable empty state and stable item content.
Use `aria-live="polite"` for add confirmation, not an animation-only signal.

## Testing Strategy

- Test `CartProvider` state after direct add and configured modifier add.
- Test a cart summary component renders the item count and product name after
  dispatch.
- Test `CatalogMenu` or a focused client shell opens/updates the cart after an
  add.
- Test persisted and newly-added lines remain visible after hydration.
- Verify desktop summary and mobile sheet consume one provider.
- Verify signed-out add remains available.

## Out of Scope

This cycle does not change checkout transactions, authentication, product
pricing, or database models. It focuses on cart observability and presentation
after a successful add.
