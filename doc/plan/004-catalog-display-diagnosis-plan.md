# Catalog Display Diagnosis Plan

This plan addresses the missing menu items documented in
`doc/study/004-catalog-display-diagnosis-study.md`. It was approved and
executed on `fix/catalog-display-database-connection`.

## Confirmed Diagnosis

- [x] Confirm the demo server's `DATABASE_URL` points to the intended database.
- [x] Confirm the seed command and Next.js server use the same connection URL.
- [x] Confirm the current local failure is `P1001` at `localhost:5432`.
- [x] Confirm seeded data exists in the active database, not only in a temporary
      Prisma development database.

## Reproduce and Establish a Single Database Target

- [x] Inspect the current branch and verify the worktree is clean before
      creating the bug-fix branch.
- [x] From clean `main`, create and check out:
      `git switch -c fix/catalog-display-database-connection`.
- [x] Start the selected local PostgreSQL service, or start Prisma's local
      development database with `npx prisma dev --detach --name digitalcafe`.
- [x] Record the database URL produced by the selected service in the local
      ignored `.env` file.
- [x] Stop using one-command `DATABASE_URL=...` overrides for normal local
      verification so Prisma CLI and Next.js read the same environment.
- [x] Restart the Next.js development server after changing `.env`.
- [x] Run `npx prisma migrate deploy` and `npx prisma db seed` with the same
      environment consumed by Next.js.
- [x] Query product counts and confirm the app database contains the seeded
      catalog.

## Make Catalog Failures Observable

- [x] Remove the `catch(() => [])` fallback in `app/page.tsx`.
- [x] Allow catalog query failures to reach the existing route-level
      `app/error.tsx` boundary.
- [x] Update the error boundary message to identify a catalog/data connection
      problem without exposing `DATABASE_URL`, credentials, or raw Prisma stack
      traces to users.
- [x] Preserve a separate successful empty-catalog state when the query returns
      zero active products.
- [x] Add useful server-side error logging around the catalog query, including
      operation context but excluding secrets.

## Add Runtime Diagnostics

- [x] Add a small server-only database diagnostic command or script that checks
      connectivity and reports migration/product status without printing the
      full connection string.
- [x] Add an npm script such as `db:check` for the diagnostic command.
- [x] Make the diagnostic report the configured host/port in redacted form,
      connection success, migration status, and active product count.
- [x] Ensure the diagnostic exits non-zero when the database is unreachable or
      the schema is not migrated.
- [x] Keep diagnostics out of browser bundles and do not expose them as a
      public route.

## Documentation and Environment Guidance

- [x] Update `doc/wiki/setup.md` with one canonical setup flow that starts the
      database, writes its URL to `.env`, applies migrations, seeds, restarts
      Next, and verifies the catalog.
- [x] Clarify that `.env.example` is a template only and that its default
      `localhost:5432` URL requires a real PostgreSQL service at that address.
- [x] Document that Prisma development URLs are temporary and must be copied
      into `.env` before starting Next.js.
- [x] Add troubleshooting guidance for `P1001`, including database
      availability, wrong port, wrong database, and required server restart.
- [x] Update `doc/wiki/architecture.md` to document the server-only catalog
      error boundary and runtime database diagnostic.
- [x] Update `doc/wiki/data-models.md` only if the catalog empty/error semantics
      need to be recorded alongside the existing product model notes.

## Verification

- [x] With the database stopped or the URL intentionally invalid, request `/`
      and verify the page shows the catalog error boundary rather than an empty
      product list.
- [x] With the database running and migrations applied, run the seed command
      and request `/` after restarting Next.js.
- [x] Verify the rendered response includes seeded products from all three
      categories: Hot Coffee, Iced Drinks, and Bakery.
- [x] Verify a successful database with zero active products renders an
      intentional empty-catalog state.
- [x] Run the new `db:check` command against the configured local environment.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- [x] Inspect the full diff for secrets, temporary ports, and accidental
      generated files.

## Commit, Rendezvous, and Documentation Sync

- [ ] Inspect `git status`, full diff, and recent commits before committing.
- [ ] Commit the application hardening with a Conventional Commit such as
      `fix(catalog): surface database connection failures`.
- [ ] Commit diagnostics and documentation with Conventional Commits such as
      `chore(db): add local connection diagnostic` and
      `docs: document catalog database troubleshooting`.
- [ ] Merge `fix/catalog-display-database-connection` into `main` only after
      verification passes.
- [ ] Confirm `main` is clean and the demo uses the same database that was
      migrated and seeded.
