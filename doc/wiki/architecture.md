# Architecture

Digital Cafe is a single Next.js App Router application using TypeScript,
Tailwind CSS, shadcn/ui, Prisma, and PostgreSQL.

## Technology Choices

- **Next.js App Router:** server-rendered catalog and order pages, route
  handlers, loading/error boundaries, and a single deployment boundary.
- **TypeScript:** typed UI, validation, database access, and domain services.
- **Tailwind CSS:** utility-first responsive styling.
- **shadcn/ui:** locally owned UI primitives under `components/ui/`.
- **Prisma:** typed PostgreSQL access, schema migrations, generated client, and
  transaction support.
- **Zod:** server-side validation for credentials, product input, modifiers,
  quantities, and checkout payloads.

## Directory Structure

```text
app/
  page.tsx                         public catalog route
  login/                           credential login page
  orders/                          customer order history and states
  admin/                           role-protected admin overview
  api/auth/                        login and logout handlers
  api/checkout/                    transaction-backed checkout handler
  api/admin/products/[id]/         admin availability mutation
  actions.ts                       server action boundary
components/
  catalog-menu.tsx                 categorized menu and cart surfaces
  product-image.tsx                optimized remote image with fallback
  ui/button.tsx                    shadcn/ui button primitive
  ui/sheet.tsx                     accessible mobile cart sheet
lib/
  db.ts                            Prisma client singleton
  cart/                            client cart reducer, context, and payload
  cart/totals.ts                   shared integer-cent display calculations
  auth/session.ts                  signed cookie session boundary
  catalog/queries.ts               active catalog query
  orders/checkout.ts               validated transactional checkout
  orders/queries.ts                user-scoped order queries
  orders/status.ts                 allowed order transitions
  validation/                      Zod input schemas
scripts/db-check.ts                server-only database diagnostic
prisma/
  schema.prisma                    relational model source of truth
  migrations/                      committed database migrations
  seed.ts                          typed, idempotent local catalog data
doc/
  study/                           architecture studies
  plan/                            executable workflow plans
  wiki/                            living project manual
```

## Server and Client Boundaries

Catalog and order reads use server components and server-only query modules.
The catalog client component owns temporary cart and modifier interaction, but
the server checkout service is authoritative. It re-reads active products and
modifier options, validates selection bounds, calculates integer-cent totals,
and writes the order plus historical snapshots in one Prisma transaction.

Prisma is never imported into browser components. The `lib/db.ts` singleton is
safe across Next.js development reloads, and query/service modules are marked
server-only where they are consumed directly by server components.

The customer menu is fetched in the Home Server Component and converted to a
serializable catalog view model before it crosses into the client boundary.
Products are presented in Hot Coffee, Iced Drinks, and Bakery sections. A
client-only `CartProvider` backed by `useReducer` powers product cards, the
mobile shadcn/ui Sheet, and the desktop summary. Cart identity includes the
canonical modifier selection, so different configurations of one product stay
as separate lines while identical configurations combine quantities.

Cart totals are display values only. The current Phase 2 checkout action is
intentionally disabled until the checkout page consumes the normalized payload;
the server checkout service remains the authority for prices and modifier
validation.

## Authentication and Authorization

The initial local authentication boundary uses bcrypt password hashes and an
HMAC-signed, HTTP-only cookie. The `Session` type and `requireRole` helper keep
the application replaceable if a managed identity provider is adopted later.
Customer order history is scoped by user ID. Admin routes and mutations check
the admin role on the server.

Registration uses a Server Action with server-side Zod validation, bcrypt
hashing, unique-email enforcement, and immediate signed-cookie session
creation. The home navigation reads the server session and shows an account
menu for authenticated users; sign out clears the same session cookie. Order
history remains scoped by session user ID.

## Data and Deployment Notes

PostgreSQL is the target database. Prisma migrations are committed and should
be applied during deployment. Product availability uses soft deactivation;
order records remain auditable. Payments and fulfillment integrations are not
part of this initial architecture, but explicit order statuses and persisted
totals leave room for them.

The seed runner is configured in `prisma.config.ts` as
`tsx prisma/seed.ts`. It upserts the two local users, twelve catalog products,
and their deterministic modifier records. The fixture is deliberately
non-destructive so existing product references and order history are preserved.

The home route keeps Prisma catalog fetching in the server component. Database
errors reach `app/error.tsx`, where the user sees a safe catalog connection
message; a successful query with no active products renders a separate empty
catalog state. `npm run db:check` is a server-only diagnostic for connection,
migration, and active-product status and is not exposed as a browser route.

The root `CartShell` provides the client-only cart context across the menu and
checkout routes. It hydrates a versioned `digital-cafe-cart` localStorage
envelope after the first render and calculates display subtotal, tax, and total
in integer cents. Checkout sends only IDs, quantities, and customer details to
the `submitOrder` Server Action. The server derives the authenticated user,
re-reads active catalog records, and creates the order and snapshots in one
Prisma transaction. Success clears the cart and redirects to a user-scoped
order confirmation page.

The menu owns controlled cart-sheet visibility and emits an accessible add
confirmation. Product additions update the shared provider used by the desktop
summary, mobile sheet, and cart trigger, so an accepted item is immediately
observable without requiring authentication.

`ProductCard` reports successful direct or customized additions to
`CatalogMenu`, which opens the controlled cart sheet. This keeps the cart state
in Context while making the successful add immediately visible on compact
layouts.

The add-to-cart event path is covered by client component tests for both direct
products and modifier configurations. These tests mount `ProductCard` and cart
lines under the same provider, verifying that UI events produce visible cart
state rather than only testing the reducer in isolation.

The login client reports HTTP authentication failures separately from network
failures and always clears its pending state. Development forwarded origins are
explicitly allowlisted in `next.config.ts` so client hydration and HMR resources
can load in the demo environment.

Cart interactions are available to signed-out visitors. During the brief
localStorage hydration window, the provider merges persisted lines with any
in-memory actions rather than replacing them. Add and customize controls remain
available without depending on animation-frame scheduling; checkout is the first
boundary that requires authentication.

Product images remain nullable display assets on `Product`. `ProductImage` uses
`next/image` with a reserved responsive frame, `object-cover`, and an exact
`images.unsplash.com` remote pattern. Missing or failed images fall back to the
category-based CSS treatment without affecting product text or layout.
