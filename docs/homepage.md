# Visual Foundation and Homepage

The first storefront slice implements the visual foundation from
[01-storefront-home.svg](ui-wireframes/01-storefront-home.svg) and the approved
MouseTrap palette. The root route now opens the homepage instead of brand
administration.

## Delivered behavior

- Brand colors mapped to Angular Material M3 system tokens, with shared spacing,
  surfaces, radius, focus and button styles. Body text uses system fonts; headings prefer installed Inter and fall back
  to system fonts. There is no required webfont download for text.
- Separate storefront and legacy administration layouts. The storefront includes
  SVG branding, responsive navigation, a mobile menu and footer. Existing CRUD
  routes and edit resolvers retain their paths and HTTP contracts.
- Hero with the supplied mouse image, HTML heading and CTA, a dark overlay for
  readability and a stacked composition on mobile.
- Three expandable guides for Claw, Palm and Fingertip grips. These explain grip
  choices; they do not pretend to filter products by fields absent from the API.
- Reusable product cards showing real brand, name, description, price, stock
  status, weight, DPI, color, buttons and connectivity.
- Catalog preview with submit-based name search, clear, loading, empty, error and
  retry states. A new search cancels the previous request.
- A skip link, semantic regions, keyboard-operable menus/details, descriptive
  homepage metadata, visible focus and tabular numbers for specifications/prices.

## Routing

| Destination | Route |
| --- | --- |
| Homepage | `/` |
| Preview and search | `/#catalogo`, `/#busca` |
| Grip guide | `/#pegadas` |
| Existing brands CRUD | `/marcas`, `/marcas/novo`, `/marcas/editar/:id` |
| Existing mice CRUD | `/mouses`, `/mouses/novo`, `/mouses/editar/:id` |
| Existing customers CRUD | `/clientes`, `/clientes/novo`, `/clientes/editar/:id` |

Unknown frontend routes return to `/`. Hosting still needs the normal Angular
SPA fallback to `index.html` for direct navigation to existing CRUD routes.
The future `/admin/**` namespace and public `/mouses` catalog are not introduced
by this slice.

## Catalog preview contract

The homepage reuses `MouseService` and existing paginated GET contracts. It
requests batches of 12 through `/mouses` or `/mouses/nome/{nome}`, preserving the
server's name ordering. It collects up to three products for which both the
product and brand are active, continuing to subsequent pages if necessary.
The preview does not claim these are weekly highlights or best sellers.

The filtering is for presentation only. The existing backend still returns
administrative records; a dedicated public contract and server-side visibility
rules remain part of the next slice. An active product with zero stock is shown
as unavailable. Cards have no purchase action until cart/checkout are delivered.

There is no product-image contract yet, so the Material Icons mouse glyph appears
with an explicit “Imagem ilustrativa” label. The custom brand SVG stays in the
headers and footer. No test products are bundled into the
application. If the API has no active records or is unavailable, the appropriate
state is shown without hiding the rest of the homepage.

## Hero assets and build

`web/public/Hero.jpg` remains the original source, unchanged. The homepage loads
only the responsive derivatives below, selected using `srcset` and `sizes`:

| File under `web/public/images/` | Dimensions | Bytes |
| --- | --- | --- |
| `hero-768.webp` | 768 × 429 | 25,052 |
| `hero-1440.webp` | 1440 × 804 | 59,158 |
| `hero-2400.webp` | 2400 × 1340 | 179,760 |

The decorative hero image has intrinsic dimensions and high fetch priority.
Product placeholders use the shared local icon font. The copy and CTA remain
HTML content.

Production optimization keeps scripts/styles enabled and disables font inlining,
so a build no longer needs to retrieve Google Fonts. Material interface icons are now self-hosted as documented in
[Material Icons](material-icons.md); the Google Fonts runtime stylesheet is no
longer used. No package dependencies were added.

## Validation

From `web`:

```sh
npm test -- --watch=false
npm run build
```

The frontend suite passed **21 tests across 7 files**. New coverage checks the
root layout, existing list routes, filtering inactive products/brands, paging
past inactive records, stale-request cancellation, clear, error and retry.
The production build passed all configured bundle and component-style budgets.

Chromium checks used intercepted API fixtures and verified the homepage at
1440, 768, 375 and 320 px: image loading, no horizontal overflow, grip guide,
search/clear, mobile navigation with Escape, keyboard access to the skip link,
error recovery and the legacy admin link.
The completed run had no browser JavaScript exceptions. It did not validate
the live API, database contents or authenticated flows.

## Next slice

Implement product images, expanded gaming specifications and the public catalog
contract before adding full catalog filters and product detail pages. Login,
cart, saved addresses, payments and purchases remain on the
[implementation backlog](implementation-backlog.md).

## Second-slice update

The full public catalog is now at `/catalogo`, with product details at
`/catalogo/:id`. Header links and the hero CTA open that catalog. The homepage
now uses `/catalogo/mouses?page=0&pageSize=3` and its optional `nome` parameter;
visibility is enforced by the backend instead of paging through administrative
records in the browser. Cards use gallery covers and link to details. The old
preview-contract and placeholder descriptions above document the first slice;
current behavior is specified in [Public catalog](public-catalog.md).

## Third-slice update

The header now offers account access and logout. Administration links are visible
only to authorized operators and open `/admin/**`. Legacy administrative URLs
redirect through guards. The owned profile/address form is at `/minha-conta`.
See [authentication and account ownership](authentication.md) for runtime
configuration, local identity/email setup and public versus protected API reads.

## Four-banner carousel — target release 1.1.0

The homepage now uses `HeroCarouselComponent` with the supplied four campaign
copies. It retains the established navy surface, yellow CTA, responsive product
artwork and stacked mobile composition. Material Icons replace the supplied
emoji/arrow notation: `flash_on`, `my_location`, `air`, `ac_unit`, `arrow_forward`,
`chevron_left`, `chevron_right`, `pause` and `play_arrow`. The custom SVG brand
remains the ecommerce mark.

The carousel advances every seven seconds and wraps from banner 4 to banner 1.
Visitors can choose a banner, use previous/next buttons or stop/start rotation.
Hover and a hidden browser tab suspend rotation. Keyboard focus stops it until
an explicit restart; focus never follows an automatic slide change. A reduced
motion preference disables the fade through the shared motion rule while the
seven-second rotation remains enabled. Explicit play also resumes rotation while
the pointer remains over the banner; subsequent pointer re-entry can suspend it
again. The play/pause icon and label reflect effective playback, including hover
and visibility suspension. Manual selections are announced; unattended changes
do not generate repeated live announcements.
Inactive slides are inert and hidden from assistive technology. Slide content
shares a grid cell, reserving the largest copy's height to prevent layout jumps.

| Banner | Artwork | CTA destination |
| --- | --- | --- |
| 1 — Speed | `Hero.jpg` | `/catalogo?pollingRateMin=4000&tipoSwitch=1` |
| 2 — Precision | `Hero2.jpg` | `/catalogo?ordenar=maior-dpi` |
| 3 — Ultralight | `Hero3.jpg` | `/catalogo?pesoMax=59.99&ordenar=menor-peso` |
| 4 — Glide | `Hero4.jpg` | `/catalogo` |

These destinations use existing catalog contracts. DPI sorting does not certify
sensor tracking quality. The domain has no PTFE/skate field, so the fourth CTA
opens the public catalog without inventing a filter or assigning specifications
to products. Campaign text is the copy supplied for this feature; product
specification sheets continue to use actual catalog data.

Original JPEG files are preserved. Only WebP derivatives at 768, 1440 and 2400 px
are loaded, with explicit dimensions and responsive srcset/sizes. The first image
has high fetch priority; the other banners create an image only when first shown.
Previously visited images remain reusable. To regenerate the derivatives on a
Linux workstation with GdkPixbuf/GObject/libwebp runtime libraries:

```sh
python3 scripts/export_hero_images.py
```

The exporter needs the system's working image-loader session (including D-Bus
where the installed GdkPixbuf loader uses it); it is not part of normal build or
runtime requirements. The generated assets are committed. The original hero-1
filenames remain stable for existing OpenGraph references.

Accessibility behavior follows the [WAI carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/).
This is a compatible feature under the [versioning policy](versioning.md), so the
next release target is **1.1.0**. This feature does not republish 1.0.0 or change
application manifest versions before release preparation.

Angular's public-asset copy excludes `Hero*.jpg` originals from the deployed
build. They remain versioned source artwork; all four visible banners use WebP.

### Carousel validation

- `cd web; npm test -- --watch=false`: 104 tests passed across 25 files, including
  rotation/wrapping, deferred images, timer disposal, pointer/focus ordering,
  visibility/hover pauses, reduced motion, announcements and CTA parameters.
- `cd web; npm run build`: passed all budgets; 344.53 kB initial bundle. All 12
  responsive WebP files are present and original hero JPEGs are excluded.
- `CAROUSEL_BASE_URL=http://127.0.0.1:14206 npm run e2e -- carousel.spec.ts` against
  a temporary local production preview: 4 browser tests passed. The checks cover
  20 banner/viewport combinations (1440, 1024, 768, 375, 320 px), stable hero
  height, image loading, CTA containment/navigation, Material icons, keyboard
  focus, automatic rotation/hover pauses, explicit play while hovered, autoplay
  with reduced-motion preferences (without animated transitions) and eight Axe
  WCAG audits.
- Browser catalog reads were intercepted public fixtures; no authenticated
  purchase, live backend suite or remote CI run was repeated for this feature.
- `python3 -m unittest discover -s scripts -p 'test_*.py' -v`: 3 packaging/stack
  regression tests passed. The exporter is included in the source archive allowlist.
- Updated local documentation links and `git diff --check` passed. No dependency,
  backend contract, migration, published tag or application manifest version changed.
