# User Registration and Order History Plan

This plan implements `doc/study/012-user-registration-history-study.md`. It
was approved and executed on `feat/user-registration-history`.

## Registration

- [x] Create `feat/user-registration-history` from clean `main`.
- [x] Add registration Zod schema for name, email, password, and confirmation.
- [x] Add `app/register/actions.ts` Server Action with duplicate-email check,
      bcrypt hashing, Prisma user creation, safe errors, and signed session
      cookie issuance.
- [x] Add `/register` React Hook Form UI with field errors, pending state,
      duplicate-email feedback, and optional internal `next` redirect.
- [ ] Add dedicated registration integration tests for duplicate email and
      hashed password persistence.

## Checkout and History

- [x] Verify checkout derives `userId` from the current signed session.
- [x] Keep account-required checkout policy and preserve cart through login or
      registration.
- [x] Verify `/orders` scopes all queries by current session user ID.
- [ ] Add explicit browser/integration coverage that another user cannot access
      an order history route.
- [ ] Improve order history empty/authenticated presentation if needed after
      runtime review.

## Navigation and Sign Out

- [x] Add authenticated account navigation with first-name greeting, My Orders,
      and Sign Out.
- [x] Wire Sign Out to the existing logout route and refresh home state.
- [x] Add a Create Account link to signed-out navigation and login.

## Documentation and Verification

- [ ] Update `doc/wiki/setup.md` with registration credentials and account flow.
- [ ] Update `doc/wiki/architecture.md` with registration/session boundaries.
- [ ] Update `doc/wiki/data-models.md` with registration and order ownership.
- [ ] Run `npm run db:check`, `npx prisma db seed`, `npm test`, lint, typecheck,
      and build.
- [ ] Inspect diff for plaintext passwords, unsafe redirects, and unscoped
      order queries.
- [ ] Commit with Conventional Commits, merge to `main`, and verify clean state.
