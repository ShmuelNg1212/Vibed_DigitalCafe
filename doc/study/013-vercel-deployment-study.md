# Vercel Deployment Study

## Scope

Deploy Digital Cafe from the GitHub repository to Vercel and connect it to a
hosted PostgreSQL database. The application is a Next.js App Router app with
Prisma, server actions, signed cookie sessions, and a client cart. Vercel can
host the Next.js runtime, but it cannot provide the production PostgreSQL
database or local Prisma Dev state.

## Deployment Requirements

Production requires:

- A Vercel project connected to `ShmuelNg1212/Vibed_DigitalCafe`.
- A hosted PostgreSQL `DATABASE_URL` such as Neon, Supabase, or Railway.
- A strong stable `SESSION_SECRET` shared by all serverless instances.
- `TAX_RATE_BPS` and `NEXT_PUBLIC_TAX_RATE_BPS` values.
- Prisma migrations applied to the hosted database before serving traffic.
- Seed data applied intentionally, because the seed includes demo credentials.

The local Prisma Dev URL in `.env` is temporary and must not be used in Vercel.
The repository does not contain secrets because `.env` is ignored.

## Build and Prisma Behavior

Vercel detects Next.js from `package.json` and runs the production build. The
Prisma client must be generated during install/build; the current Prisma client
dependency normally handles generation through its install lifecycle, but the
deployment should explicitly verify `prisma generate` and the Next build.

Migrations should not run automatically as part of every Vercel build unless a
carefully controlled deployment command is used. The safer process is:

1. Create the hosted database.
2. Run `npx prisma migrate deploy` once against that database.
3. Run `npx prisma db seed` once if demo catalog data is desired.
4. Configure Vercel environment variables.
5. Deploy the app.

The application uses server-side database queries at runtime, so the deployed
function must be able to reach the hosted database over its connection URL.

## Authentication

The app uses a custom HMAC-signed HTTP-only cookie, not NextAuth. Vercel does
not change the auth design, but `SESSION_SECRET` must be stable and sufficiently
random. The cookie is secure in production because `NODE_ENV` is production.

The seeded demo users are convenient for initial verification, but public
production deployment should change or remove those credentials. Registration
creates real customer users with bcrypt-hashed passwords.

## Image and Browser Runtime Configuration

`next.config.ts` allowlists `images.unsplash.com` for seeded product images. The
development-only `allowedDevOrigins` entry is harmless for the current build but
should be reviewed before production; Vercel does not need the forwarded local
demo hostname. Remote image availability remains an external dependency, and
the product image component has a fallback.

The cart is browser-local and is not shared between devices until checkout.
Orders and accounts are stored in PostgreSQL and are available across devices
after login.

## Verification

Deployment verification should cover:

- Vercel deployment reaches a 200 response.
- `npm run db:check` succeeds against the hosted database before deployment.
- The catalog renders seeded products.
- Registration and login set sessions over HTTPS.
- Add/customize cart interactions hydrate and persist in the browser.
- Checkout creates an authenticated, user-associated order.
- `/orders` shows only the current user's orders.
- Vercel runtime logs contain no database connection or Prisma errors.

## Risks and Decisions

- **Database provider:** Vercel does not include PostgreSQL. A hosted provider
  is mandatory for a real deployment.
- **Seed credentials:** Seeding public demo accounts is acceptable for a demo,
  not for a production service without password rotation.
- **Migrations:** Apply migrations explicitly rather than coupling schema writes
  to every Vercel build.
- **Secrets:** Configure values in Vercel project settings, never in Git.
- **Vercel access:** CLI deployment requires an authenticated Vercel account or
  an existing `VERCEL_TOKEN`; without one, deployment must pause for login.

## Recommended Deployment

Use Vercel connected to the GitHub `main` branch and a hosted PostgreSQL
database. Configure production environment variables in Vercel, apply Prisma
migrations and seed data from a controlled shell, deploy, then verify the public
URL and runtime flows.
