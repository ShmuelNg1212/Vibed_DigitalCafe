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
  ui/button.tsx                    shadcn/ui button primitive
  ui/sheet.tsx                     accessible mobile cart sheet
lib/
  db.ts                            Prisma client singleton
  cart/                            client cart reducer, context, and payload
  auth/session.ts                  signed cookie session boundary
  catalog/queries.ts               active catalog query
  orders/checkout.ts               validated transactional checkout
  orders/queries.ts                user-scoped order queries
  orders/status.ts                 allowed order transitions
  validation/                      Zod input schemas
prisma/
  schema.prisma                    relational model source of truth
  migrations/                      committed database migrations
  seed.ts                          deterministic local data
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

## Data and Deployment Notes

PostgreSQL is the target database. Prisma migrations are committed and should
be applied during deployment. Product availability uses soft deactivation;
order records remain auditable. Payments and fulfillment integrations are not
part of this initial architecture, but explicit order statuses and persisted
totals leave room for them.
