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
