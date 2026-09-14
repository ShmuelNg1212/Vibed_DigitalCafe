# Initial Architecture Plan

This plan turns `doc/study/001-initial-architecture-study.md` into an
implementation sequence. It was approved and executed on
`feat/initial-architecture`.

## Preconditions and Decisions

- [x] Confirm approval to execute this plan.
- [x] Confirm PostgreSQL as the target database for local development and
      production.
- [x] Confirm the initial application currency and tax-rate policy before
      implementing monetary calculations.
- [x] Confirm whether the first release requires guest checkout; default to
      authenticated checkout with nullable `Order.userId` reserved for a later
      guest flow.

## Repository and Framework Setup

- [x] From `main`, create and check out the feature branch:
      `git switch -c feat/initial-architecture`.
- [x] Scaffold the Next.js App Router application in the repository with
      TypeScript, ESLint, and the intended import alias, without overwriting
      the existing workflow and documentation files.
- [x] Install runtime and development dependencies for Prisma, PostgreSQL
      access, environment validation, and server-side input validation.
- [x] Initialize Tailwind CSS and shadcn/ui using the project-supported setup.
- [x] Verify the generated project starts with `npm run dev` and passes its
      initial lint/type checks.
- [x] Add a safe environment template containing the PostgreSQL connection
      variable and document local setup without committing secrets.

## Prisma Schema and Database

- [x] Initialize Prisma with `npx prisma init` and configure the PostgreSQL
      datasource.
- [x] Add enums for user roles, product categories, and order statuses.
- [x] Add the `User` model with UUID identity, normalized unique email,
      optional password hash, role, timestamps, and order relation.
- [x] Add the `Product` model with slug, category, integer-cent price,
      availability flag, timestamps, and modifier/order relations.
- [x] Add `ModifierGroup` and `ModifierOption` models with selection bounds,
      ordering, active flags, and integer price deltas.
- [x] Add `Order` with user relation, status, integer subtotal/tax/total
      snapshots, timestamps, and order-item relation.
- [x] Add `OrderItem` with product relation, product/name/price snapshots,
      positive quantity, persisted line total, and modifier-snapshot relation.
- [x] Add `OrderItemModifier` with optional source-option relation and required
      name/price-delta snapshots.
- [x] Define foreign-key behavior that preserves order history and prevents
      accidental destructive catalog changes.
- [x] Add indexes and uniqueness constraints for email, product slug, catalog
      filtering, user order history, and order status/time queries.
- [x] Format and validate the schema with `npx prisma format` and
      `npx prisma validate`.
- [x] Create the first migration with
      `npx prisma migrate dev --name initial_architecture`.
- [x] Generate the Prisma client with `npx prisma generate`.

## Server Architecture

- [x] Add a server-only Prisma singleton at `lib/db.ts` that is safe during
      Next.js development reloads.
- [x] Add server-side validation schemas for product management, modifier
      selection, quantities, and checkout input.
- [x] Add typed catalog queries that return only active products and their
      active modifier choices for public pages.
- [x] Add a checkout service that executes inside one Prisma transaction,
      re-reads active records, validates selection bounds, calculates all
      totals in integer cents, and persists order and snapshot rows.
- [x] Ensure submitted browser totals and prices are never trusted.
- [x] Add an order lookup service that scopes customer history to the current
      user and leaves admin access behind an explicit role check.
- [x] Define a replaceable session/authentication boundary before exposing
      customer or admin mutations; never return password hashes to clients.
- [x] Add a server-side order-status transition boundary with an explicit list
      of allowed transitions.

## App Router and UI Boundaries

- [x] Create the public catalog route as a server-rendered page.
- [x] Create product detail/modifier selection as a focused client interaction
      backed by server-fetched product data.
- [x] Create a cart boundary that stores selections client-side but treats the
      checkout service as authoritative.
- [x] Create authenticated order-history and order-detail routes with loading,
      error, and authorization states.
- [x] Create an admin catalog/order area with role-protected server mutations;
      use `isActive` for availability changes instead of hard deletion.
- [x] Add shadcn/ui primitives and Tailwind styles for forms, cards, tables,
      feedback states, and responsive layouts without placing domain logic in
      `components/ui`.

## Seed Data and Verification

- [x] Add a deterministic Prisma seed script with representative coffee,
      pastry, milk, and other modifier data plus non-production users.
- [x] Run the seed against the configured local database and verify catalog
      relations.
- [x] Test checkout totals for base products, positive and negative modifier
      deltas, quantities, invalid selections, inactive records, and changed
      catalog prices.
- [x] Test order snapshots by changing catalog names/prices after checkout and
      verifying historical order output remains unchanged.
- [x] Run the project's lint, typecheck, unit/integration tests, and production
      build commands.
- [x] Verify that Prisma/database modules are not imported into browser bundles.

## Rendezvous and Documentation

- [x] Inspect `git status`, the complete diff, and recent commits before
      committing.
- [x] Commit implementation changes using a Conventional Commit such as
      `feat: establish initial cafe architecture`.
- [x] Merge `feat/initial-architecture` back into `main` after verification.
- [x] Update the relevant living manual in `doc/wiki/`, at minimum adding
      architecture and local database setup details.
- [x] Verify `main` is clean and the documented setup/build/test commands work
      from a fresh checkout.
