# Wireframe Visual Alignment

This hotfix aligns the existing Angular screens with the canonical [SVG wireframes](ui-wireframes/README.md). It changes presentation and navigation controls while preserving the current catalog, authentication, cart, address, and administrative contracts.

The checkout review described here was subsequently extended by [slice 5](transactional-checkout.md), which adds transactional orders, payment simulation, and result/retry states using the same visual system.

## Screen coverage

| Existing screen                                                   | Reference | Delivered alignment                                                                                                                                                                                                                    |
| ----------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storefront shell                                                  | 01–05     | Compact white brand bar, primary navigation, usable catalog search, cart badge, account menu, responsive navigation, and restrained footer.                                                                                            |
| Homepage                                                          | 01        | Grip cards and compact product showcase. Search remains available in an expandable section. The existing hero artwork, copy, sizing, colors, and responsive rules are preserved in `home-hero.css`.                                    |
| Catalog                                                           | 02        | 260 px filter column, checkbox brand/connectivity facets, selectable grip pills, secondary filters in an expandable section, three-column desktop cards, result count, sorting, and pagination. Existing URL filters remain shareable. |
| Product detail                                                    | 03        | White gallery and information cards, blue image stage and thumbnails, price panel, four essential specification cells, shipping estimate, gold cart action, and expandable secondary specifications.                                   |
| Cart                                                              | 04        | Product rows with contained images, quantity controls, removal action, and a separate shipping/total summary.                                                                                                                          |
| Checkout review                                                   | 05        | Delivery selection precedes item review in the left column; estimates and revalidation remain in the right summary.                                                                                                                    |
| Login, registration entry, authentication callback, access denied | 07–08     | Minimal brand header, centered card, consistent typography, gold primary action, and responsive spacing. The existing identity-provider redirect remains the authentication mechanism.                                                 |
| Customer account and address forms                                | 08        | 760 px white form card, personal-data/address sections, two-column desktop fields, delivery address cards, and single-column mobile layouts.                                                                                           |
| Administrative product, brand, and customer lists                 | 10        | 240 px navy sidebar, purple active item with gold marker, shared page headings, white table panels, blue headers, spaced rows, and contained horizontal table scrolling.                                                               |
| Administrative product, brand, and customer create/edit forms     | 11 and 08 | Consistent white form panels, responsive field grids, section headings, gold save actions, and a blue product-photo editor beside the desktop product form.                                                                            |

## Intentional differences

- The homepage hero is the explicitly requested exception. Its CSS is isolated to prevent shared presentation changes from affecting it.
- Product photos, prices, stock, catalog results, customer details, and sidebar identity come from application data; wireframe sample content is not hard-coded into the application.
- Existing supported fields, validation feedback, loading/error states, retry controls, and stock revalidation remain available even when they are absent from the static SVGs.
- Registration and password entry continue on the existing identity-provider pages. This hotfix does not add duplicate password forms or modify realm/client settings.
- The current checkout is an address and availability review. Payment selection and order confirmation are pending transactional implementation; no inactive payment controls or simulated purchase action have been added.
- The order portal and administrative order dashboard (06 and 09) remain roadmap items because those routes do not exist yet.
- Product photos continue to use image URLs. The photo stage opens the existing image editor; it does not imply unsupported file upload.
- Only existing routes appear in navigation. The reference's order and standalone brand navigation items require future screens.

## Validation

- Angular unit tests cover existing behavior plus catalog facet interactions, header search, and switching between minimal authentication and storefront navigation.
- A production build checks Angular templates, TypeScript, Sass, and the existing bundle/style budgets without raising their limits.
- Chromium review uses synthetic catalog/customer data and a browser-only authentication adapter on an isolated preview origin. It does not write to the API, change customer records, or change identity-provider configuration.
- The browser review checks all existing screen types at 1440, 1024, 768, 375, and 320 px, including product image containment and mobile navigation/form interactions.
- Hero markup and all desktop/mobile CSS declarations are checked against the pre-hotfix version. Desktop and mobile captures are compared using independently built production versions.

No backend endpoint, API DTO, database schema, Flyway migration, or third-party dependency is changed.

## Verification results

- **Unit tests:** 61 passed across 17 files (`cd web && npm test -- --watch=false`).
- **Production build:** passed without warnings (`cd web && npm run build`); initial bundle 492.83 kB, within the existing 500 kB warning threshold.
- **Visual matrix:** 18 screen variants across five viewport widths, plus expanded filters, mobile search/navigation, address entry, image entry, checkout delivery placement, and empty-cart checks.
- **Hero preservation:** identical hero markup and CSS declarations, matching internal computed geometry/styles at 1440 and 375 px, and unchanged artwork checksums. The header's new height changes the banner's page offset.
- **Formatting:** Prettier check and `git diff --check` passed.
- **Backend:** tests were not rerun because backend code and contracts are unchanged.

## Changed files

### Documentation

- [`docs/visual-alignment.md`](../docs/visual-alignment.md)

### Frontend

- [`web/src/app/components/auth/auth-page.css`](../web/src/app/components/auth/auth-page.css)
- [`web/src/app/components/auth/auth-page.html`](../web/src/app/components/auth/auth-page.html)
- [`web/src/app/components/clientes/cliente-form/cliente-form.css`](../web/src/app/components/clientes/cliente-form/cliente-form.css)
- [`web/src/app/components/clientes/cliente-form/cliente-form.html`](../web/src/app/components/clientes/cliente-form/cliente-form.html)
- [`web/src/app/components/clientes/cliente-list/cliente-list.css`](../web/src/app/components/clientes/cliente-list/cliente-list.css)
- [`web/src/app/components/clientes/cliente-list/cliente-list.html`](../web/src/app/components/clientes/cliente-list/cliente-list.html)
- [`web/src/app/components/marcas/marca-form/marca-form.css`](../web/src/app/components/marcas/marca-form/marca-form.css)
- [`web/src/app/components/marcas/marca-list/marca-list.css`](../web/src/app/components/marcas/marca-list/marca-list.css)
- [`web/src/app/components/marcas/marca-list/marca-list.html`](../web/src/app/components/marcas/marca-list/marca-list.html)
- [`web/src/app/components/mouses/mouse-form/mouse-form.css`](../web/src/app/components/mouses/mouse-form/mouse-form.css)
- [`web/src/app/components/mouses/mouse-form/mouse-form.html`](../web/src/app/components/mouses/mouse-form/mouse-form.html)
- [`web/src/app/components/mouses/mouse-list/mouse-list.css`](../web/src/app/components/mouses/mouse-list/mouse-list.css)
- [`web/src/app/components/mouses/mouse-list/mouse-list.html`](../web/src/app/components/mouses/mouse-list/mouse-list.html)
- [`web/src/app/components/storefront/cart/cart.css`](../web/src/app/components/storefront/cart/cart.css)
- [`web/src/app/components/storefront/cart/cart.html`](../web/src/app/components/storefront/cart/cart.html)
- [`web/src/app/components/storefront/cart/cart.ts`](../web/src/app/components/storefront/cart/cart.ts)
- [`web/src/app/components/storefront/catalog/catalog.css`](../web/src/app/components/storefront/catalog/catalog.css)
- [`web/src/app/components/storefront/catalog/catalog.html`](../web/src/app/components/storefront/catalog/catalog.html)
- [`web/src/app/components/storefront/catalog/catalog.ts`](../web/src/app/components/storefront/catalog/catalog.ts)
- [`web/src/app/components/storefront/home/home.css`](../web/src/app/components/storefront/home/home.css)
- [`web/src/app/components/storefront/home/home.html`](../web/src/app/components/storefront/home/home.html)
- [`web/src/app/components/storefront/home/home.ts`](../web/src/app/components/storefront/home/home.ts)
- [`web/src/app/components/storefront/product-card/product-card.css`](../web/src/app/components/storefront/product-card/product-card.css)
- [`web/src/app/components/storefront/product-card/product-card.html`](../web/src/app/components/storefront/product-card/product-card.html)
- [`web/src/app/components/storefront/product-detail/product-detail.css`](../web/src/app/components/storefront/product-detail/product-detail.css)
- [`web/src/app/components/storefront/product-detail/product-detail.html`](../web/src/app/components/storefront/product-detail/product-detail.html)
- [`web/src/app/components/storefront/product-image/product-image.ts`](../web/src/app/components/storefront/product-image/product-image.ts)
- [`web/src/app/layouts/admin-layout/admin-layout.css`](../web/src/app/layouts/admin-layout/admin-layout.css)
- [`web/src/app/layouts/admin-layout/admin-layout.html`](../web/src/app/layouts/admin-layout/admin-layout.html)
- [`web/src/app/layouts/storefront-layout/storefront-layout.css`](../web/src/app/layouts/storefront-layout/storefront-layout.css)
- [`web/src/app/layouts/storefront-layout/storefront-layout.html`](../web/src/app/layouts/storefront-layout/storefront-layout.html)
- [`web/src/app/layouts/storefront-layout/storefront-layout.ts`](../web/src/app/layouts/storefront-layout/storefront-layout.ts)
- [`web/src/material-theme.scss`](../web/src/material-theme.scss)
- [`web/src/styles.css`](../web/src/styles.css)
- [`web/src/app/components/storefront/cart/cart-addresses.css`](../web/src/app/components/storefront/cart/cart-addresses.css)
- [`web/src/app/components/storefront/home/home-hero.css`](../web/src/app/components/storefront/home/home-hero.css)
- [`web/src/app/layouts/storefront-layout/storefront-footer.css`](../web/src/app/layouts/storefront-layout/storefront-footer.css)

### Tests

- [`web/src/app/components/storefront/catalog/catalog.spec.ts`](../web/src/app/components/storefront/catalog/catalog.spec.ts)
- [`web/src/app/layouts/storefront-layout/storefront-layout.spec.ts`](../web/src/app/layouts/storefront-layout/storefront-layout.spec.ts)
