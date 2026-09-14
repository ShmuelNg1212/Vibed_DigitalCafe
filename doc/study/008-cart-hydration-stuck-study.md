# Cart Hydration Stuck Study

## Scope

The menu currently renders product actions as `Restoring...` indefinitely. This
study examines the cart hydration gate introduced by the previous interaction
bug fix and defines a repair that preserves localStorage persistence without
making the menu unusable when browser hydration or animation scheduling differs
from the expected path.

## Observed Behavior

`CartProvider` initializes with:

```ts
const [hydrated, setHydrated] = useState(false);
```

The product card disables its action while that value is false. The provider
only sets it true inside a client effect callback scheduled with
`requestAnimationFrame`:

```ts
useEffect(() => {
  dispatch({ type: "hydrate", items: readStoredItems() });
  const hydrationFrame = window.requestAnimationFrame(() => setHydrated(true));
  return () => window.cancelAnimationFrame(hydrationFrame);
}, []);
```

The server-rendered HTML necessarily contains the initial `Restoring...` label.
That label should be replaced after client hydration, but the live page still
contains it. There is no server-side database or product-query failure involved;
the product names and action controls are present in the response.

The current code also makes the first usable state depend on two unrelated
browser lifecycle operations: localStorage access and an animation-frame
callback. A requestAnimationFrame gate is unnecessary for cart correctness and
can leave the UI disabled if client hydration is delayed, interrupted, or the
callback is canceled by a surrounding lifecycle.

## Root Cause

The interaction gate is too strict and has no recovery path. `hydrated` remains
false until a requestAnimationFrame callback runs, while all product actions are
disabled until then. The implementation treats an optimization boundary as a
hard functional prerequisite.

The prior race fix attempted to prevent a late localStorage read from replacing
a newly-added line. It solved that race by blocking all actions, but introduced a
more severe failure mode: if the gate does not complete, every product remains
permanently disabled.

The provider should instead make hydration atomic with respect to state, not
with respect to user access:

1. Start with an interactive in-memory cart.
2. Read localStorage in an effect.
3. Merge valid stored lines with any in-memory actions that occurred before the
   read completed.
4. Mark the provider hydrated immediately after the read attempt, whether
   localStorage is available, empty, malformed, or blocked.
5. Persist the merged state after hydration.

This removes the permanent disabled state and prevents the original overwrite
race without requiring requestAnimationFrame.

## Why the Existing Tests Missed It

The existing jsdom tests wait for `hydrated` to become true and then assert
state. They verify the intended lifecycle but do not prove that a production
browser's client bundle hydrates the root `CartShell` and executes effects. They
also do not test an action occurring before hydration.

The test suite should cover the state contract directly:

- The provider reaches `hydrated: true` after a successful or failed storage
  read.
- An add before storage hydration is retained.
- Stored and newly-added lines merge by cart key.
- Malformed or unavailable storage does not leave controls disabled.

Component tests for the entire catalog are useful, but the provider contract is
the smallest reliable regression boundary for this specific bug.

## Recommended State Design

### Merge Hydration

Change the reducer's hydration behavior from replacement to merge. Given stored
items and current items:

- If a cart key exists only in storage, restore it.
- If a key exists only in current state, preserve it.
- If the same key exists in both, combine quantities while retaining the current
  item's display data.

The reducer remains the single place that defines cart identity and quantity
semantics. A pure merge helper can be unit tested without a browser.

### Immediate Completion

Use the effect only to read storage and dispatch merge hydration. Call
`setHydrated(true)` in the same effect after the read attempt. Do not schedule
the state transition through `requestAnimationFrame`.

The storage read must remain wrapped in `try/catch`; private browsing,
disabled storage, malformed JSON, and quota restrictions all represent a valid
empty/unavailable persistence state for the in-memory cart. None should block
add or customize actions.

### Persistence Ordering

The persistence effect should continue to wait for `hydrated`. This prevents the
initial empty state from overwriting stored items. After the merge dispatch and
hydration flag are committed, the persistence effect writes the merged state.

The implementation should avoid a stale closure by keeping hydration and
persistence effects independent and using reducer state as the source of truth.

## Alternative Considered

The provider could keep actions disabled until a client-only shell mounts and
then render the entire catalog. This would avoid a disabled button but produce a
larger visual blank/loading transition and still require a fallback when
localStorage is unavailable. It is not necessary for this cart because prices
and product data are already server-rendered and localStorage is optional.

## Verification Strategy

- Load the live page and verify the initial `Restoring...` label is replaced by
  `Add` or `Customize` without user intervention.
- Add a direct product immediately after the client boundary becomes visible.
- Customize a required modifier and confirm the configured line appears.
- Seed localStorage with an existing line, then add the same and a different
  line before hydration; verify none are lost.
- Make localStorage throw on read/write and verify actions remain enabled.
- Run reducer/provider tests, lint, typecheck, and build.
- Inspect the browser console and Next logs for hydration errors separately from
  image 404 warnings.

## Recommended Decision

Remove the animation-frame gate, make hydration merge rather than replace, and
complete hydration after the storage read attempt. Keep the cart available to
signed-out visitors and retain server authority over prices at checkout.

## Out of Scope

This fix does not change authentication, checkout transactions, product data,
image sourcing, or the persisted cart schema version.
