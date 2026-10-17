# Customer Portal, Administrative Orders, and Wishlist

Slice 6 implements the next [backlog](implementation-backlog.md) stage. The customer portal follows [wireframe 06](ui-wireframes/06-storefront-customer-portal.svg); order management follows [wireframe 09](ui-wireframes/09-admin-dashboard-orders.svg). Detail screens reuse the portal timeline, order summary, approved surfaces, typography and semantic status colors. Wishlist extends the same account navigation and existing product cards. The homepage hero is unchanged.

## Customer behavior

- A shared customer layout keeps one account sidebar mounted across order history,
  order details, wishlist and account settings. Active destinations remain marked
  on desktop and in the stacked mobile navigation.
- Personal settings and delivery addresses have independent destinations:
  `/meus-dados` and `/enderecos`. The former combined account route is removed;
  neither page contains internal tabs. The shared sidebar prioritizes orders,
  personal data, addresses, wishlist and logout in that order.
- Navigation between the two account pages retains unsaved fields and preserves
  a checkout `returnUrl`. Both are authenticated routes with their own page titles.
  Their matching route reuses the profile form instance while the visible section
  follows the URL. Plain document flow avoids internal tab scrollbars.
- Personal settings contain name, read-only email and access to email/password
  management. Saved-address creation, editing, removal, principal selection and
  CEP lookup belong to the address page. Existing profiles do not repeat address
  inputs in personal settings.
- **Cancelar** in personal settings is disabled without changes and during save.
  It restores the last loaded/saved personal name locally, keeps the current page
  and leaves address drafts intact. Successful saves establish the new baseline.
- The initial profile still requires personal and address data under the existing
  API contract. Incomplete submission opens the page that needs attention; saving
  the first address completes registration and reveals the saved-address list.
- Address changes refresh the profile's retained principal fields before a personal
  save. Pending address mutations, loading and failed refreshes block profile
  submission to avoid restoring a stale principal address; failed loads retain
  the visible address list and provide retry.
- `/meus-pedidos` provides paged, newest-first orders scoped to the authenticated token subject. The first page highlights its most recent ongoing order; the other orders remain accessible through history cards and pagination.
- `/meus-pedidos/:id` shows immutable item/address snapshots, totals, the four-step progression, recorded events, payment attempts and shipping information. A different account receives 404. An administrator shopping through these customer routes has the same ownership restriction.
- New items in the cart open a fresh checkout automatically, without a manual “start another purchase” step. Previously created orders remain in history, including awaiting-payment orders. Ambiguous creation/payment attempts keep their recovery keys.
- Pending orders can be reopened through `/checkout?pedido=<id>`, including on a different browser. The API validates ownership before the browser stores a resumable order reference. Opening an existing order does not create another purchase or subtract items from the current cart. An unresolved creation/payment attempt must be recovered before switching orders.
- `/lista-de-desejos` persists favorites by identity subject in PostgreSQL. Catalog cards and product detail share an accessible heart control. Guests are directed to sign in. An inactive product/brand remains removable in the wishlist but is marked unavailable; deleted products leave the wishlist through its non-historical foreign key.
- Favorite mutations update the UI only after server confirmation, block duplicate clicks in flight and discard late responses from a different account. No credential or token is persisted by the wishlist.

The order timeline reflects persisted states and events, not invented tracking updates. Customer refresh controls fetch current data; there is no polling or external carrier integration. PIX/card behavior stays local as documented in [transactional checkout](transactional-checkout.md). Card details remain in browser memory only, and customers cannot select or submit approval/refusal outcomes.

## Administrative behavior

`/admin/pedidos` is the administrative landing route after login. It includes a status-filtered, searchable, paginated Material table with server sorting and four indicators from database queries. `/admin/pedidos/:id` resolves a cross-customer order only after the admin guard and independently enforced backend authorization.

Administrators use explicit business actions with confirmation dialogs:

| Operation               | Allowed starting state                             | Result and replay                                                                                                                                                |
| ----------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirm pending payment | Awaiting payment, pending attempt, before deadline | Payment approved and order paid atomically. Repeating the same completed outcome returns the existing result.                                                    |
| Refuse pending payment  | Awaiting payment, pending attempt, before deadline | Attempt refused; the customer may retry before expiry. This does not release stock or pretend that the order was refunded.                                       |
| Cancel unpaid order     | Awaiting payment                                   | Pending payment cancelled and stock restored once. Repeated cancellation/expiry does not restore again.                                                          |
| Confirm shipment        | Paid                                               | Required carrier and tracking code are recorded with the shipment instant; state becomes sent. Identical shipping details can be replayed without another event. |
| Confirm delivery        | Sent                                               | Delivery instant and delivered state are recorded. Replays do not duplicate events.                                                                              |

A locked order and its supplied version prevent stale decisions. Changed versions or incompatible transitions return 409 with refresh guidance. A refusal also advances the order version even though the order itself remains awaiting payment. Opposing concurrent payment decisions cannot overwrite the winner. An overdue payment decision returns the expired order and never approves a late payment. Paid/shipped/delivered orders cannot be cancelled through this unpaid-order flow; refunds remain future work.

The confirmation dialog initially focuses **Voltar**, supports Escape and restores focus to its trigger. No request is made if confirmation is dismissed.

## Indicators

- **Monthly revenue:** the sum of approved payment amounts processed during the current calendar month in `America/Sao_Paulo`, including freight. Pending, refused and cancelled attempts are excluded. The response supplies the UTC start/end instants used by the query.
- **Pending orders:** awaiting-payment orders whose payment deadline has not passed.
- **Mice in catalog:** active mice belonging to active brands, including temporarily out-of-stock products.
- **Registered customers:** all customer records. The label deliberately says registered rather than active: the domain has no customer-active flag and does not count identity-provider users as saved customer profiles.

The indicators describe the entire store, independently of the current table filters. No demonstration numbers, growth percentages or invented sales statistics are displayed.

## Additive HTTP contracts

Existing catalog, customer and checkout paths remain compatible. Legacy unpaged `GET /clientes` remains available; the frontend now uses the additive paged endpoint.

| Method and path                                             | Authorization  | Behavior                                                                                                    |
| ----------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| `GET /pedidos/me?page=0&pageSize=5`                         | Customer/admin | Owned full order snapshots, newest first.                                                                   |
| `GET /admin/pedidos`                                        | Admin          | Search `busca` by order number/customer/email, optional numeric `status`, paging and whitelisted `ordenar`. |
| `GET /admin/pedidos/indicadores`                            | Admin          | Database-backed store indicators.                                                                           |
| `GET /admin/pedidos/{id}`                                   | Admin          | `{pedido, idCliente, cliente, email}` including any customer's order.                                       |
| `POST /admin/pedidos/{id}/pagamentos/{pagamentoId}/decisao` | Admin          | `{versao, resultado:1                                                                                       | 2}` confirms/refuses that order's pending attempt. |
| `POST /admin/pedidos/{id}/envio`                            | Admin          | `{versao, transportadora, codigoRastreio}` ships a paid order.                                              |
| `POST /admin/pedidos/{id}/entrega`                          | Admin          | `{versao}` confirms delivery of a sent order.                                                               |
| `POST /admin/pedidos/{id}/cancelamento`                     | Admin          | `{versao}` cancels an unpaid order.                                                                         |
| `GET /desejos?page=0&pageSize=12`                           | Customer/admin | Owned `{produto, disponivel}` entries with pagination.                                                      |
| `GET /desejos/ids`                                          | Customer/admin | Owned saved product identifiers.                                                                            |
| `PUT /desejos/{idMouse}`                                    | Customer/admin | Idempotently save an available product; no profile/address prerequisite.                                    |
| `DELETE /desejos/{idMouse}`                                 | Customer/admin | Idempotently remove an owned favorite, including unavailable items.                                         |
| `GET /clientes/pagina`                                      | Admin          | Paged name/email search and safe name/email sorting.                                                        |
| `GET /marcas/pagina`                                        | Admin          | Paged name search and safe name/active sorting.                                                             |
| `GET /mouses/pagina`                                        | Admin          | Paged name search and safe name/price/stock/active sorting.                                                 |

Pages are zero-based with 1–100 entries; search terms are at most 150 characters. Order sorting accepts `recentes`, `antigos`, `cliente`, `cliente-desc`, `status`, `status-desc`. Customer sorting accepts `nome`, `nome-desc`, `email`, `email-desc`. Catalog sorting uses `nome`, `ativo` and, for mice, `preco` and `quantidadeEstoque`, each with an optional `-desc`. Every ordering adds an ID tie-breaker. Unknown sort fields are rejected rather than interpolated into SQL.

Owned order responses gain additive `versao`, `transportadora`, `codigoRastreio`, `enviadoEm`, `entregueEm`, and `eventos` fields. Each event exposes only `{status, ocorridoEm, descricao}`; the internal actor subject is not exposed. No generic state/history edit endpoint is introduced. The older administrator-only owned simulation endpoint remains compatible; new administrative screens use the explicit cross-customer decision endpoint.

## Database and historical integrity

`V7__portal_pedidos_e_desejos.sql` adds four nullable tracking fields to `pedido`, the append-only `evento_pedido` history and the identity-scoped `desejo` table. V1–V6 are unchanged. Existing orders receive one migration-time event describing their observed state; past transition dates are not reconstructed or invented. New orders record creation, payment decisions, cancellation/expiry, shipment and delivery as they occur.

Order creation read-locks the customer before its address, serializing it with customer deletion. Product deletion locks the mouse and checks historical order lines. Customers/products with order dependencies cannot be deleted and return a meaningful validation error; catalog deactivation remains available and does not change stored purchase snapshots. Brand deletion still rejects linked mice. Foreign keys retain the final historical protection, and there is no order/history deletion API.

Wishlist rows have a unique `(identidade_subject, mouse_id)` pair. Transaction-scoped PostgreSQL advisory locks serialize additions per identity and enforce the 500-product limit across instances. The wishlist's mouse foreign key may cascade when a non-historical product is deleted; order/item/event foreign keys do not cascade.

No dependencies, payment provider, carrier integration, secret, active `application.properties` or identity-realm configuration were added. Existing runtime API/identity settings are reused. Administrative routes and their resolvers are loaded on navigation, keeping administrative Material dependencies out of the initial storefront bundle.

## Validation

Executed checks:

- `cd api && ./mvnw package`: **46 tests passed**, zero failures/errors/skips. PostgreSQL 16 ran Flyway V1–V7 and Hibernate schema validation. Added coverage includes owner-only paging, cross-customer administration, forbidden customer/admin boundaries, version conflicts, refusal/retry, shipment/delivery replay, concurrent opposing decisions, database indicators, historical deletion protection and concurrent/account-scoped wishlist persistence.
- `cd web && npm test -- --watch=false`: **97 tests passed across 23 files**, including asynchronous confirmation/cancellation, conflict feedback, history/tracking/pagination, wishlist persistence failure and account switches, resuming a historical order without mutating the current cart, and opening successive purchases without a manual reset while preserving unresolved request keys.
- `cd web && npm run build`: passed without warnings; initial bundle **343.55 kB** with the original 500 kB warning budget. Loading administrative routes/resolvers on navigation removes their Material dependencies from the initial storefront bundle.
- Chromium with **real Keycloak customer/admin logins** and the production SPA/API on isolated PostgreSQL: **59 checks**, including **45 layout checks** across nine screens/states at 1440, 1024, 768, 375 and 320 px. The flow covered persisted wishlist and refresh, pending PIX, admin refusal, customer card retry from the portal, approval, shipment, delivery, indicator updates, historical product deletion denial and customer denial of administrative access. Card fields never appeared in API payloads; no browser runtime errors occurred. Confirmation focused the non-destructive action and Escape did not mutate the order.
- Prettier and `git diff --check`: passed. V1–V6 and the homepage hero remain unchanged.

Browser accounts, permissions, fixtures and owned preview processes were cleaned up after verification. The developer database was not used for end-to-end fixtures. The final compact history presentation follows the wireframe card while keeping full address/event/payment details on the detail route; frontend tests/build were repeated after that presentation refinement.

## Account navigation follow-up validation

- Frontend unit and routing suite: **117 tests passed across 24 files**. Coverage
  includes protected pages, removal of the combined account route, persistent
  sidebar, navigation priority, initial registration, retained drafts, checkout
  return paths, principal-address synchronization, failed-refresh recovery, cancel
  state, first-name truncation and combined catalog search.
- Production frontend build passed within configured budgets.
- Chromium preview with **mocked authentication and HTTP responses**: **29 checks**,
  including **20 viewport/page combinations** for existing and new profiles at
  1440, 1024, 768, 375 and 320 px, plus five catalog-search layouts and **6 Axe audits**. Both account pages had no
  horizontal overflow or redundant internal scrolling. Address edits, personal
  saves, keyboard navigation and shared sidebar persistence passed without browser
  runtime errors. The named account dropdown, conditional cancellation, search
  shortcut, draft-text clearing and filter preservation also passed.
- Backend and the complete Docker/Keycloak purchase suite were not rerun for this
  frontend correction. Their historical results above remain separate.

## Remaining limits

The local payment engine still requires explicit enablement outside development/tests. Real payments, refunds, live carrier events, notifications, category scope and broader merchandising remain separate work. The remaining seventh backlog slice covers release readiness, deployment/CI, metadata, dependency advisories and cross-screen accessibility/performance review. No permanent administrative user was created or elevated by this feature; existing Keycloak role-management instructions still apply.

## Changed file inventory

### Documentation

- [`README.md`](../README.md)
- [`api/README.md`](../api/README.md)
- [`api/docs/modelagem/README.md`](../api/docs/modelagem/README.md)
- [`docs/authentication.md`](../docs/authentication.md)
- [`docs/customer-portal-admin-orders.md`](../docs/customer-portal-admin-orders.md)
- [`docs/implementation-backlog.md`](../docs/implementation-backlog.md)
- [`docs/transactional-checkout.md`](../docs/transactional-checkout.md)
- [`docs/visual-alignment.md`](../docs/visual-alignment.md)

### Database

- [`api/src/main/resources/db/migration/V7__portal_pedidos_e_desejos.sql`](../api/src/main/resources/db/migration/V7__portal_pedidos_e_desejos.sql)

### Backend

- [`api/src/main/java/br/unitins/tp2/model/Desejo.java`](../api/src/main/java/br/unitins/tp2/model/Desejo.java)
- [`api/src/main/java/br/unitins/tp2/model/EventoPedido.java`](../api/src/main/java/br/unitins/tp2/model/EventoPedido.java)
- [`api/src/main/java/br/unitins/tp2/model/Pedido.java`](../api/src/main/java/br/unitins/tp2/model/Pedido.java)
- [`api/src/main/java/br/unitins/tp2/repository/DesejoRepository.java`](../api/src/main/java/br/unitins/tp2/repository/DesejoRepository.java)
- [`api/src/main/java/br/unitins/tp2/resource/ClienteResource.java`](../api/src/main/java/br/unitins/tp2/resource/ClienteResource.java)
- [`api/src/main/java/br/unitins/tp2/resource/DesejoResource.java`](../api/src/main/java/br/unitins/tp2/resource/DesejoResource.java)
- [`api/src/main/java/br/unitins/tp2/resource/MarcaResource.java`](../api/src/main/java/br/unitins/tp2/resource/MarcaResource.java)
- [`api/src/main/java/br/unitins/tp2/resource/MouseResource.java`](../api/src/main/java/br/unitins/tp2/resource/MouseResource.java)
- [`api/src/main/java/br/unitins/tp2/resource/PedidoAdminResource.java`](../api/src/main/java/br/unitins/tp2/resource/PedidoAdminResource.java)
- [`api/src/main/java/br/unitins/tp2/resource/PedidoResource.java`](../api/src/main/java/br/unitins/tp2/resource/PedidoResource.java)
- [`api/src/main/java/br/unitins/tp2/service/ClienteService.java`](../api/src/main/java/br/unitins/tp2/service/ClienteService.java)
- [`api/src/main/java/br/unitins/tp2/service/ClienteServiceImpl.java`](../api/src/main/java/br/unitins/tp2/service/ClienteServiceImpl.java)
- [`api/src/main/java/br/unitins/tp2/service/DesejoService.java`](../api/src/main/java/br/unitins/tp2/service/DesejoService.java)
- [`api/src/main/java/br/unitins/tp2/service/DesejoServiceImpl.java`](../api/src/main/java/br/unitins/tp2/service/DesejoServiceImpl.java)
- [`api/src/main/java/br/unitins/tp2/service/MarcaService.java`](../api/src/main/java/br/unitins/tp2/service/MarcaService.java)
- [`api/src/main/java/br/unitins/tp2/service/MarcaServiceImpl.java`](../api/src/main/java/br/unitins/tp2/service/MarcaServiceImpl.java)
- [`api/src/main/java/br/unitins/tp2/service/MouseService.java`](../api/src/main/java/br/unitins/tp2/service/MouseService.java)
- [`api/src/main/java/br/unitins/tp2/service/MouseServiceImpl.java`](../api/src/main/java/br/unitins/tp2/service/MouseServiceImpl.java)
- [`api/src/main/java/br/unitins/tp2/service/PedidoService.java`](../api/src/main/java/br/unitins/tp2/service/PedidoService.java)
- [`api/src/main/java/br/unitins/tp2/service/PedidoServiceImpl.java`](../api/src/main/java/br/unitins/tp2/service/PedidoServiceImpl.java)

### Contracts

- [`api/src/main/java/br/unitins/tp2/dto/DecisaoPagamentoDTO.java`](../api/src/main/java/br/unitins/tp2/dto/DecisaoPagamentoDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/DesejoResponseDTO.java`](../api/src/main/java/br/unitins/tp2/dto/DesejoResponseDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/EnvioPedidoDTO.java`](../api/src/main/java/br/unitins/tp2/dto/EnvioPedidoDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/EventoPedidoResponseDTO.java`](../api/src/main/java/br/unitins/tp2/dto/EventoPedidoResponseDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/IndicadoresPedidoResponseDTO.java`](../api/src/main/java/br/unitins/tp2/dto/IndicadoresPedidoResponseDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/OperacaoPedidoDTO.java`](../api/src/main/java/br/unitins/tp2/dto/OperacaoPedidoDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/PedidoAdminResponseDTO.java`](../api/src/main/java/br/unitins/tp2/dto/PedidoAdminResponseDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/PedidoResponseDTO.java`](../api/src/main/java/br/unitins/tp2/dto/PedidoResponseDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/PedidoResumoResponseDTO.java`](../api/src/main/java/br/unitins/tp2/dto/PedidoResumoResponseDTO.java)
- [`web/src/app/models/catalogo.model.ts`](../web/src/app/models/catalogo.model.ts)
- [`web/src/app/models/pedido.model.ts`](../web/src/app/models/pedido.model.ts)

### Frontend

- [`web/src/app/app.routes.ts`](../web/src/app/app.routes.ts)
- [`web/src/app/components/clientes/cliente-list/cliente-list.css`](../web/src/app/components/clientes/cliente-list/cliente-list.css)
- [`web/src/app/components/clientes/cliente-list/cliente-list.html`](../web/src/app/components/clientes/cliente-list/cliente-list.html)
- [`web/src/app/components/clientes/cliente-list/cliente-list.ts`](../web/src/app/components/clientes/cliente-list/cliente-list.ts)
- [`web/src/app/components/marcas/marca-list/marca-list.html`](../web/src/app/components/marcas/marca-list/marca-list.html)
- [`web/src/app/components/marcas/marca-list/marca-list.ts`](../web/src/app/components/marcas/marca-list/marca-list.ts)
- [`web/src/app/components/mouses/mouse-list/mouse-list.html`](../web/src/app/components/mouses/mouse-list/mouse-list.html)
- [`web/src/app/components/mouses/mouse-list/mouse-list.ts`](../web/src/app/components/mouses/mouse-list/mouse-list.ts)
- [`web/src/app/components/pedidos/admin-order.css`](../web/src/app/components/pedidos/admin-order.css)
- [`web/src/app/components/pedidos/admin-order.html`](../web/src/app/components/pedidos/admin-order.html)
- [`web/src/app/components/pedidos/admin-order.ts`](../web/src/app/components/pedidos/admin-order.ts)
- [`web/src/app/components/pedidos/admin-orders.css`](../web/src/app/components/pedidos/admin-orders.css)
- [`web/src/app/components/pedidos/admin-orders.html`](../web/src/app/components/pedidos/admin-orders.html)
- [`web/src/app/components/pedidos/admin-orders.ts`](../web/src/app/components/pedidos/admin-orders.ts)
- [`web/src/app/components/shared/confirm-dialog.ts`](../web/src/app/components/shared/confirm-dialog.ts)
- [`web/src/app/components/shared/order-details/order-details.css`](../web/src/app/components/shared/order-details/order-details.css)
- [`web/src/app/components/shared/order-details/order-details.html`](../web/src/app/components/shared/order-details/order-details.html)
- [`web/src/app/components/shared/order-details/order-details.ts`](../web/src/app/components/shared/order-details/order-details.ts)
- [`web/src/app/components/storefront/checkout/checkout.html`](../web/src/app/components/storefront/checkout/checkout.html)
- [`web/src/app/components/storefront/checkout/checkout.ts`](../web/src/app/components/storefront/checkout/checkout.ts)
- [`web/src/app/components/storefront/customer-portal/account-nav.ts`](../web/src/app/components/storefront/customer-portal/account-nav.ts)
- [`web/src/app/components/storefront/customer-portal/customer-order.ts`](../web/src/app/components/storefront/customer-portal/customer-order.ts)
- [`web/src/app/components/storefront/customer-portal/customer-portal.css`](../web/src/app/components/storefront/customer-portal/customer-portal.css)
- [`web/src/app/components/storefront/customer-portal/order-history.html`](../web/src/app/components/storefront/customer-portal/order-history.html)
- [`web/src/app/components/storefront/customer-portal/order-history.ts`](../web/src/app/components/storefront/customer-portal/order-history.ts)
- [`web/src/app/components/storefront/customer-portal/wishlist.css`](../web/src/app/components/storefront/customer-portal/wishlist.css)
- [`web/src/app/components/storefront/customer-portal/wishlist.ts`](../web/src/app/components/storefront/customer-portal/wishlist.ts)
- [`web/src/app/components/storefront/favorite-button/favorite-button.ts`](../web/src/app/components/storefront/favorite-button/favorite-button.ts)
- [`web/src/app/components/storefront/product-card/product-card.css`](../web/src/app/components/storefront/product-card/product-card.css)
- [`web/src/app/components/storefront/product-card/product-card.html`](../web/src/app/components/storefront/product-card/product-card.html)
- [`web/src/app/components/storefront/product-card/product-card.ts`](../web/src/app/components/storefront/product-card/product-card.ts)
- [`web/src/app/components/storefront/product-detail/product-detail.html`](../web/src/app/components/storefront/product-detail/product-detail.html)
- [`web/src/app/components/storefront/product-detail/product-detail.ts`](../web/src/app/components/storefront/product-detail/product-detail.ts)
- [`web/src/app/layouts/admin-layout/admin-layout.html`](../web/src/app/layouts/admin-layout/admin-layout.html)
- [`web/src/app/layouts/storefront-layout/storefront-layout.html`](../web/src/app/layouts/storefront-layout/storefront-layout.html)
- [`web/src/app/resolvers/admin.routes.ts`](../web/src/app/resolvers/admin.routes.ts)
- [`web/src/app/resolvers/pedido.resolver.ts`](../web/src/app/resolvers/pedido.resolver.ts)
- [`web/src/app/resolvers/pedido.routes.ts`](../web/src/app/resolvers/pedido.routes.ts)
- [`web/src/app/services/auth.service.ts`](../web/src/app/services/auth.service.ts)
- [`web/src/app/services/checkout.service.ts`](../web/src/app/services/checkout.service.ts)
- [`web/src/app/services/cliente.service.ts`](../web/src/app/services/cliente.service.ts)
- [`web/src/app/services/desejo.service.ts`](../web/src/app/services/desejo.service.ts)
- [`web/src/app/services/marca.service.ts`](../web/src/app/services/marca.service.ts)
- [`web/src/app/services/mouse.service.ts`](../web/src/app/services/mouse.service.ts)
- [`web/src/app/services/pedido.service.ts`](../web/src/app/services/pedido.service.ts)

### Tests

- [`web/src/app/components/storefront/checkout/checkout.spec.ts`](../web/src/app/components/storefront/checkout/checkout.spec.ts)
- [`api/src/test/java/br/unitins/tp2/resource/AutorizacaoResourceTest.java`](../api/src/test/java/br/unitins/tp2/resource/AutorizacaoResourceTest.java)
- [`api/src/test/java/br/unitins/tp2/resource/PedidoResourceTest.java`](../api/src/test/java/br/unitins/tp2/resource/PedidoResourceTest.java)
- [`web/src/app/components/marcas/marca-list/marca-list.spec.ts`](../web/src/app/components/marcas/marca-list/marca-list.spec.ts)
- [`web/src/app/components/pedidos/admin-order.spec.ts`](../web/src/app/components/pedidos/admin-order.spec.ts)
- [`web/src/app/components/storefront/customer-portal/order-history.spec.ts`](../web/src/app/components/storefront/customer-portal/order-history.spec.ts)
- [`web/src/app/services/auth.service.spec.ts`](../web/src/app/services/auth.service.spec.ts)
- [`web/src/app/services/checkout.service.spec.ts`](../web/src/app/services/checkout.service.spec.ts)
- [`web/src/app/services/desejo.service.spec.ts`](../web/src/app/services/desejo.service.spec.ts)
- [`web/src/testing/pedido.fixture.ts`](../web/src/testing/pedido.fixture.ts)
