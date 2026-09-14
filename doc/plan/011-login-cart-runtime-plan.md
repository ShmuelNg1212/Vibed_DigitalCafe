# Login and Cart Runtime Plan

This plan implements `doc/study/011-login-cart-runtime-study.md`. It is
awaiting approval and must not be executed until approved.

## Reproduce Runtime State

- [x] Inspect clean `main` and create:
      `git switch -c fix/login-cart-runtime`.
- [x] Run `npm run db:check` and `npx prisma db seed` against the `.env`
      database.
- [x] Verify the login API directly with the demo customer credentials.
- [x] Open the app through the forwarded browser origin and inspect browser
      console, script requests, and cookie storage.
- [x] Hard reload after restarting Next.js and verify the current bundle is
      loaded.
- [x] Click direct-add and customize actions and capture client/runtime errors.

## Login Hardening

- [x] Wrap the login `fetch` call in `try/catch/finally` in
      `app/login/page.tsx`.
- [x] Display a useful network/server error while preserving the invalid
      credential message for HTTP 401/400 responses.
- [x] Always clear the pending state in `finally`.
- [x] Preserve the `next` redirect behavior.
- [x] Add a login component/API test for success, invalid credentials, and
      request failure if the existing test setup supports it.

## Client Runtime and Cart Verification

- [x] Verify `CartShell` and `CatalogMenu` hydrate on the forwarded origin.
- [x] Add a development-only cart event diagnostic or test hook if necessary,
      then remove or make it safe before commit.
- [x] Confirm `ProductCard.add` dispatches and `onAdded` opens the cart sheet in
      the actual client runtime.
- [x] Confirm localStorage updates after the add.
- [x] Do not add authentication requirements to product/cart actions.

## Dev-Origin Configuration

- [x] Determine the actual forwarded demo hostname from the runtime.
- [x] If required, add that exact hostname to `allowedDevOrigins` in
      `next.config.ts`; do not use a broad wildcard.
- [x] Restart Next.js after configuration changes and document hard reload
      requirements.
- [x] Verify all client JavaScript requests return HTTP 200.

## Verification and Rendezvous

- [x] Test demo customer login through the browser.
- [x] Test direct add, customized add, cart sheet, refresh persistence, and
      checkout redirect through the browser.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- [x] Update this plan as tasks complete and inspect the full diff.
- [x] Update `doc/wiki/setup.md` with runtime troubleshooting.
- [x] Update `doc/wiki/architecture.md` with client hydration/runtime boundary
      notes if changed.
- [x] Commit with Conventional Commits, merge to `main`, and verify clean state.
