# Local Setup

This is the canonical local development guide. It does not require Vercel or a
hosted database.

## Production Deployment

The production hosting boundary is Vercel for the Next.js application and Neon
for PostgreSQL. The Vercel project is `digitalcafe` under the configured Vercel
account, and its GitHub repository is connected to
`ShmuelNg1212/Vibed_DigitalCafe`.

Configure these Vercel Production environment variables:

- `DATABASE_URL`: the pooled Neon PostgreSQL connection string.
- `SESSION_SECRET`: a stable, randomly generated secret. Keep it private;
  changing it invalidates existing sessions.
- `TAX_RATE_BPS`: server-side tax rate in basis points.
- `NEXT_PUBLIC_TAX_RATE_BPS`: matching browser-visible tax rate in basis points.

Apply database changes from a controlled shell before the deployment that uses
them:

```bash
DATABASE_URL="your-production-url" npx prisma migrate deploy
DATABASE_URL="your-production-url" npx prisma db seed
DATABASE_URL="your-production-url" npm run db:check
```

The current seed creates the demo catalog and demo users. This is suitable for
the demo deployment, but demo credentials must be changed or removed before
using the site for real customers. Do not use the local Prisma Dev URL in
Vercel. Vercel deployments receive automatic HTTPS and can use the generated
`*.vercel.app` URL immediately; a custom domain can be added from the Vercel
project settings.

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
- `NEXT_PUBLIC_TAX_RATE_BPS`: browser tax estimate in basis points. Keep it
  aligned with `TAX_RATE_BPS` for consistent checkout display.
- `SESSION_SECRET`: secret used to sign the HTTP-only development session
  cookie. Use a long random value outside local development.

Never commit `.env` or real credentials. `.env.example` is safe to commit.

## Recommended Quick Start

From a fresh clone:

```bash
npm install
cp .env.example .env
npm run db:generate
npx prisma dev --detach --name digitalcafe
npx prisma dev ls
```

Copy the `DATABASE_URL` TCP URL printed by `prisma dev ls` into `.env`. Then
run:

```bash
npx prisma migrate deploy
npx prisma db seed
npm run db:check
npm run dev
```

If you see `@prisma/client did not initialize yet`, run
`npm run db:generate` from the repository root and restart `npm run dev`.
Prisma Client generation is also wired to npm's `prepare` lifecycle for fresh
installs.

Open `http://localhost:3000`.

## Database Initialization

With an existing PostgreSQL database, set `DATABASE_URL` in `.env`, then run:

```bash
npm run db:validate
npm run db:generate
npx prisma migrate deploy
npx prisma db seed
npm run db:check
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

Product fixtures include deterministic Unsplash image URLs. The application
allowlists `images.unsplash.com` in `next.config.ts`; if image delivery is not
available, product cards retain their category-based visual fallback.
The cart is client-side and persists its normalized line items in browser
localStorage under a versioned `digital-cafe-cart` key. Customer details are
never stored there, and the server recalculates authoritative prices at
checkout.

Checkout is available at `/checkout` for authenticated customers. It validates
name, email, and optional instructions, creates the order transactionally, then
clears the cart and redirects to a user-scoped `/orders/success` confirmation.

Product add and customization interactions do not require sign-in. The cart
hydrates persisted lines safely and merges them with immediate in-memory
actions, so localStorage restoration cannot leave product controls stuck or
discard a first click.

Create an account at `/register` or use the seeded demo customer. Successful
registration signs the user in immediately. Checkout requires an account and
preserves the local cart while the user signs in or registers.

If the app is opened through the forwarded development hostname, restart
`npm run dev` after configuration changes and perform a hard browser reload.
The configured development origin is allowlisted so the client bundle and HMR
resources can load correctly. `npm test` includes a login network-error test and
client add-to-cart tests.

After an add, the cart trigger count and live confirmation update immediately;
on compact layouts the cart sheet can be opened to review the added line.

`npm test` includes jsdom component tests for direct and customized add-to-cart
flows, shared provider updates, and persisted cart behavior.

It also verifies that the menu opens the cart sheet after a successful direct
product add.

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
