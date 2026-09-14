# Database Seed Plan

This plan implements `doc/study/003-database-seed-study.md`. It was approved
and executed on `feat/database-seed`.

## Preconditions and Branch

- [x] Review and approve this plan.
- [x] Confirm that the existing enum categories should remain the source of
      truth: `COFFEE`, `ICED_DRINK`, and `PASTRY`.
- [x] Confirm that seed data should be non-destructive and preserve old
      products that may be referenced by orders.
- [x] From clean `main`, create and check out the feature branch:
      `git switch -c feat/database-seed`.

## Runner and Configuration

- [x] Inspect the current Prisma version and seed configuration in
      `prisma.config.ts` and `package.json`.
- [x] Verify that `tsx` is available as a development dependency and that
      `migrations.seed` points to `tsx prisma/seed.ts`.
- [x] Do not install `ts-node` unless the existing runner cannot execute the
      seed script.
- [x] Preserve or add a convenient `db:seed` npm script without creating a
      duplicate deprecated Prisma seed configuration.
- [x] Run `npx prisma validate` before changing the seed implementation.

## Fixture Design

- [x] Define typed category/product fixture structures in `prisma/seed.ts` or
      a seed-only helper module.
- [x] Add three or four realistic Hot Coffee fixtures with stable slugs,
      appetizing descriptions, integer-cent prices, and deterministic image
      URLs.
- [x] Add three or four realistic Iced Beverages fixtures with stable slugs,
      descriptions, prices, and deterministic image URLs.
- [x] Add three or four realistic Pastries & Bakery fixtures with stable
      slugs, descriptions, prices, and deterministic image URLs.
- [x] Use `ProductCategory.COFFEE`, `ProductCategory.ICED_DRINK`, and
      `ProductCategory.PASTRY` rather than display labels in database writes.
- [x] Include at least one product with required modifiers, one with optional
      modifiers, and several products without modifiers.
- [x] Use deterministic modifier group and option UUIDs for every seeded
      modifier relationship.
- [x] Keep local admin/customer users in the seed and upsert them by email.

## Idempotent Seed Implementation

- [x] Refactor product writes to `db.product.upsert` keyed by unique `slug`.
- [x] Ensure the update branch refreshes all fixture-owned fields, including
      category, description, price, image URL, and active status.
- [x] Ensure the create branch contains the same complete fixture data.
- [x] Upsert modifier groups by deterministic ID and connect them to the
      upserted product ID.
- [x] Upsert modifier options by deterministic ID and connect them to the
      correct group ID.
- [x] Keep stable fixture IDs centralized and avoid generating random IDs on
      each run.
- [x] Use a `try/finally` lifecycle that always disconnects the Prisma client.
- [x] Keep seeding non-destructive: do not delete records absent from the
      fixture and do not alter existing order rows.
- [x] If using a transaction, ensure every database write uses the transaction
      client and keep non-database work outside the transaction.

## Seed Execution and Assertions

- [x] Run the required migration state against a local PostgreSQL database.
- [x] Run `npx prisma db seed` once and verify it completes successfully.
- [x] Run `npx prisma db seed` a second time and verify it completes without
      duplicate-key errors.
- [x] Query and verify three or four active products in each category.
- [x] Verify every fixture product has a valid URL, non-empty description,
      positive integer price, and expected category.
- [x] Verify modifier groups/options attach to the intended products and their
      counts do not increase after the second seed.
- [x] Verify seeded user counts remain one admin and one customer per email.
- [x] Verify the server catalog query still returns all three categories and
      only active modifier options.
- [x] Add a focused seed verification script/test if direct assertions cannot
      be run conveniently through the existing test setup.

## Application Verification

- [x] Confirm the customer menu displays the seeded products in Hot Coffee,
      Iced Drinks, and Bakery sections.
- [x] Confirm descriptions, prices, and placeholder image URLs are available
      to the menu view model.
- [x] Confirm modifier products still support required and optional choices in
      the menu and checkout validation.
- [x] Run `npm run db:format`, `npm run db:validate`, and `npm run db:generate`.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- [x] Inspect the full diff and verify no secrets or generated database files
      were added.

## Commit, Rendezvous, and Documentation

- [ ] Inspect `git status`, the complete diff, and recent commits before
      committing.
- [ ] Commit seed implementation using a Conventional Commit such as
      `feat(db): add idempotent cafe catalog seed data`.
- [ ] Merge `feat/database-seed` back into `main` only after all checks pass.
- [ ] Update `doc/wiki/setup.md` with the canonical `npx prisma db seed`
      command and the expanded sample catalog.
- [ ] Update `doc/wiki/data-models.md` if seed/category semantics need to be
      clarified.
- [ ] Update `doc/wiki/architecture.md` if seed runner or fixture organization
      changes.
- [ ] Verify `main` is clean and the documented seed command works from a
      fresh checkout.
