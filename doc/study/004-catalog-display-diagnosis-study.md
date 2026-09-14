# Catalog Display Diagnosis Study

## Scope

The demo webapp renders the cafe shell but does not display seeded menu items.
This study follows the catalog from the Next.js route to Prisma and compares
the database used by the seed command with the database used by the running
application. It does not change application code or environment files.

## Observed Behavior

The home page currently does this:

```ts
const products = await getActiveCatalog().catch(() => []);
```

When the Prisma query fails, the server silently converts the failure to an
empty catalog. The UI therefore renders the normal menu shell with no category
sections or products, making a database connection failure look like an empty
menu.

The server log records the actual failure from `db.product.findMany()`:

```text
Can't reach database server at `localhost:5432`
```

The configured application environment is:

```text
DATABASE_URL="postgresql://digitalcafe:digitalcafe@localhost:5432/digitalcafe?schema=public"
```

No PostgreSQL server is listening at `localhost:5432` in the current workspace.

## Seed/Application Database Mismatch

The seed verification was run against Prisma's local development database. That
database used a temporary URL similar to:

```text
postgres://postgres:postgres@localhost:51214/template1?sslmode=disable
```

The seed command was invoked with that URL as a one-command environment
override. An inline override affects only that command; it does not update the
repository's ignored `.env` file or the environment of an already-running Next
development server.

The application server loads `.env` and uses port `5432`, while the seeded
records were written to the Prisma development server on port `51214`. These
are different connection targets. Even if the temporary Prisma server remains
running, the app cannot see its data while `DATABASE_URL` still points to
`localhost:5432`.

The current long-running Next process also retains the environment loaded when
it started. Changing `.env` requires a full Next dev-server restart; a browser
refresh alone cannot change the database connection.

## Root Cause

The primary root cause is environment/database alignment, not the seed data or
the product query:

1. `npx prisma db seed` was run against an explicitly overridden temporary
   Prisma database URL.
2. `.env` still points to an unavailable PostgreSQL server at `localhost:5432`.
3. The Next.js server reads `.env`, cannot connect, and logs a Prisma `P1001`
   connection error.
4. `app/page.tsx` catches that error and supplies `[]`, hiding the failure from
   the rendered page.

The database query itself is structurally compatible with the seed. The seed
verification confirmed 12 active products across the three enum categories:

- `COFFEE`: 4
- `ICED_DRINK`: 4
- `PASTRY`: 4

The query filters only `isActive: true`, and the seeded products are active.
There is no evidence that category mapping or modifier inclusion is preventing
the products from being returned.

## Contributing Problems

### Silent Fallback

`catch(() => [])` is inappropriate for a required catalog read. It masks
database outages, misconfigured credentials, migration failures, and schema
errors as a valid empty state. It also prevents `app/error.tsx` from providing
the intended error boundary.

The route should distinguish an intentionally empty catalog from an unavailable
catalog. A database error should be logged with context and allowed to reach the
route error boundary, while a successful query returning zero products should
render an explicit empty-catalog state.

### Ephemeral Development Database

`npx prisma dev --detach` chooses a temporary port and stores its lifecycle in
Prisma's local state. The printed connection URL must be copied into `.env`
before starting or restarting Next. Running seed and app commands with separate
inline overrides is easy to get wrong and is not a durable setup workflow.

### Documentation Ambiguity

The setup manual correctly says to use the PostgreSQL URL printed by `prisma
dev`, but the checked-in `.env.example` defaults to a conventional
`localhost:5432` database. A user can follow the seed command while leaving the
Next server pointed at a different target. The workflow needs an explicit
single-source-of-truth step:

1. Start or choose a database.
2. Put its URL in `.env`.
3. Restart the Next dev server.
4. Run migrations and seed using the same environment.
5. Verify the app can read the catalog.

The repository must not commit a temporary port or local credentials. The fix
belongs in setup tooling, diagnostics, and documentation, with the actual URL
remaining a local environment value.

## Feasibility of Fixes

### Immediate Local Recovery

For the current demo, start the Prisma development database, set the printed
PostgreSQL URL in `.env`, run migrations and `npx prisma db seed` without a
different override, then restart Next. This restores the app without schema or
UI changes.

### Application Hardening

Remove the silent empty-array fallback from the home page. Let the existing
`app/error.tsx` boundary handle query failures and add a visible message that
identifies a catalog loading problem without exposing credentials. Keep the
successful zero-row response as a separate empty state.

This change makes future environment mistakes obvious and prevents a production
database outage from appearing as a normal empty menu.

### Environment Validation

Add server-side startup or request-time validation for `DATABASE_URL` and
document a single connection setup path. A lightweight health check or
diagnostic script can verify connectivity, migration state, and product count
before the demo is opened. It should not print secrets or require the browser
to access Prisma.

### Stable Database Option

For repeatable demos, use a persistent PostgreSQL service with a stable URL at
port `5432` or a managed development database. Prisma's temporary development
database remains useful for onboarding, but its generated URL must be treated as
the active environment configuration and may change when the service is
recreated.

## Recommended Architecture and Workflow

1. Keep `getActiveCatalog` as a server-only Prisma query.
2. Use one `DATABASE_URL` for migration, seed, Next server, and verification.
3. Add a `db:check` or equivalent diagnostic command that connects to the
   configured URL and reports migration/product status.
4. Remove silent query fallback from `app/page.tsx`.
5. Keep a distinct empty-catalog component for a successful zero-product
   result.
6. Update setup documentation with explicit restart and same-environment
   commands.
7. Add an integration check that confirms the seeded catalog is visible through
   the route's data-fetching path.

## Verification Plan

The fix should be verified in both failure and success modes:

- With the configured database unavailable, the page should show the catalog
  error boundary and the server log should contain a useful error.
- With a reachable migrated database and the seed applied, the page should
  render all three categories and products from that same database.
- Running `npx prisma db seed` and the Next server with the same `.env` should
  produce consistent product counts.
- A successful empty database should show an intentional empty state rather
  than an infrastructure error.
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` should
  remain clean.

## Out of Scope

This diagnosis does not redesign the menu, change Prisma models, add payment
support, commit local credentials, or hard-code a temporary Prisma port. It
focuses on aligning runtime configuration with the seeded database and making
catalog failures observable.
