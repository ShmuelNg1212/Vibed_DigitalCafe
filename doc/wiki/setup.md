# Local Setup

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- PostgreSQL 14 or newer, or Prisma's local development database

## Install

From the repository root:

```bash
npm install
cp .env.example .env
```

The local environment template contains:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `TAX_RATE_BPS`: tax rate in basis points. `0` disables tax for local use.
- `SESSION_SECRET`: secret used to sign the HTTP-only development session
  cookie. Use a long random value outside local development.

Never commit `.env` or real credentials. `.env.example` is safe to commit.

## Database Initialization

With an existing PostgreSQL database, set `DATABASE_URL` in `.env`, then run:

```bash
npm run db:validate
npm run db:generate
npm run db:migrate -- --name initial_architecture
npx prisma db seed
```

For a disposable local database without a separate PostgreSQL installation,
Prisma can run its local development server:

```bash
npx prisma dev --detach --name digitalcafe
```

Copy the PostgreSQL URL printed by that command into `.env` as `DATABASE_URL`,
then restart the Next.js dev server before running the migration and seed
commands. The exact port is assigned by Prisma and can differ between
machines. Migrations, seed, and Next.js must all use the same `.env` value.

The deterministic seed creates:

- `admin@digitalcafe.local` with password `digitalcafe-demo`
- `customer@digitalcafe.local` with password `digitalcafe-demo`
- Four Hot Coffee products, including House Latte with whole, oat, and almond
  milk options
- Four Iced Beverages, including Slow Steep Cold Brew and Iced Vanilla Latte
- Four Pastries & Bakery products, including Morning Bun and Almond Croissant
- Deterministic placeholder image URLs for every product

These credentials are for local development only.

## Development Commands

```bash
npm run dev          # start Next.js locally
npm run lint         # run ESLint
npm run typecheck    # run TypeScript without emitting files
npm test              # run cart reducer tests
npm run build        # create a production build
npm run start        # serve the production build
```

The public catalog is available at `http://localhost:3000`. Sign in at
`/login`, review customer orders at `/orders`, and use `/admin` with the admin
seed account.

## Prisma Commands

```bash
npm run db:format
npm run db:validate
npm run db:generate
npm run db:migrate -- --name describe_change
npx prisma db seed
npm run db:check
```

`npx prisma db seed` is configured through `prisma.config.ts` to run
`tsx prisma/seed.ts`. The seed uses stable product slugs, user emails, and
modifier IDs, so it can be run repeatedly without duplicate rows. It is
non-destructive and does not delete older products or alter orders.

The customer menu displays the seeded Hot Coffee, Iced Drinks, and Bakery
products.
The cart is intentionally client-side and non-persistent; refreshing the page
clears it until cart persistence is designed in a later phase.

Do not edit generated Prisma client files. Change `prisma/schema.prisma`, then
format, validate, migrate, and regenerate.

## Catalog Troubleshooting

Run `npm run db:check` to verify the configured database connection, latest
migration, and active product count. The command redacts credentials and exits
non-zero if the database cannot be reached or migrations are unavailable.

If the demo shows no products:

1. Check for `P1001` or `Can't reach database server` errors in the Next.js
   server log.
2. Confirm a PostgreSQL service is running at the host and port in `.env`.
3. If using `npx prisma dev`, copy its printed TCP URL into `.env` rather than
   using a one-command `DATABASE_URL` override.
4. Run `npx prisma migrate deploy` and `npx prisma db seed` with that same
   environment.
5. Restart `npm run dev` after changing `.env`.

A reachable database with zero active products displays an intentional empty
catalog message. A connection or migration failure displays the catalog error
boundary instead of being silently rendered as an empty menu.
