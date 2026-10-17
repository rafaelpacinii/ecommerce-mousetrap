# MouseTrap Implementation Backlog

Repository audit: **2026-10-16**. This backlog compares the implementation with
`AGENTS.md`, the UI wireframes, and the domain planning documents. An item marked
implemented was found in source code; this does not establish production readiness
or replace running its tests. Priorities and implementation slices below are
proposals, not changes to existing HTTP contracts.

## Current baseline

| Area | Evidence | Current implementation |
| --- | --- | --- |
| Catalog API | [Resources](../api/src/main/java/br/unitins/tp2/resource/), [Mouse service](../api/src/main/java/br/unitins/tp2/service/MouseServiceImpl.java) | Brand and mouse CRUD, input validation, SKU/name uniqueness, paging/name search, prices, stock, active flags, and optimistic locking on mouse edits. |
| Customer API | [Customer service](../api/src/main/java/br/unitins/tp2/service/ClienteServiceImpl.java), [CEP service](../api/src/main/java/br/unitins/tp2/service/CepServiceImpl.java) | Customer CRUD, one address stored on each customer, shared municipalities/states, ViaCEP lookup and server-side address validation. |
| Database | [Migrations](../api/src/main/resources/db/migration/) | V1: catalog; V2: customers, municipalities, states. No orders, payments, identity links, image gallery, or wishlists. |
| Administrative UI | [Routes](../web/src/app/app.routes.ts), [components](../web/src/app/components/) | Nine CRUD routes for brands, mice, and customers; standalone Material components, reactive forms and edit resolvers. Brand/mouse lists have paging and name filters; customer list is unpaged. |
| Branding | [Public assets](../web/public/), [global styles](../web/src/styles.css) | SVG/PNG/ICO icons, manifest, brand color variables. `Hero.jpg` is retained as source; the homepage uses responsive WebP exports. |
| Theme and layout | [Material theme](../web/src/material-theme.scss), [application template](../web/src/app/app.html) | Brand colors are mapped to Material M3. Storefront and legacy administrative layouts are separate; the future admin sidebar remains pending. |
| Tests | [Backend tests](../api/src/test/), frontend `*.spec.ts` files | Existing catalog/customer/CEP tests, frontend form/list/resolver tests, and homepage/legacy-route regression coverage. No purchase-flow suite exists yet. |

The `/` route now renders the storefront homepage; unknown routes redirect to it.
Legacy CRUD routes remain unchanged under their own layout. The visible storefront
header/footer and administrative header use the SVG brand mark. See
[Homepage implementation](homepage.md) for the completed first slice and its limits.

## Screen coverage

Source of visual requirements: [wireframe index](ui-wireframes/README.md).
There are **12 SVGs: one design-system sheet and 11 screen wireframes**.

| Reference | Status | Remaining work |
| --- | --- | --- |
| 00 — Design system | Foundation implemented | Brand colors mapped to Material M3, reusable surface/radius/button tokens, typography and numerical alignment. Continue applying them to future screens. |
| 01 — Homepage `/` | Foundation implemented | Responsive hero/header/footer, grip guide and searchable real-product preview are implemented. Curated weekly highlights, product photos and account/cart navigation depend on subsequent slices. |
| 02 — Catalog `/mouses` | Homepage preview only | Reusable cards and name search exist on the homepage. Full catalog facets, sorting, paging, URL filter state and mobile filters remain pending. Current `/mouses` stays an administrative table. |
| 03 — Product `/mouses/:id` | Missing | Gallery, specs, price, availability, quantity/add-to-cart, delivery estimate and unavailable-product states. |
| 04 — Cart `/carrinho` | Missing | Local persistence, quantities, removal, totals, delivery estimate, empty and stale-product states. |
| 05 — Checkout `/checkout` | Missing | Authenticated address selection, purchase review, payment selection, transactional order placement and result handling. |
| 06 — Customer portal `/meus-pedidos` | Missing | Personal orders and status timeline, details/tracking, account/logout, saved addresses and wishlist views. |
| 07 — Login `/login` | Missing | Unified login entry, recovery flow, role-aware return navigation and session handling. |
| 08 — Registration `/cadastro` | Partial foundation | Reuse validated customer/CEP behavior; add public identity registration, identity/profile link and saved address flow. Current customer form is administrative and has no credentials. |
| 09 — Admin orders `/admin/pedidos` | Missing | Admin shell/sidebar, real order metrics, filtered/paged order table, details and allowed status transitions. |
| 10 — Admin catalog `/admin/mouses` | Partial | Adapt existing table to the wireframe, integrate images/specs and add sorting; introduce the admin route namespace with a compatibility plan. |
| 11 — Admin product form | Partial | Reuse validated form/version handling; add images, sensor, polling rate, grip and switch fields as their contracts become available. |

Brand and customer CRUD also need integration into the admin shell, even though
they do not have dedicated screen wireframes. Separate wireframes are still
needed for customer address/wishlist management and any additional category or
order-detail screens selected for implementation.

## Scope and contract alignment

Resolve these decisions before implementing the dependent backend features;
they do not block starting the theme, shared layout, and homepage structure.

| Topic | Conflicting or incomplete evidence | Proposed direction / required decision |
| --- | --- | --- |
| Identity | Master instructions specify Keycloak; [domain plan](../api/docs/modelagem/README.md) describes local credentials on `Usuario`. The actual code only has `Cliente`, without authentication. | Follow the master Keycloak requirement. Design the local customer/profile link to the token subject; avoid a second password store. Define registration/profile-provisioning and recovery behavior. |
| Roles | Master uses `admin`/`customer`; UI documents use `ADMIN`/`CLIENTE`; domain plan uses `ADMINISTRADOR`. | Use canonical Keycloak role names and an explicit mapping. Define whether an administrator can also shop. |
| Frontend routes | Current CRUD occupies `/mouses`, `/marcas`, and `/clientes`; wireframes need public product browsing and `/admin/**`. | Add separate layouts and an admin namespace. Review existing navigation, resolvers and deep links before replacing routes. |
| Public catalog contract | Existing reads return administrative records, including inactive products; paging/name search are the only query capabilities. | Define an additive public read contract with active-brand/product rules, combined filters, safe sorting and image/spec projections. Preserve existing admin clients. |
| CEP route | Actual API/client use `/ceps/{cep}`; master/root documentation mention `/cep/**`. | Document the implemented plural path; do not rename it silently. |
| Customer/address model | V2 stores one address directly on `Cliente`; the purchase plan expects reusable, owned `Endereco` records. | Add owned addresses and a migration/backfill strategy preserving current customers and contracts. |
| Categories | Master roadmap includes categories; domain MVP explicitly defers them. | Confirm whether categories belong to v1 before adding entity, migration, API and screens. |
| Payments/freight | Domain MVP specifies simulated payments and configurable freight; wireframes show installments, PIX QR code and delivery promises. | Confirm the demonstration scope and simulation behavior before selecting a provider/mock. Do not promise live payment approval or delivery dates without implementation. |
| Order states | Master lists five English states; domain plan adds expiration and Portuguese enum names. | Agree on canonical API values, labels, transitions and expiration before persisting order status. |
| Merchandising | Wireframes show weekly highlights and “best selling” sorting; neither data source exists. | Define explicit featured-product selection. Only implement best-selling order when supported by actual sales data. |

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

- [ ] Add sensor, polling rate, switch type and grip fields across migration,
  entity, DTOs, services, Angular models/forms and tests. Weight, DPI,
  connectivity, price and stock already exist.
- [ ] Implement ordered product images with accessible descriptions and cover
  selection. Decide URL management versus upload/storage before promising upload.
- [ ] Define public active-product/active-brand rules and out-of-stock behavior.
- [ ] Add combined brand/spec/price/weight/connectivity filters, supported sorts
  and paginated results at the API level.
- [ ] Build catalog cards, filter drawer, result count and shareable URL state.
- [ ] Build product details/gallery with loading, missing-image, invalid-ID,
  inactive/unavailable and out-of-stock handling.
- [ ] Adapt administrative list/form to manage the expanded catalog.

Acceptance: public results match the combined filters, inactive records are not
exposed as purchasable, and product detail reflects current API values.

### 3. Authentication, authorization and account ownership

- [ ] Configure the `mousetrap` realm, SPA client and backend token validation.
- [ ] Implement Authorization Code with PKCE, login/logout/session handling,
  HTTP authorization interceptor and role guards.
- [ ] Enforce roles and customer ownership in backend services/resources.
- [ ] Link authenticated identity to the local customer profile and addresses;
  add authenticated self-service contracts such as `/clientes/me` as agreed.
- [ ] Deliver the unified login, public registration and password-recovery flows.
- [ ] Move administrative screens into the approved `/admin/**` routing scheme.

Acceptance: anonymous visitors can browse; customers cannot administer the store
or access another customer's data; authorized admins can manage it. Frontend
guards alone do not satisfy access control. Complete before public deployment.

### 4. Cart and saved addresses

- [ ] Implement cart state with Angular services/signals and local storage.
- [ ] Add/remove/update quantities, badge count and BRL totals.
- [ ] Revalidate current products, prices and availability; handle invalid stored
  data and changed/deleted products. A cart does not reserve stock.
- [ ] Add owned address list/create/edit/delete and reuse ViaCEP validation.
- [ ] Define backend freight policy and show estimates consistently.
- [ ] Preserve cart and intended checkout destination through authentication.

Acceptance: cart survives refresh; address access is owner-scoped; client totals
remain estimates until validated by the order service.

### 5. Transactional checkout, orders and simulated payments

- [ ] Add `Pedido`, `ItemPedido`, delivery-address snapshot, status enums,
  payment attempts and incremental migrations after contract alignment.
- [ ] Calculate authoritative prices/freight/totals on the server; snapshot
  purchase details and validate address ownership and active products.
- [ ] Implement atomic stock commitment, concurrency control and checkout
  idempotency. Reject insufficient stock without partial orders or deductions.
- [ ] Implement simulated payment outcomes, attempt idempotency and permitted
  order/payment transitions without storing card credentials.
- [ ] Expire unpaid orders periodically and restore stock exactly once on
  eligible cancellation/expiration; avoid racing payment approval.
- [ ] Build checkout review/result/retry flows. Clear purchased cart items only
  after confirmed order creation and preserve retries after ambiguous failures.

Acceptance: concurrent purchases of the last item cannot oversell; repeated
checkout/payment requests cannot duplicate orders or charges; historical product
and delivery data survive later catalog/address edits.

### 6. Customer portal, admin operations and wishlist

- [ ] Build owner-scoped order history, details, status timeline and tracking.
- [ ] Build admin order list/details, search/status filters and allowed shipping
  and delivery actions. Use explicit business operations rather than arbitrary
  status/history overwrites.
- [ ] Calculate dashboard totals and counts from real backend data.
- [ ] Implement persisted user wishlist and its UI after confirming v1 scope.
- [ ] Complete customer-list paging/search, Material sorting and consistent
  accessible confirmation dialogs; existing deletes use `window.confirm`.
- [ ] Protect historical dependencies when deactivating/deleting records.

Acceptance: personal and administrative views reflect the same order states,
without leaking customer data or allowing invalid transitions.

### 7. Release readiness across all slices

- [ ] Centralize the API base URL; existing frontend services hardcode localhost.
- [ ] Add route descriptions, OpenGraph metadata and accurate Product structured
  data; route titles and a skip link already exist.
- [ ] Verify responsive layouts, keyboard/focus behavior, contrast, accessible
  validation, image alternatives and loading announcements in a browser.
- [ ] Optimize hero/product images, reserve image dimensions and verify bundle
  budgets. Revisit Google Fonts fetching for reproducible builds.
- [ ] Add focused authorization, public filtering, address-ownership, checkout
  concurrency/idempotency, payment/expiration and end-to-end purchase tests.
- [ ] Define CI checks and deployment settings for the SPA, API, PostgreSQL,
  identity server, secrets and migrations. Backend Dockerfiles exist; no
  repository CI workflow or Compose stack was found in this audit.
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
