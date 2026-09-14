# Product Images and Asset Management Study

## Scope

Phase 5 should make seeded product imagery visible in the customer menu and
establish a reliable asset convention for future catalog work. The current
application already has the necessary database field and seed values:

- `Product.imageUrl String?` exists in `prisma/schema.prisma`.
- `prisma/seed.ts` assigns deterministic `images.unsplash.com` URLs to all 12
  seeded products.
- `getActiveCatalog` includes `imageUrl` in its serializable view model.
- `components/catalog-menu.tsx` currently ignores `product.imageUrl` and renders
  only a CSS `PlaceholderImage` abstraction.
- `next.config.ts` has no `images.remotePatterns` configuration.

The immediate implementation gap is therefore UI rendering and image-host
configuration, not a missing Prisma field. The study still evaluates storage
choices so the implementation does not lock the project into a fragile asset
source.

## Image Sourcing and Storage Options

### External Unsplash Image IDs

The existing seed uses fixed Unsplash image IDs rather than random source URLs.
This is better than `source.unsplash.com`-style random URLs because each slug
gets a repeatable URL and the seed remains idempotent. Unsplash imagery also
fits the cafe visual language and avoids committing binary assets to the
repository.

Benefits:

- No repository binary size increase.
- Realistic coffee, beverage, and pastry photography quickly improves the demo.
- Existing fixture URLs require no data migration or seed-shape redesign.
- `next/image` can optimize remote assets after the host is allowlisted.

Risks:

- The demo depends on an external service, network availability, URL stability,
  and the source host's delivery policies.
- Remote responses can be slow, unavailable, or changed without repository
  control.
- Production use may require reviewing Unsplash API, attribution, hotlinking,
  and caching terms.
- Every environment needs the same `next.config.ts` remote host policy.

Fixed Unsplash URLs are suitable for a prototype and local demo, but they are
not the strongest long-term source of truth for production catalog assets.

### `placehold.co` or Similar Placeholder Service

`placehold.co` can supply deterministic, lightweight placeholder images based
on text or category colors. It is useful when the goal is to test layout rather
than showcase photography.

Benefits:

- Deterministic URLs and no asset management workflow.
- Easy to generate from a slug or product name.
- Makes missing-image and fallback states obvious.

Risks:

- It does not provide an appetizing cafe experience.
- It still introduces a runtime network dependency.
- Remote host configuration remains necessary when rendered with `next/image`.

It is best as a fallback or temporary QA source, not as the primary product
imagery for the Digital Cafe demo.

### Local Static Assets in `public/images`

Local assets can be stored under `public/images/products/` and referenced with
root-relative paths such as `/images/products/house-latte.jpg`.

Benefits:

- No runtime dependency on a third-party image host.
- Stable behavior in development, CI, and production.
- No `remotePatterns` configuration is required.
- Asset ownership, review, and cache behavior are under project control.

Risks:

- Binary images increase repository size and may require image licensing review.
- High-resolution source files can make Git history and deployment artifacts
  unnecessarily large.
- Product photography must be sourced, resized, compressed, and replaced by
  someone on the project.
- The current workspace contains no approved product image assets, so adding
  arbitrary downloaded images would create a content/licensing decision.

Local assets are the strongest production architecture when the project owns
the imagery, but they should not be fabricated or downloaded without an
approved asset set.

### Recommended Choice

For the immediate Phase 5 implementation, retain the existing fixed Unsplash
URLs as seeded demo data and render them through `next/image`, with a
category-based CSS fallback when `imageUrl` is absent or the image fails.

This is the smallest correct change because the schema, seed fixtures, and
server view model already support URLs. Document the external dependency and
keep the `imageUrl` field source-agnostic so a later asset migration can replace
URLs with local paths without changing the product contract.

For production, prefer local or owned object-storage assets after licensing and
asset operations are decided. That decision should be a separate asset
management phase rather than silently committing third-party images now.

## Database Update

`Product.imageUrl` is already present as a nullable string, so no Prisma schema
change or migration is required for Phase 5. Keeping it nullable is important:

- Existing products and future admin-created products may not have an image.
- The UI must have a deliberate fallback rather than requiring a broken URL.
- Historical orders do not need image snapshots because receipt identity is
  represented by product name and price snapshots.

The seed should continue to populate every fixture with a deterministic URL.
The update branch of each product upsert must refresh `imageUrl`, and the create
branch must set it as well. The seed should not generate random URLs or fetch
images during execution.

The application view model already includes `imageUrl`, so the data path should
be verified rather than duplicated:

1. Prisma returns `imageUrl` from `Product`.
2. `getActiveCatalog` serializes it into `CatalogProduct`.
3. `ProductCard` receives the value from the server component boundary.
4. The image component uses it only when it is a valid external or local URL.

## Next.js Image Optimization

Replace the current CSS-only placeholder at the top of `ProductCard` with a
dedicated image frame that uses `next/image` when `product.imageUrl` is
available. The frame should have a fixed responsive aspect ratio and preserve
the existing rounded card treatment.

Recommended behavior:

- Use `fill` inside a `relative` container with an explicit aspect ratio or
  fixed height.
- Set `sizes` to match the responsive card grid, for example
  `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw`.
- Use `className="object-cover"` for photography so the frame is fully
  covered without distortion.
- Add a meaningful `alt` value such as `${product.name} from Digital Cafe`.
- Use `priority` only for a small number of above-the-fold images; leave the
  rest lazy-loaded by default.
- Keep the placeholder background behind the image so a loading state is not a
  blank rectangle.
- Provide an error/fallback path. `next/image` does not offer a built-in
  declarative fallback, so a small client image component can switch to the
  existing category placeholder on `onError`.

The product card is already a client component because it owns modifier and cart
interaction. A small `ProductImage` component can therefore manage image error
state without converting any additional server components. It should not fetch
or transform image data in the browser beyond rendering the provided URL.

Avoid using plain `<img>` as the default implementation because it forfeits
Next.js optimization, responsive sizing, and built-in lazy loading. Avoid
passing a remote image URL to `next/image` without host configuration because
Next.js will reject it at runtime/build time.

## Next.js Configuration

Because the current fixture URLs use `images.unsplash.com`, add a narrow
`images.remotePatterns` entry in `next.config.ts`:

```ts
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "images.unsplash.com",
      pathname: "/**",
    },
  ],
},
```

Allowlisting the exact hostname is preferable to a broad wildcard. Query
parameters in the seeded URLs control requested crop/quality and do not need to
be included in the pathname pattern. If the project later changes to a local
asset path, remove the remote pattern after all remote URLs are migrated.

`next.config.ts` should not allow arbitrary user-provided hostnames. If admins
eventually manage image URLs, validate allowed hosts at the server boundary or
move assets to an owned storage domain.

## Accessibility and Responsive UX

Image presentation should support, not compete with, the product information:

- Product names and descriptions remain visible text, not image-only labels.
- `alt` text should identify the product without repeating the full description.
- Decorative placeholder shapes should use empty alt behavior through the
  fallback component rather than creating redundant screen-reader content.
- Images should crop consistently across the three-column desktop, two-column
  tablet, and one-column mobile layouts.
- The image frame should not cause cumulative layout shift; reserve its space
  before the image loads.
- A failed or missing image should preserve the card's layout and contrast.

## Verification Strategy

Verification should cover the complete asset path:

- Confirm `Product.imageUrl` exists in the Prisma schema and generated client.
- Run the seed and verify every fixture has a valid HTTPS URL.
- Confirm the catalog query's serialized result retains image URLs.
- Render the home page and confirm `next/image` output is present for seeded
  products.
- Confirm the configured Unsplash host is accepted by Next.js.
- Simulate a missing URL or image error and confirm the category placeholder is
  shown without layout collapse.
- Check mobile and desktop card aspect ratios and object cropping.
- Run lint, typecheck, tests, and production build.
- Inspect the build for accidental secrets or overly broad remote host rules.

## Recommended Decisions

1. Keep `Product.imageUrl` nullable; no Prisma migration is needed.
2. Keep deterministic Unsplash URLs for the demo seed in this phase.
3. Add an exact `images.unsplash.com` remote pattern to `next.config.ts`.
4. Add a client-safe `ProductImage` component using `next/image`, `fill`,
   `object-cover`, responsive `sizes`, accessible alt text, and fallback state.
5. Preserve the existing CSS category placeholder as the missing/error fallback.
6. Revisit local or owned object-storage assets before production launch.

## Out of Scope

This phase does not download or license new binary assets, build an admin media
library, add image uploads, introduce object storage, redesign product data,
change order snapshots, or make remote image URLs user-configurable.
