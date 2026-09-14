# Initial Architecture Study

## Goal

Digital Cafe needs a full-stack ordering application built with Next.js App
Router, TypeScript, Tailwind CSS, shadcn/ui, and Prisma. The first slice must
support a catalog of coffee and pastries, configurable product modifiers such
as milk type, customer and administrator accounts, and durable orders composed
of order items.

This study covers the initial application boundaries and the relational data
model. It deliberately does not implement application code, migrations, or
authentication yet.

## Feasibility

The stack is a good fit for a single Next.js application:

- Next.js App Router provides server-rendered catalog and order views, server
  actions or route handlers for mutations, and a single deployment boundary.
- TypeScript can enforce shared contracts between UI components, server
  actions, validation, and Prisma queries.
- Prisma provides typed access to a relational database, explicit relations,
  migration support, and a natural representation of historical order data.
- Tailwind CSS and shadcn/ui can provide the visual system without coupling
  domain logic to presentation components.

The main architectural constraint is that an order is historical business
data. Product names, prices, and modifier selections must remain reproducible
after a catalog item changes. The schema therefore needs snapshots on order
items rather than relying only on current product records.

## Proposed Application Architecture

Use a feature-oriented Next.js App Router structure:

- `app/` contains route segments, layouts, loading and error boundaries, and
  route handlers where an HTTP endpoint is useful.
- `components/ui/` contains shadcn/ui primitives; domain components stay
  outside this directory.
- `features/catalog/`, `features/cart/`, `features/orders/`, and
  `features/admin/` contain UI and server-facing logic grouped by capability.
- `lib/db.ts` owns the Prisma client singleton. Database access should stay on
  the server and be called from server actions or server-only service modules.
- `lib/validation/` contains schemas for user input, especially checkout,
  product management, and modifier selection.
- `prisma/schema.prisma` is the source of truth for relational structure;
  migrations are generated and committed as part of the implementation phase.

Prefer server components for catalog and order-history reads. Use client
components only for interactive concerns such as cart state, modifier
selection, and form feedback. Mutations should be validated on the server and
should recalculate prices from database records rather than trusting browser
submitted totals.

Authentication and authorization should be introduced behind a small session
abstraction. Customer routes require an authenticated customer where personal
order history is exposed; admin routes require an administrator role. The
initial schema can store a password hash for local authentication, while the
session implementation remains replaceable if an external identity provider
is selected later.

## Relational Model

### User

`User` represents both customers and administrators.

- `id`: stable UUID primary key.
- `email`: unique, normalized login identifier.
- `name`: display name.
- `passwordHash`: nullable only if a future external identity provider is
  supported; never store plaintext passwords.
- `role`: enum with `CUSTOMER` and `ADMIN`, defaulting to `CUSTOMER`.
- `createdAt` and `updatedAt`: audit timestamps.
- relation to the user's orders.

An email uniqueness constraint prevents duplicate accounts. Role checks must be
performed on the server; hiding admin links in the UI is not authorization.

### Product

`Product` is a sellable catalog item such as a coffee or pastry.

- `id`: UUID primary key.
- `name`: customer-facing name.
- `slug`: unique stable URL identifier.
- `description`: optional product details.
- `category`: enum such as `COFFEE` or `PASTRY` for initial catalog filtering.
- `priceCents`: non-negative integer in the application's base currency.
- `imageUrl`: optional presentation asset URL.
- `isActive`: controls availability without deleting historical references.
- `createdAt` and `updatedAt` timestamps.
- relation to modifier groups and order items.

Prices should be stored as integer minor units, not floating-point values.
Deleting a product should generally be avoided once it has appeared in an
order. Deactivation preserves catalog history and keeps references valid.

### ModifierGroup and ModifierOption

Modifiers need their own records because a product can offer several choices,
such as milk type, and administrators need to manage those choices.

`ModifierGroup` contains a product-specific choice group:

- `id`: UUID primary key.
- `name`: for example, `Milk`.
- `minSelections` and `maxSelections`: selection constraints.
- `productId`: owning product.
- ordered relation to options.

`ModifierOption` contains one choice:

- `id`: UUID primary key.
- `name`: for example, `Oat milk`.
- `priceDeltaCents`: integer adjustment that may be zero or positive/negative.
- `isActive`: allows an option to become unavailable without rewriting orders.
- `modifierGroupId`: owning group.

This model supports required or optional groups and single- or multi-select
behavior. It is more extensible than adding fixed milk columns to `Product`.
The initial UI can enforce one selection for milk while the schema supports
future toppings or size options.

### Order

`Order` is the checkout aggregate and payment-independent source of truth for
the customer's purchase.

- `id`: UUID primary key, optionally paired with a human-readable order number.
- `userId`: nullable foreign key to `User` if guest checkout is later enabled;
  authenticated checkout should populate it.
- `status`: enum such as `PENDING`, `CONFIRMED`, `PREPARING`, `READY`,
  `COMPLETED`, and `CANCELLED`.
- `subtotalCents`, `taxCents`, and `totalCents`: integer monetary snapshots.
- `createdAt` and `updatedAt` timestamps.
- relation to order items and the owning user.

Order status transitions should be controlled in server-side domain logic. The
first release can omit payment and fulfillment integrations, but should keep
status explicit so those integrations can be added without changing the
meaning of existing rows.

### OrderItem

`OrderItem` records exactly what was purchased at checkout.

- `id`: UUID primary key.
- `orderId`: required relation to `Order`.
- `productId`: relation to the original `Product`, retained for reporting;
  use `SetNull` on product deletion only if deletion is ever permitted.
- `productName`: required name snapshot.
- `unitPriceCents`: required base-price snapshot.
- `quantity`: positive integer.
- `lineTotalCents`: calculated server-side and persisted.
- relation to selected modifier snapshots.

Because product price and name can change, `OrderItem` must not derive its
display data from the current `Product` alone. A separate
`OrderItemModifier` snapshot should store `name` and `priceDeltaCents` for each
selected option, alongside optional references to the original option. This
ensures receipts remain accurate even when a modifier is renamed or repriced.

Although the requested core entities name `OrderItem`, `OrderItemModifier` is
necessary to model selected modifiers without losing historical accuracy. It
is a supporting entity, not a second independently managed catalog concept.

## Integrity and Transaction Boundaries

Checkout should run in one Prisma transaction:

1. Load active products and modifier options by IDs submitted by the client.
2. Validate that requested quantities and modifier selections satisfy the
   product's current rules.
3. Calculate each line total, subtotal, tax, and total using integer cents on
   the server.
4. Create the `Order`, `OrderItem` rows, and modifier snapshots.
5. Return the new order identifier for confirmation.

The cart can live in client state before checkout, but it is not authoritative.
Repeated checkout requests should be made safe with an idempotency strategy
before payment processing is added. At minimum, the service boundary should
be designed so a future idempotency key can be stored and checked.

Catalog administration should use soft availability (`isActive`) rather than
hard deletion. Database constraints should enforce required relations and
non-null values; application validation should enforce selection ranges and
positive quantities.

## Rendering and Data Access

The public catalog can be statically rendered or dynamically revalidated from
server components. Admin inventory and customer order history should be
dynamic and authorization-protected. Avoid exposing the Prisma client to the
browser. Use serialized, minimal view data at the server/client boundary.

For the first implementation, a direct Prisma data-access layer is preferable
to introducing a repository abstraction with no second implementation. Keep
queries in server-only modules and extract domain services only where a
transaction or business rule needs a stable boundary.

## Risks and Tradeoffs

- **Authentication scope:** Building custom password authentication increases
  security responsibility. A replaceable session boundary keeps the initial
  local implementation manageable and allows a mature provider later.
- **Database choice:** Prisma supports PostgreSQL, SQLite, and other relational
  databases. PostgreSQL is the likely production choice; a local SQLite setup
  can speed onboarding but may hide production-specific behavior. The plan
  should select an environment explicitly before migrations are generated.
- **Money and tax:** Integer cents prevent floating-point errors, but tax rules
  and currency are domain decisions. Store calculated tax snapshots even if
  the first release uses a simple rate.
- **Catalog flexibility:** Product-specific modifier groups are slightly more
  complex than a fixed schema, but avoid a migration for every new modifier
  type and preserve a clean admin model.
- **Order history:** Snapshot columns duplicate catalog data intentionally. The
  duplication is the cost of auditability and stable receipts.
- **Concurrency:** An active product or modifier can change between catalog
  display and checkout. The transaction must re-read and validate records at
  checkout time.

## Recommended Initial Decisions

1. Use PostgreSQL as the target relational database and Prisma migrations as
   the schema delivery mechanism.
2. Model `User`, `Product`, `ModifierGroup`, `ModifierOption`, `Order`,
   `OrderItem`, and `OrderItemModifier` with UUID identifiers.
3. Store all money as integer cents and all order display values as snapshots.
4. Implement server-only Prisma access and transaction-backed checkout.
5. Add role-aware authorization boundaries before exposing admin mutations.
6. Keep the first implementation payment-independent while preserving order
   statuses and totals needed for later integration.

## Out of Scope for This Study

This phase does not create the Next.js project, Prisma schema, migrations,
authentication provider, UI, payment integration, deployment configuration, or
tests. Those are concrete execution steps for the corresponding plan and
require approval before implementation begins.
