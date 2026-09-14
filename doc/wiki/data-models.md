# Data Models

Prisma uses PostgreSQL as the relational source of truth. Identifiers are UUIDs
and monetary amounts are integer cents in the application's base currency.

## User

`User` represents a customer or administrator. Email is unique, the role is
`CUSTOMER` or `ADMIN`, and `passwordHash` stores only a one-way password hash.
A user can own many orders. Authorization is enforced on the server and is not
based on whether an admin link is visible in the UI.

Registration creates a `CUSTOMER` user with a bcrypt password hash and never
stores plaintext credentials. Orders retain `userId` plus customer snapshots;
history queries must filter by the authenticated user ID.

## Product

`Product` is a sellable coffee or pastry. It has a unique URL slug, category,
integer `priceCents`, optional description and image URL, and an `isActive`
flag. Products are deactivated instead of deleted so catalog history remains
safe.

A product owns many `ModifierGroup` records and can be referenced by many
`OrderItem` records.

## ModifierGroup and ModifierOption

`ModifierGroup` defines a product-specific choice set such as `Milk`. Its
`minSelections` and `maxSelections` values define the allowed selection range.
`ModifierOption` stores a choice such as `Oat milk`, including an integer
`priceDeltaCents` and its own active flag.

The public catalog includes active groups and options. Checkout re-reads the
records and validates the submitted selections in a transaction.

## Order

`Order` is the checkout aggregate. It may reference a `User`, has a unique
human-readable order number, and tracks `PENDING`, `CONFIRMED`, `PREPARING`,
`READY`, `COMPLETED`, or `CANCELLED` status. Subtotal, tax, and total are
persisted integer snapshots. Status transitions are constrained by server-side
domain logic.

An order has many order items. If a user is removed, the order remains and its
`userId` is set to null.

## OrderItem

`OrderItem` records a purchased product, quantity, unit price, and line total.
It keeps `productName` and `unitPriceCents` snapshots because the current
product can later be renamed or repriced. The optional `productId` relation is
retained for reporting and is set to null rather than destroying history.

## OrderItemModifier

`OrderItemModifier` records each selected modifier on an order item. It stores
the selected option relation when available, plus `name` and `priceDeltaCents`
snapshots. This preserves receipts even if an option is renamed, repriced, or
deactivated later.

## Relationship Summary

```text
User 1 ---- * Order 1 ---- * OrderItem * ---- 1 Product
                                      |
                                      *
                              OrderItemModifier * ---- 1 ModifierOption

Product 1 ---- * ModifierGroup 1 ---- * ModifierOption
```

## Customer Menu and Cart

`ProductCategory` currently contains `COFFEE`, `ICED_DRINK`, and `PASTRY`.
The client presents these as Hot Coffee, Iced Drinks, and Bakery through a
typed presentation map; the enum remains a small controlled taxonomy rather
than an admin-managed category table.

The local Prisma seed provides four products in each category. Products use
stable unique slugs, descriptions, positive integer-cent prices, and
deterministic placeholder `imageUrl` values. Modifier groups and options use
stable UUIDs so repeated `npx prisma db seed` runs update fixtures rather than
creating duplicates.

`Product.imageUrl` is a nullable display asset reference. It is currently
populated with deterministic Unsplash URLs for the demo, but it is not part of
order snapshots because historical receipt identity depends on product names
and prices rather than presentation assets. Missing image values are supported
by the product-card fallback.

The Phase 2 cart is not persisted in Prisma. Its normalized client payload
contains product IDs, quantities, and selected modifier group/option IDs. The
cart also keeps display snapshots for names and calculated cents, but those
values are never trusted by checkout. The server re-reads active catalog rows
and recalculates authoritative totals.

Checkout calculates all prices from current active catalog records, then writes
the order and all snapshots in one Prisma transaction. Browser-submitted totals
are never trusted.

Catalog reads distinguish infrastructure failures from valid empty results. A
database connection or migration error reaches the route error boundary; a
successful query with no active products renders an intentional empty-catalog
state. This prevents a `P1001` connection failure from appearing to customers
as a normal empty menu.

## Order Customer Snapshots

`Order` stores `customerName`, `customerEmail`, and optional
`specialInstructions` snapshots in addition to its optional `userId`. These
values represent the details submitted for that order and remain stable if a
user profile changes later. Authenticated checkout derives `userId` from the
signed session and never trusts a client-supplied user ID.

Checkout re-reads active products and modifiers, recalculates integer-cent
subtotal, tax, and total values, and creates `Order`, `OrderItem`, and
`OrderItemModifier` rows in one Prisma transaction. Invalid product or modifier
payloads roll back the complete order. Cart localStorage values are display
state only and are not persisted as order prices.
