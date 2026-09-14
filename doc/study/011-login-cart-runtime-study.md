# Login and Cart Runtime Study

## Scope

The demo user cannot sign in and cart additions still appear unreliable. This
study verifies the live runtime paths rather than assuming the committed code
matches the running process.

## Findings

The login endpoint was exercised directly with the current `.env` and seeded
database:

```text
POST /api/auth/login
customer@digitalcafe.local / digitalcafe-demo
HTTP 200
```

The endpoint returns a user ID and `CUSTOMER` role and sets the signed session
cookie. The seeded user and bcrypt password are therefore valid in the current
database. A browser sign-in failure is likely caused by the browser not running
the current client bundle, a stale dev server, or a client-side request/runtime
problem rather than invalid credentials.

The cart code has the same split: component tests pass, and the source path is
valid, but a server-rendered HTML fetch cannot prove browser event listeners are
attached. The live app must be verified through the browser runtime or a
component test that includes the complete menu-to-sheet path.

## Likely Runtime Issue

The environment exposes the demo through a forwarded host. The Next dev log
reports blocked cross-origin HMR requests for the forwarded hostname. This may
not block the initial page JavaScript, but it can leave a stale or partially
updated development client running in the browser after code changes. The
current server process and browser may not share the same bundle state unless
the dev server is restarted and the browser performs a hard reload.

The runtime study should therefore verify:

- The browser receives all script requests with HTTP 200.
- The browser console has no hydration or JavaScript exception before clicks.
- `POST /api/auth/login` is made to the same origin and returns 200.
- The session cookie is stored for the forwarded origin.
- The `CartShell` hydration effect runs and the actual button click reaches
  `ProductCard.add`.

## Login Path Review

The login page is a client component and submits JSON to `/api/auth/login`.
The API normalizes the email through Zod, queries Prisma, compares bcrypt
passwords, and sets an HTTP-only cookie with `sameSite: lax`, `secure` only in
production, and `path: /`.

The direct API test proves the server path works. The plan should add a visible
login error that distinguishes request/network failure from invalid credentials
and use `try/catch` around `fetch`, because a failed fetch currently leaves the
form in a pending state or reports no useful diagnostic.

## Cart Path Review

The cart provider is mounted once in the root layout. `CatalogMenu` is a client
component and `ProductCard.add` calls `addItem`, then opens the controlled Sheet
through the `onAdded` callback. The reducer returns new objects, and component
tests verify direct and customized adds.

The remaining production risk is client hydration/runtime failure. If the
browser bundle does not execute, the server HTML still shows product buttons but
no `onClick` listener exists. The visible add confirmation and cart sheet will
not change. This exactly matches a report that clicking does nothing despite
passing component tests.

## Recommended Repair

1. Add browser/runtime diagnostics for login and cart event execution.
2. Make login fetch failures visible and always reset pending state.
3. Configure `allowedDevOrigins` for the forwarded demo host if known, or
   document a clean dev-server restart and hard reload workflow.
4. Verify the browser uses the current JavaScript bundle after every change.
5. Add an end-to-end-capable browser test or a reproducible manual checklist
   for login and add-to-cart.

Do not replace the working Prisma seed, bcrypt accounts, Context reducer, or
checkout transaction based only on this symptom.

## Out of Scope

This study does not change credentials, password hashing, order transactions,
or product data. It focuses on distinguishing a server/auth issue from a stale
or failed browser client runtime.
