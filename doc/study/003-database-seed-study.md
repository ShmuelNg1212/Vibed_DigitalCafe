# Database Seed Study

## Scope

Phase 3 makes the local Digital Cafe database useful as a realistic product
catalog. The repository already has a PostgreSQL Prisma schema, a `Product`
model with a controlled `ProductCategory` enum, a `prisma/seed.ts` file, and a
Prisma config that points `npx prisma db seed` at `tsx prisma/seed.ts`. The
current seed creates two users, two products, a latte modifier group, and two
iced-drink products, so it is functional but does not yet provide the requested
three complete categories with three to four products each.

This study defines how to expand that seed safely without changing the
customer-facing menu architecture or introducing unnecessary schema changes.

## Existing Data Model

The current schema represents categories as the `ProductCategory` enum:

- `COFFEE`, presented as Hot Coffee.
- `ICED_DRINK`, presented as Iced Drinks.
- `PASTRY`, presented as Pastries & Bakery.

`Product` has a unique `slug`, description, integer `priceCents`, optional
`imageUrl`, category, and `isActive` flag. Product-specific modifiers are
represented by `ModifierGroup` and `ModifierOption`. The menu query already
filters inactive records and returns active modifier options.

The enum approach is appropriate for this phase because the requested category
set is small and controlled. A separate category table would support
administrator-managed labels and ordering, but it would add a migration,
relations, seed dependencies, and an admin editing surface that are not
required for mock data. The seed can use the existing enum and the UI's typed
presentation map to display the desired human-readable names.

## Prisma Seeding Strategy

`prisma/seed.ts` should remain a standalone TypeScript script that imports
`PrismaClient`, enum values, and any small data helpers. It should use one
client instance, execute the deterministic catalog seed, report meaningful
progress, and always disconnect in a `finally` block.

The preferred command is:

```bash
npx prisma db seed
```

With the current Prisma configuration, the seed command is declared in
`prisma.config.ts` under `migrations.seed`:

```ts
seed: "tsx prisma/seed.ts"
```

This already satisfies Prisma's command integration and avoids adding a
deprecated `package.json#prisma.seed` property. The execution plan should
verify this configuration rather than duplicate it. `tsx` is already a
development dependency, so installing `ts-node` is unnecessary unless the
project intentionally switches its seed runner.

The script should be safe with both a fresh database and a database containing
the previous seed. It should not require an empty schema or a destructive reset
to converge the catalog.

## Seed Data Structure

Use typed in-memory arrays for catalog data, then iterate through them. Keeping
the content separate from the database calls makes the dataset easy to review
and extend while keeping the write logic consistent.

Each product fixture should contain:

- A stable `slug` used as the upsert key.
- A realistic customer-facing `name`.
- A short appetizing `description`.
- A `ProductCategory` enum value.
- An integer `priceCents` value.
- A deterministic placeholder `imageUrl`.
- An active flag.
- Optional modifier group and option fixtures.

The baseline dataset should contain three or four products in each category:

### Hot Coffee

- House Latte: espresso, textured milk, optional milk choice.
- Honey Cinnamon Cappuccino: rich foam with honey and cinnamon.
- Maple Mocha: cocoa, espresso, and maple sweetness.
- Long Black: bold espresso over hot water.

### Iced Beverages

- Slow Steep Cold Brew: smooth overnight-steeped coffee, optional oat milk.
- Citrus Sparkler: bright citrus and sparkling water.
- Iced Vanilla Latte: chilled espresso, vanilla, and milk choice.
- Berry Hibiscus Cooler: hibiscus, berry, and citrus over ice.

### Pastries & Bakery

- Morning Bun: laminated dough with citrus sugar.
- Brown Butter Chocolate Chip Cookie: crisp edge and soft center.
- Almond Croissant: flaky pastry with almond cream.
- Blueberry Lemon Loaf: tender loaf with lemon glaze.

The exact names may vary, but the dataset should communicate realistic menu
content and cover products with and without modifiers. Prices should be
plausible, positive integer cents, and stable between runs. A few modifier
examples should exercise the existing UI and checkout logic: required milk for
a latte, optional oat milk for cold brew, and no modifiers for a pastry or
sparkler.

## Placeholder Image URLs

The existing `imageUrl` field should be populated for every seeded product so
the menu can exercise its image/fallback path. URLs should be deterministic and
not depend on randomly generated content. An external image service such as
Unsplash Source can be convenient, but random source URLs are poor seed data
because the same product may render differently and external services can be
unavailable.

Prefer stable URLs with a fixed query or a local placeholder route. If remote
URLs are used, the implementation must account for Next.js image-host
configuration when using `next/image`; the current menu can continue to render
a CSS placeholder treatment without making the remote URL a runtime
dependency. The seed should use valid URL strings, and the UI should preserve a
fallback when an image is missing or unavailable.

The simplest Phase 3 choice is deterministic `https://images.unsplash.com/...`
URLs selected per product, while the implementation plan records that the
application does not need to fetch those images during seeding. A later asset
study can replace them with local optimized images.

## Idempotency and Convergence

Every seeded product must use `db.product.upsert({ where: { slug }, ... })`.
The slug is the stable business identifier and is already uniquely constrained
in Prisma. The `update` branch should refresh mock content such as name,
description, category, price, image URL, and `isActive`; the `create` branch
should include the complete initial record.

Modifier groups and options need equally stable keys. The current schema has no
compound unique constraint for a group name or option name, so the seed should
use deterministic UUIDs for modifier fixtures and upsert by `id`, as the
existing script does. Those IDs must be namespaced and documented in the data
fixture rather than generated on every run.

User records should continue to upsert by unique email. Password hashes may be
recomputed from the fixed local password, or the update branch may retain the
existing hash; either choice is safe for local seed data as long as plaintext
passwords are never stored.

Upsert alone does not remove products that were present in an older fixture but
are intentionally deleted from the current fixture. That is generally the
correct behavior for a non-destructive development seed because it avoids
deleting products referenced by orders. If the dataset later needs exact
convergence, use an explicit stable slug allowlist and deactivate, rather than
delete, records outside it. Do not add destructive cleanup to this phase.

The seed should be rerun at least twice during verification. The second run
must complete without unique constraint errors, must not increase product or
modifier counts, and must leave fixture values equal to the declared data.

## Transaction and Ordering Considerations

The seed can write independent products sequentially, but related records must
be created after their owning product exists. For each product:

1. Upsert the product by slug.
2. Upsert its modifier groups by stable ID, pointing at the product ID.
3. Upsert modifier options by stable ID, pointing at the group ID.

A single transaction around the entire seed gives all-or-nothing behavior, but
can make a large fixture harder to recover and may hold a long transaction in a
shared development database. For this small dataset, a transaction is feasible
and keeps a partially seeded catalog from being observed. If the script uses a
transaction, keep hashing and other non-database work outside it and use the
transaction client for every write.

The current seed's user hashing happens before writes and its product writes are
independent. The execution plan should make the write boundary deliberate
rather than introduce a transaction accidentally around a client that is not
used consistently.

## Workflow Integration

The repository currently has:

- `prisma.config.ts` with `migrations.seed: "tsx prisma/seed.ts"`.
- `tsx` in `devDependencies`.
- `npm run db:seed` as a convenience wrapper around `tsx prisma/seed.ts`.
- `.env.example` documenting the PostgreSQL connection.

The required Prisma workflow is therefore:

```bash
npm run db:validate
npx prisma db seed
```

The plan should verify the Prisma-native command and retain the npm alias for
developer convenience. It should not add `ts-node` or a second seed
configuration unless a command actually fails. Any changes to `package.json`
should be limited to scripts or dependency metadata that is required by the
chosen runner.

## Verification Strategy

Verification should test both content and behavior:

- Run `npx prisma db seed` against a migrated local database.
- Run it a second time and confirm successful idempotent completion.
- Query product counts by category and assert three or four products per
  category.
- Confirm every product has a non-empty description, positive `priceCents`, a
  valid `imageUrl`, and `isActive: true` for the initial menu.
- Confirm modifier groups/options are attached to the expected products and
  have stable counts after reruns.
- Confirm seeded users remain unique by email.
- Confirm the customer menu query returns all three categories and active
  modifiers.
- Run Prisma format, validation, generated client checks, lint, typecheck,
  tests, and production build.

The verification should not assert that old records disappear, because
non-destructive idempotent seeding intentionally preserves records that may be
referenced by orders.

## Recommended Decisions

1. Keep the existing enum-based three-category model rather than introducing a
   category table for mock data.
2. Expand `prisma/seed.ts` to 3-4 products per category using typed fixture
   arrays and stable slugs.
3. Populate deterministic placeholder URLs and realistic integer-cent prices.
4. Use `upsert` by product slug, user email, and deterministic modifier IDs.
5. Retain `tsx` and the existing `prisma.config.ts` seed command; do not install
   `ts-node`.
6. Verify `npx prisma db seed` twice and validate category counts and content.
7. Avoid destructive cleanup so existing orders and historical references stay
   safe.

## Out of Scope

This phase does not add a category administration model, image hosting or
optimization, inventory quantities, product availability scheduling, payment
data, order fixtures, or destructive database reset behavior.
