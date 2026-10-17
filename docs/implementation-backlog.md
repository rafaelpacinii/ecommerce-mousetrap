# MouseTrap Implementation Backlog

Repository audit: **2026-10-16**. Implementation updated through slice 5 on **2026-10-17**. This backlog compares the implementation with
`AGENTS.md`, the UI wireframes, and the domain planning documents. An item marked
implemented was found in source code; this does not establish production readiness
or replace running its tests. Priorities and implementation slices below are
proposals, not changes to existing HTTP contracts.

## Current baseline

| Area              | Evidence                                                                                                                                                                | Current implementation                                                                                                                                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog API       | [Resources](../api/src/main/java/br/unitins/tp2/resource/), [Mouse service](../api/src/main/java/br/unitins/tp2/service/MouseServiceImpl.java)                          | Brand and mouse CRUD, input validation, SKU/name uniqueness, paging/name search, prices, stock, active flags, and optimistic locking on mouse edits.                                                                                                                 |
| Customer API      | [Customer service](../api/src/main/java/br/unitins/tp2/service/ClienteServiceImpl.java), [CEP service](../api/src/main/java/br/unitins/tp2/service/CepServiceImpl.java) | Customer CRUD, identity-scoped profiles and multiple saved addresses, shared municipalities/states, ViaCEP lookup and server-side validation.                                                                                                                        |
| Orders API        | [Order service](../api/src/main/java/br/unitins/tp2/service/PedidoServiceImpl.java), [contracts](transactional-checkout.md)                                             | Owned review/create/read/payment/cancellation, authoritative totals, snapshots, stock locks, UUID idempotency, and scheduled expiry.                                                                                                                                 |
| Database          | [Migrations](../api/src/main/resources/db/migration/)                                                                                                                   | V1: catalog; V2: customers, municipalities, states; V3: images/specifications; V4: unique customer identity link; V5: owned delivery addresses; V6: orders, historical line/address snapshots, and simulated payment attempts. Wishlist persistence remains pending. |
| Administrative UI | [Routes](../web/src/app/app.routes.ts), [components](../web/src/app/components/)                                                                                        | Nine guarded CRUD routes under `/admin/**` for brands, mice, and customers; standalone Material components, reactive forms and edit resolvers. Brand/mouse lists have paging and name filters; customer list is unpaged.                                             |
| Branding          | [Public assets](../web/public/), [global styles](../web/src/styles.css)                                                                                                 | SVG/PNG/ICO icons, manifest, brand color variables. `Hero.jpg` is retained as source; the homepage uses responsive WebP exports.                                                                                                                                     |
| Theme and layout  | [Material theme](../web/src/material-theme.scss), [application template](../web/src/app/app.html)                                                                       | Brand colors are mapped to Material M3. Storefront and legacy administrative layouts are separate; the responsive admin sidebar is implemented.                                                                                                                      |
| Tests             | [Backend tests](../api/src/test/), frontend `*.spec.ts` files                                                                                                           | Catalog/customer/CEP tests plus public catalog, gallery and compatibility tests; frontend form/list/resolver, URL-filter and gallery coverage. Checkout ownership/concurrency/idempotency, payment, expiry and browser-recovery coverage are included in slice 5.    |

The `/` route now renders the storefront homepage; unknown routes redirect to it.
Legacy CRUD URLs redirect to guarded `/admin/**` screens under their own layout. The visible storefront
header/footer and administrative header use the SVG brand mark. See
[Homepage implementation](homepage.md) for the completed first slice and its limits.

## Screen coverage

Source of visual requirements: [wireframe index](ui-wireframes/README.md).
There are **12 SVGs: one design-system sheet and 11 screen wireframes**.

| Reference                            | Status                         | Remaining work                                                                                                                                                                                                 |
| ------------------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00 — Design system                   | Foundation implemented         | Brand colors mapped to Material M3, reusable surface/radius/button tokens, typography and numerical alignment. Continue applying them to future screens.                                                       |
| 01 — Homepage `/`                    | Implemented for current scope  | Responsive hero/header/footer, grip guide and searchable public-product preview with real gallery covers. Account and cart navigation are implemented; curated weekly highlights remain later work.            |
| 02 — Public catalog                  | Implemented at `/catalogo`     | Combined facets, safe sorting, server paging, URL state and mobile filters. `/mouses` remains administrative for compatibility.                                                                                |
| 03 — Product detail                  | Implemented at `/catalogo/:id` | Gallery, specs, current price, availability, image/error/missing states and metadata. Purchase and freight controls integrate with the implemented cart/checkout slices.                                       |
| 04 — Cart `/carrinho`                | Implemented                    | Local persistence, quantities, removal, totals, delivery estimates, stale-product handling, and confirmed-purchase receipts.                                                                                   |
| 05 — Checkout `/checkout`            | Implemented                    | Owned address selection, authoritative server review, transactional orders, PIX QR Code, local card validation, pending payments, retries, cancellation and expiry. See [checkout](transactional-checkout.md). |
| 06 — Customer portal `/meus-pedidos` | Missing                        | Personal orders and status timeline, details/tracking and wishlist views. Account/logout and owned saved addresses are already implemented.                                                                    |
| 07 — Login `/login`                  | Implemented                    | Unified entry, branded identity forms, recovery by email, PKCE, role-aware returns and session handling.                                                                                                       |
| 08 — Registration `/cadastro`        | Implemented for account scope  | Public identity registration and verification, followed by owned profile/address completion. Owned saved addresses are implemented in slice 4.                                                                 |
| 09 — Admin orders `/admin/pedidos`   | Missing                        | Admin shell/sidebar exists; order metrics, table, details and permitted transitions await orders.                                                                                                              |
| 10 — Admin catalog                   | Images/specs implemented       | The `/admin/mouses` table includes images/specifications and uses the protected admin shell. Broader administrative sorting remains later work.                                                                |
| 11 — Admin product form              | Implemented for catalog scope  | Validated form, version checks, URL gallery with ordering/cover/removal, sensor, polling rate, grip and switch fields. Binary upload is not part of this slice.                                                |

Brand and customer CRUD are integrated into the guarded admin shell, although
they do not have dedicated screen wireframes. Separate wireframes are still
needed for customer address/wishlist management and any additional category or
order-detail screens selected for implementation.

## Scope and contract alignment

Resolve these decisions before implementing the dependent backend features;
they do not block starting the theme, shared layout, and homepage structure.

| Topic                   | Conflicting or incomplete evidence                                                                                             | Proposed direction / required decision                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity                | Keycloak owns credentials; V4 links `Cliente` by token subject.                                                                | Implemented without local password storage. Legacy rows remain unclaimed; email matching never grants ownership.                                                                                                                  |
| Roles                   | Canonical `admin` and `customer` realm roles are enforced.                                                                     | Administrators can also maintain an owned shopping profile; no technical role names appear in customer screens.                                                                                                                   |
| Frontend routes         | Public browsing uses `/catalogo`; administration uses guarded `/admin/**`.                                                     | Legacy CRUD paths redirect, including create/edit routes. Edit resolvers execute after guards.                                                                                                                                    |
| Public catalog contract | Existing reads return administrative records, including inactive products; paging/name search are the only query capabilities. | Define an additive public read contract with active-brand/product rules, combined filters, safe sorting and image/spec projections. Preserve existing admin clients.                                                              |
| CEP route               | Actual API/client use `/ceps/{cep}`; master/root documentation mention `/cep/**`.                                              | Document the implemented plural path; do not rename it silently.                                                                                                                                                                  |
| Customer/address model  | V5 adds owned addresses while preserving legacy customer fields.                                                               | V6 snapshots the selected owned address; later edits/deletion do not alter historical orders.                                                                                                                                     |
| Categories              | Master roadmap includes categories; domain MVP explicitly defers them.                                                         | Confirm whether categories belong to v1 before adding entity, migration, API and screens.                                                                                                                                         |
| Payments/freight        | PIX and card simulation approved for slice 5; configurable freight already exists.                                             | Local payment engine; realistic customer UI, ephemeral card validation and PIX BR Code with final total and a fictitious recipient. No stored card data, installments or live provider. Simulation defaults off outside dev/test. |
| Order states            | The domain plan defines six Portuguese states with stable IDs.                                                                 | Implemented as AGUARDANDO_PAGAMENTO, PAGO, ENVIADO, ENTREGUE, CANCELADO, EXPIRADO; fulfillment operations remain slice 6.                                                                                                         |
| Merchandising           | Wireframes show weekly highlights and “best selling” sorting; neither data source exists.                                      | Define explicit featured-product selection. Only implement best-selling order when supported by actual sales data.                                                                                                                |

## Proposed delivery sequence

### 1. Visual foundation and homepage

- [x] Map the approved brand palette to Material M3; keep existing CRUD usable.
- [x] Create reusable storefront layout, brand link, responsive navigation,
      footer, content containers, product card and loading/empty/error states.
- [x] Introduce a homepage at `/`; keep the existing CRUD paths reachable during
      the route transition.
- [x] Integrate `Hero.jpg` with the “Precisão absoluta…” copy in HTML,
      readable text overlay, mobile crop rules and optimized image exports.
- [x] Use the new SVG mark in the visible header/footer.
- [x] Connect catalog links/search to implemented behavior; do not ship purchase,
      account, stock or promotional claims as nonfunctional controls.
- [x] Show a documented selection of real active products and a labeled image
      fallback using available API fields. Curated weekly highlights remain a
      future merchandising capability; no stock, polling-rate or sales claims are invented.

Acceptance: homepage loads directly and on refresh, works on mobile/desktop,
supports keyboard navigation, and provides a functional route into product browsing.
Dynamic merchandising is complete only after its data source is connected.

### 2. Catalog data, images and public browsing

- [x] Add sensor, polling rate, switch type and grip fields across migration,
      entity, DTOs, services, Angular models/forms and tests. Weight, DPI,
      connectivity, price and stock already exist.
- [x] Implement ordered product images with accessible descriptions and cover
      selection. Decide URL management versus upload/storage before promising upload.
- [x] Define public active-product/active-brand rules and out-of-stock behavior.
- [x] Add combined brand/spec/price/weight/connectivity filters, supported sorts
      and paginated results at the API level.
- [x] Build catalog cards, filter drawer, result count and shareable URL state.
- [x] Build product details/gallery with loading, missing-image, invalid-ID,
      inactive/unavailable and out-of-stock handling.
- [x] Adapt administrative list/form to manage the expanded catalog.

Acceptance: public results match the combined filters, inactive records are not
exposed as purchasable, and product detail reflects current API values.

### 3. Authentication, authorization and account ownership

- [x] Configure the `mousetrap` realm, SPA client and backend token validation.
- [x] Implement Authorization Code with PKCE, login/logout/session handling,
      HTTP authorization interceptor and role guards.
- [x] Enforce roles and customer ownership in backend services/resources.
- [x] Link authenticated identity to the local customer profile and addresses;
      add authenticated self-service contracts such as `/clientes/me` as agreed.
- [x] Deliver the unified login, public registration and password-recovery flows.
- [x] Move administrative screens into the approved `/admin/**` routing scheme.

Acceptance: anonymous visitors can browse; customers cannot administer the store
or access another customer's data; authorized admins can manage it. Frontend
guards alone do not satisfy access control. Complete before public deployment.

### 4. Cart and saved addresses

- [x] Implement cart state with Angular services/signals and local storage.
- [x] Add/remove/update quantities, badge count and BRL totals.
- [x] Revalidate current products, prices and availability; handle invalid stored
      data and changed/deleted products. A cart does not reserve stock.
- [x] Add owned address list/create/edit/delete and reuse ViaCEP validation.
- [x] Define backend freight policy and show estimates consistently.
- [x] Preserve cart and intended checkout destination through authentication.

Acceptance: cart survives refresh; address access is owner-scoped; client totals
remain estimates until validated by the order service.

### 5. Transactional checkout, orders and simulated payments

- [x] Add `Pedido`, `ItemPedido`, delivery-address snapshot, status enums,
      payment attempts and incremental migrations after contract alignment.
- [x] Calculate authoritative prices/freight/totals on the server; snapshot
      purchase details and validate address ownership and active products.
- [x] Implement atomic stock commitment, concurrency control and checkout
      idempotency. Reject insufficient stock without partial orders or deductions.
- [x] Implement simulated payment outcomes, attempt idempotency and permitted
      order/payment transitions without storing card credentials. Customer requests remain pending; approval/refusal requires admin authorization.
- [x] Expire unpaid orders periodically and restore stock exactly once on
      eligible cancellation/expiration; avoid racing payment approval.
- [x] Generate a local PIX QR Code/Copia e Cola with the confirmed total and fictitious recipient; validate card fields locally without persisting or transmitting them.
- [x] Build checkout review/result/retry flows. Clear purchased cart items only
      after confirmed order creation and preserve retries after ambiguous failures.

Acceptance: concurrent purchases of the last item cannot oversell; repeated
checkout/payment requests cannot duplicate orders or charges; historical product
and delivery data survive later catalog/address edits.

### 6. Customer portal, admin operations and wishlist

- [ ] Build owner-scoped order history, details, status timeline and tracking.
- [ ] Build admin order list/details, search/status filters and allowed shipping
      and delivery actions, including administrative payment confirmation/refusal. Use explicit business operations rather than arbitrary
      status/history overwrites.
- [ ] Calculate dashboard totals and counts from real backend data.
- [ ] Implement persisted user wishlist and its UI after confirming v1 scope.
- [ ] Complete customer-list paging/search, Material sorting and consistent
      accessible confirmation dialogs; existing deletes use `window.confirm`.
- [ ] Protect historical dependencies when deactivating/deleting records.

Acceptance: personal and administrative views reflect the same order states,
without leaking customer data or allowing invalid transitions.

### 7. Release readiness across all slices

- [x] Centralize API and identity URLs in public runtime configuration; keep credentials out of the frontend.
- [ ] Add route descriptions, OpenGraph metadata and accurate Product structured
      data; route titles and a skip link already exist.
- [ ] Verify responsive layouts, keyboard/focus behavior, contrast, accessible
      validation, image alternatives and loading announcements in a browser.
- [ ] Optimize hero/product images, reserve image dimensions and verify bundle
      budgets. Revisit Google Fonts fetching for reproducible builds.
- [ ] Add focused authorization, public filtering, address-ownership, checkout
      concurrency/idempotency, payment/expiration and end-to-end purchase tests.
- [ ] Define CI checks and deployment settings for the SPA, API, PostgreSQL,
      identity server, secrets and migrations. Backend Dockerfiles and the local identity/email Compose stack exist;
      repository CI and a complete deployment stack remain pending.
- [ ] Synchronize READMEs with actual endpoints and implemented features; remove
      stale packaging references and distinguish planned capabilities clearly.
- [ ] Validate submission exclusions when generating an academic release package.

## First implementation slice — completed

Delivered **Material brand theming + storefront layout + homepage hero** using
[01-storefront-home.svg](ui-wireframes/01-storefront-home.svg) and the existing
local `Hero.jpg`. Follow with product images and the public catalog contract so
homepage cards and product detail can use real data.

This first slice did not choose payment behavior, modify V1/V2,
or replace existing REST endpoints. Authentication and owned customer data must
be ready before checkout; the administrative APIs must be protected before public
exposure. New migrations should use the next available version at implementation
time, rather than assuming V3 will remain available throughout the roadmap.

## Audit validation

- `cd web && npm test -- --watch=false`: **15 tests passed across 6 test files**.
- All 15 local links in this document resolve to existing repository paths.
- All 12 canonical SVG wireframes parse as XML.
- `git diff --check`: passed for tracked working-tree changes.
- Backend tests, database migrations, browser interaction and production build
  were not executed for this documentation audit. Their current runtime status
  is not established by the inventory above.

## Visual foundation validation

- `cd web && npm test -- --watch=false`: **21 tests passed across 7 files**.
- `cd web && npm run build`: production build passed within all configured budgets.
- Chromium checks passed at 1440, 768, 375 and 320 px with no horizontal
  overflow: image loading, grip expansion, search/clear, mobile menu, error/retry
  and navigation to the existing administrative layout. Browser catalog responses
  were intercepted fixtures; this was not a live backend/database integration test.
- The database schema, REST contracts and dependencies were not changed.

## Second implementation slice — completed

See [Public catalog implementation](public-catalog.md). V3 adds images and
specifications without modifying V1/V2. Public routes use `/catalogo` and
`/catalogo/:id`, while existing administrative routes remain unchanged. Product
images are managed by URL with alternative text and ordering. No external image
storage, upload provider, payment behavior or authentication was introduced.

## Third implementation slice — completed

See [Authentication and account ownership](authentication.md). Realm import,
local identity/email infrastructure, S256 PKCE, token validation, admin/customer
roles, verified subject-scoped `/clientes/me`, and guarded `/admin/**` routes
are implemented. V4 leaves existing customers unclaimed; no email-based account
claiming or password storage is introduced. Multiple saved addresses remain
part of slice 4. Credentials, verification and recovery stay with the branded
identity provider forms.

## Fourth and fifth implementation slices — completed

Cart persistence, stock revalidation, configurable shipping estimates and owned saved addresses are implemented. [Transactional checkout](transactional-checkout.md) adds V6, authoritative order totals, immutable purchase snapshots, stock commitment, checkout/payment idempotency, PIX/card simulation, cancellation and scheduled expiry. Its UI follows wireframe 05 and preserves the homepage hero.

The next implementation slice is the customer portal, administrative order operations and the remaining agreed wishlist/CRUD improvements. Payment simulation is a local demonstration, with no real financial integration.
