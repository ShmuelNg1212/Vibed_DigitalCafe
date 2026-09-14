# Product Images and Asset Management Plan

This plan implements `doc/study/005-product-images-study.md`. It was approved
and executed on `feat/product-images`.

## Preconditions and Branch

- [x] Review and approve this plan.
- [x] Confirm that fixed Unsplash URLs are acceptable for the demo and that no
      local licensed image set is available yet.
- [x] Confirm that `Product.imageUrl` remains nullable and no schema migration
      is expected.
- [x] From clean `main`, create and check out:
      `git switch -c feat/product-images`.

## Database and Seed Verification

- [x] Inspect `prisma/schema.prisma` and confirm `Product.imageUrl` is present
      as a nullable string.
- [x] Run `npm run db:validate` and `npm run db:generate` before edits.
- [x] Inspect the seeded product fixtures and confirm every product has a
      deterministic `images.unsplash.com` URL.
- [x] Ensure product upsert `update` and `create` branches both write
      `imageUrl`.
- [x] Run `npx prisma db seed` against the configured local database.
- [x] Query or use `npm run db:check` to verify all active products have valid
      image URLs.
- [x] Do not create a Prisma migration unless the field is unexpectedly absent
      in the actual baseline.

## Next.js Image Configuration

- [x] Update `next.config.ts` with an exact HTTPS
      `images.remotePatterns` entry for `images.unsplash.com` and pathname
      `/**`.
- [x] Avoid wildcard external host configuration and do not allow arbitrary
      user-provided image hosts.
- [x] Verify the configuration is compatible with the current Next.js version.

## Product Image Component

- [x] Extract the current category placeholder visual into a reusable fallback
      component or retain it as the fallback branch of a new `ProductImage`.
- [x] Create a client-safe `ProductImage` component that accepts product name,
      category, and nullable `imageUrl`.
- [x] Render `next/image` for a valid image URL using a reserved responsive
      frame, `fill`, `object-cover`, rounded clipping, and responsive `sizes`.
- [x] Add accessible alt text based on the product name.
- [x] Use image loading/error state to fall back to the category-based CSS
      placeholder without shifting the card layout.
- [x] Ensure missing URLs use the fallback immediately without rendering a
      broken image.
- [x] Preserve the existing visual language and category-specific placeholder
      gradients.

## Product Card Integration

- [x] Replace the CSS-only placeholder call in `ProductCard` with
      `ProductImage`.
- [x] Keep product name, description, badge, price, and action controls as
      visible HTML text/UI outside the image.
- [x] Do not move Prisma access or image fetching into the browser.
- [x] Verify `CatalogProduct.imageUrl` remains serializable across the server to
      client boundary.
- [x] Verify responsive image sizing across one-column mobile, two-column
      tablet, and three-column desktop cards.

## Verification

- [x] Run the seed command and verify every product has a valid HTTPS image URL.
- [x] Run the development app and verify seeded product images appear in all
      Hot Coffee, Iced Drinks, and Bakery cards.
- [x] Verify the image URL is accepted by Next.js without remote-host errors.
- [x] Verify a missing URL and an image load error render the category fallback.
- [x] Verify image frames reserve space, use `object-cover`, and do not cause
      visible layout shift.
- [x] Verify alt text is meaningful and decorative fallback content is not
      duplicated for assistive technology.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- [x] Inspect the diff for secrets, overly broad host permissions, and
      accidental binary files.

## Commit, Rendezvous, and Documentation Sync

- [ ] Inspect `git status`, the complete diff, and recent commits before
      committing.
- [ ] Commit image implementation with a Conventional Commit such as
      `feat(menu): render optimized product images`.
- [ ] Update `doc/wiki/setup.md` with image-host and seed verification notes.
- [ ] Update `doc/wiki/architecture.md` with the ProductImage and remote asset
      boundary.
- [ ] Update `doc/wiki/data-models.md` to clarify `Product.imageUrl` remains a
      nullable display asset reference with no order snapshot requirement.
- [ ] Merge `feat/product-images` back into `main` only after all checks pass.
- [ ] Verify `main` is clean and the documented image/seed workflow works.
