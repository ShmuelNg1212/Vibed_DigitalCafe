# Vercel Deployment Plan

This plan implements `doc/study/013-vercel-deployment-study.md`. It must be
executed only after the deployment account and production database credentials
are available.

## Preconditions

- [x] Approve this deployment plan.
- [x] Authenticate Vercel CLI with `vercel login` or provide `VERCEL_TOKEN`.
- [x] Create or select a hosted PostgreSQL database and obtain its
      `DATABASE_URL`.
- [x] Generate a production `SESSION_SECRET`.
- [x] Confirm whether demo users should be seeded into the public deployment.

## Repository and Branch

- [x] Inspect a clean `main` worktree and create:
      `git switch -c chore/vercel-deployment`.
- [x] Verify the GitHub remote is
      `https://github.com/ShmuelNg1212/Vibed_DigitalCafe.git`.
- [x] Verify `.env` and all production secrets are ignored and untracked.

## Vercel Project

- [x] Link the repository with `npx vercel link` or create the project through
      the authenticated Vercel CLI.
- [x] Confirm framework detection identifies Next.js.
- [x] Configure production environment variables:
      `DATABASE_URL`, `SESSION_SECRET`, `TAX_RATE_BPS`, and
      `NEXT_PUBLIC_TAX_RATE_BPS`.
- [x] Do not add secrets to source files, `.env.example`, or Git history.
- [x] Review `allowedDevOrigins` and remove the local forwarded hostname from
      production configuration if it is not required.

## Database Preparation

- [x] Run `npx prisma generate` locally.
- [x] Apply migrations to the hosted database with
      `npx prisma migrate deploy`.
- [x] Run `npx prisma db seed` if demo catalog/users are approved.
- [x] Run `npm run db:check` with the hosted `DATABASE_URL`.
- [x] Confirm active product count and migration name before deploying.

## Deploy and Verify

- [x] Run the production build locally.
- [x] Deploy with `npx vercel --prod`.
- [x] Record the Vercel deployment URL.
- [x] Verify the public home page returns 200 and catalog items render.
- [ ] Verify registration, login, logout, and account navigation manually.
- [ ] Verify direct/customized cart additions and localStorage persistence manually.
- [ ] Verify checkout creates a user-associated order manually.
- [ ] Verify `/orders` is protected and user-scoped manually.
- [x] Inspect Vercel runtime logs for Prisma/database failures.

## Documentation and Rendezvous

- [x] Update `doc/wiki/setup.md` with Vercel deployment and hosted database
      instructions.
- [x] Update `doc/wiki/architecture.md` with the production hosting boundary.
- [ ] Update `doc/wiki/data-models.md` only if production migration/seed policy
      changes data semantics.
- [ ] Commit deployment documentation with a Conventional Commit.
- [ ] Merge `chore/vercel-deployment` into `main` if code/documentation changes
      were made.
- [ ] Push `main` to GitHub.
- [ ] Confirm the final worktree is clean and report the public URL.
