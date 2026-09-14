# User Registration and Personalized Order History Study

## Current State

Digital Cafe uses a custom signed HTTP-only cookie session rather than NextAuth.
`User` already stores a unique email, name, bcrypt password hash, and role.
Checkout already derives `userId` from the current session and persists it on
`Order`, while `/orders` queries only the current user's orders. Phase 12 should
extend this existing boundary rather than introduce a second authentication
system.

## Registration

Add a dedicated `/register` client form using React Hook Form and the existing
Zod dependency. Validate name, normalized email, password length, and password
confirmation on the client, then validate the same payload again in a Server
Action. The action should query the unique email before creating the user,
return a safe duplicate-email message, hash the password with bcrypt, and never
return the hash.

After creation, immediately issue the existing signed session cookie. This
provides the requested immediate login without duplicating password handling in
the browser. The action should preserve an optional `next` destination only
after validating it as an internal path; default to the home page.

## Order Association and Guest Policy

The current `submitOrder` action requires `getSession()` and passes the session
user ID to `createOrder`. This already satisfies authenticated association and
must remain server-derived. A browser-supplied user ID must never be accepted.

Require an account to place an order for this phase. Signed-out visitors can
browse, add, customize, and persist a cart, then are directed to sign in or
register at checkout. The cart remains in localStorage while authentication is
completed. Guest checkout can be reconsidered later when email verification,
rate limiting, order lookup tokens, and privacy handling are designed.

## Order History

The existing `/orders` route is already dynamic and scopes `getOrdersForUser` by
session user ID. Improve its presentation and protected behavior:

- Signed-out users see a sign-in/register prompt, never another user's data.
- Signed-in users see date, status, human-readable order number, total, and
  each item quantity/name/modifier summary.
- The query remains server-only and user-scoped.
- Order snapshots remain the display source, not current product records.

## Navigation

The home navigation currently always shows sign-in. The server page can read the
session and select one of two navigation states. Authenticated users should see
their first name and a client account menu with My Orders and Sign Out. Sign out
should POST to the existing logout route, clear the cookie, and refresh or
redirect to the home page.

## Security and Verification

Registration must handle duplicate email races through the database unique
constraint in addition to the pre-check. Passwords are hashed server-side.
Order history must always filter by the authenticated session user ID. Tests
should cover registration validation, duplicate emails, hashed persistence,
immediate session creation, order ownership, and sign-out.

## Recommended Decisions

1. Keep the existing custom signed-cookie auth; do not add NextAuth in parallel.
2. Require authentication at checkout, while allowing anonymous cart browsing.
3. Auto-login successful registrations through the existing session cookie.
4. Reuse and enhance `/orders` as the protected order history dashboard.
5. Add a server-derived account navigation state and client sign-out control.
