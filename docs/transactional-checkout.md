# Transactional Checkout, Orders, and Simulated Payments

Slice 5 adds an authenticated purchase flow based on [wireframe 05](ui-wireframes/05-storefront-checkout.svg), the [established visual system](visual-alignment.md), and the existing domain model. The homepage hero is unchanged. Customer order history and administrative order operations belong to slice 6.

## Delivered behavior

1. Select an owned delivery address and PIX or credit card. Customer-facing checkout copy contains no simulation labels or outcome controls. Card number (13–19 digits, with optional spaces/hyphens), printed holder name, non-expired month/year and 3–4 digit CVV are validated locally. The flow does not check card existence or require a Luhn checksum. Card fields never enter HTTP payloads, storage, logs or order snapshots and are cleared before submission. No CPF or installment promise is added.
2. Review current product prices, stock, shipping, and total from the server. A changed price is visibly reported. Confirmation sends expected unit prices/freight only as comparison values; they never determine the amount charged.
3. Create an awaiting-payment order and commit available stock atomically. The order copies product SKU/name/brand/color/unit prices and the full delivery address.
4. Submit a pending payment request. Customers cannot choose approval/refusal or resolve pending attempts, including by calling the API directly. Only an authenticated administrator can request those outcomes; the existing simulation endpoint retains its order-ownership restriction. Cross-customer administrative list/details and explicit order operations remain slice 6. A refused attempt permits another payment method before expiry.
5. Recover a purchase after refresh or an ambiguous network failure using the same owner-scoped, persisted checkout/payment request keys. Only confirmed creation removes purchased quantities from the cart. A cart receipt stored together with its remaining items prevents repeated successful responses from subtracting again.
6. Display a locally generated, scannable PIX QR Code and matching Copia e Cola payload using the confirmed server total (including freight), order reference, BRL currency and CRC16. The hard-coded reserved `.invalid` recipient key prevents real transfers. Copying the code never changes payment/order status.
7. Cancel an unpaid order or let it expire. Either operation cancels a pending payment and restores available quantities once. Paid orders cannot be cancelled without a future refund workflow.

The checkout result remains at `/checkout` and can be recovered from this browser. This is not a replacement for the future cross-device order-history portal. The last purchase remains available until the user explicitly starts another purchase.

## Additive HTTP contracts

Endpoints require `customer` or `admin`, except pending-payment resolution, which requires `admin`. Each order/address lookup is scoped to the authenticated token subject. Administrators buying through these endpoints have the same ownership restrictions as customers.

| Method and path                                       | Behavior                                                                                                                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /pedidos/configuracao`                           | Simulation availability and payment window in minutes.                                                                                                                  |
| `POST /pedidos/revisao`                               | Authoritative review for `{idEndereco, itens:[{idMouse, quantidade}]}`; no stock reservation.                                                                           |
| `POST /pedidos`                                       | Create/replay `{chaveCheckout, idEndereco, itens:[{idMouse, quantidade, precoEsperado}], freteEsperado}`. UUID key; 201 with Location and the same order ID on replay.  |
| `GET /pedidos/{id}`                                   | Owned order snapshot, amounts, states, and attempts; expires a due unpaid order before returning it.                                                                    |
| `POST /pedidos/{id}/pagamentos`                       | Create/replay `{chaveIdempotencia, forma, resultadoSimulado}`; customers must send `resultadoSimulado:3` (pending); approval/refusal require `admin`.                   |
| `POST /pedidos/{id}/pagamentos/{pagamentoId}/simular` | Administrator only: resolve an owned pending simulation with `{resultado:1}` (approve) or `{resultado:2}` (refuse). Repeating the same completed outcome is idempotent. |
| `POST /pedidos/{id}/cancelamento`                     | Cancel an unpaid order. Repeating cancellation/expiry does not restore stock again.                                                                                     |

Unauthorized customer outcomes/resolution return 403 before payment mutation. Validation errors use RFC 7807. Creation/payment with simulation disabled returns 400 with the `checkout` field; this check runs before any purchase mutation. Price/freight/stock changes, incompatible idempotency-key reuse, and invalid transitions return 409. Missing or unowned orders/addresses return 404 without disclosing their data. An expired payment request returns the current expired order; it does not create an attempt or charge anything.

Checkout accepts 1–100 distinct products with 1–999 units each. Confirmation requires current expected unit prices and freight. Reordering the same line set does not change request identity. Replay compares a canonical request fingerprint before reading the mutable address/catalog, so a successfully created purchase remains recoverable after those records change.

## States and stable IDs

These IDs follow the existing domain plan; enums expose `{id,label}` and use JPA converters rather than ordinal persistence.

| Domain               | IDs                                                                             |
| -------------------- | ------------------------------------------------------------------------------- |
| `StatusPedido`       | 1 AGUARDANDO_PAGAMENTO; 2 PAGO; 3 ENVIADO; 4 ENTREGUE; 5 CANCELADO; 6 EXPIRADO. |
| `FormaPagamento`     | 1 PIX; 2 CARTAO.                                                                |
| `StatusPagamento`    | 1 PENDENTE; 2 APROVADO; 3 RECUSADO; 4 CANCELADO.                                |
| `ResultadoSimulacao` | 1 APROVAR; 2 RECUSAR; 3 PENDENTE.                                               |

Shipping/delivery transitions are deliberately unavailable in slice 5. No generic status-update or historical-data-edit endpoint exists.

## Transaction and database guarantees

- V6 adds `pedido`, `item_pedido`, and `pagamento`; V1–V5 remain unchanged. Order deadlines and payment processing timestamps use `Instant`/PostgreSQL `timestamptz`; existing inherited audit timestamps retain their previous representation. Monetary calculations use `BigDecimal`.
- Transaction-scoped [PostgreSQL advisory locks](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS) serialize a UUID request key across application instances. Database unique keys remain a second line of defense. Reuse by another account or for a different payload is rejected.
- Checkout locks product rows in increasing ID order, then locks their brands for reading, checks active flags, prices, and stock, and validates all lines before decrementing any quantity. A failed transaction leaves no partial order or stock deduction.
- Payment, cancellation, and expiry lock the owned order first. Pending payment rows and stock restoration use the same order, with product locks sorted by ID. A partial unique index permits at most one pending/approved payment per order. Approval and the PAGO transition commit together; stock is not deducted again.
- A [Quarkus scheduled job](https://quarkus.io/guides/scheduler-reference/) processes up to 100 expired candidates per tick. Every candidate has its own transaction and rechecks state/deadline under its order lock. Multiple application instances may run the job safely because database row locks guard each transition.
- Order/customer/product dependencies use restrictive foreign keys. Historical orders, lines, and attempts have no cascading delete path. Delivery snapshots have no foreign key to the editable address.

## Configuration

The safe example file and `META-INF/microprofile-config.properties` define:

```properties
pagamentos.simulacao.habilitada=false
%dev.pagamentos.simulacao.habilitada=true
%test.pagamentos.simulacao.habilitada=true
pedidos.prazo-pagamento-minutos=30
pedidos.expiracao.intervalo=30s
```

Simulation is enabled automatically only in development/tests. A demonstration deployment must explicitly opt in. Without it, the checkout UI displays an unavailable state and creation/payment operations are disabled by the backend. Existing order reads, cancellation, and expiry remain available.

The active, ignored `application.properties` is not edited. Existing configured shipping policy and ViaCEP validation are reused. A ViaCEP failure prevents review/creation; no partial purchase is committed. Expiry never depends on ViaCEP.

## Browser persistence and limits

Purchase drafts are stored under `mousetrap.checkout.<subject>`, without tokens or credentials. A request is saved before it is submitted; blocked storage prevents starting a purchase that could not be recovered reliably. Authentication changes cannot expose another account's draft. A rejected request can be revised; a failed network response keeps its key and payload for replay.

Legacy cart arrays remain readable. Once an order is confirmed, the same cart storage entry also holds a bounded list of purchase receipts, alongside its remaining items. Newly added quantities are preserved when the purchased quantity is removed. This remains browser-local cart persistence, with no cross-device synchronization.

Real payment providers, payment notifications/webhooks, refunds, physical fulfillment, customer history, and administrative order screens remain outside this slice. The local payment engine is not a payment-provider integration. There are no customer simulation controls. Administrative cross-customer status management remains deferred to slice 6, so newly submitted customer payments stay pending until an authorized operation or expiry/cancellation.

## PIX implementation references

The payload follows the static BR Code TLV layout, amount field `54`, reference `62.05` and CRC16/CCITT-FALSE (including `6304`) documented in the [Banco Central PIX initiation manual](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf). The amount comes from the confirmed order, not the cart estimate. [node-qrcode](https://github.com/soldair/node-qrcode) encodes the payload locally; the inline SVG includes a four-module white quiet zone and black modules without remote QR/image services. The dependency is loaded with the lazy checkout route; `qrcode` is explicitly allowed as its upstream CommonJS package.

## Validation

### Customer payment refinements — 2026-10-17

- `cd api && ./mvnw test`: **38 tests passed**, zero failures/errors. The additional customer-only authorization test proves that both direct approval/refusal requests and pending-payment resolution are forbidden without payment/order mutation. Existing administrator-owned outcome, idempotency, concurrency and expiry tests remain active.
- `cd web && npm test -- --watch=false`: **86 tests passed across 20 files**. Coverage includes number lengths without Luhn/card-existence checks, required holder/CVV, current-month expiry, the official BCB CRC vector, confirmed order amount/reference, no customer outcome controls, pending submission and refresh recovery.
- `cd web && npm run build`: passed without warnings, **493.88 kB initial**, with unchanged size budgets.
- Isolated Chromium against the production SPA bundle and intercepted API/identity fixtures: **34 checks**, including **20 layout checks** (card errors, valid card, pending card and PIX across 1440/1024/768/375/320 px). An independent `jsQR` decoder read the rendered SVG payload and its final amount including freight. No runtime errors; card fields were absent from requests/storage. This refinement browser run did not use a live bank or backend.
- `npm audit --json`: nine existing dependency advisories (2 moderate, 4 high, 3 critical). All affected packages/versions were already present in the previous lockfile; no advisory targets `qrcode` or its newly added dependencies. Dependency remediation remains release-readiness work.
- No migration, schema or historical data changes were required for these refinements. Temporary preview/browser processes were stopped; no identity or database fixtures were created by the browser check.

### Original slice-5 validation

The results below record the original slice-5 delivery before the customer-facing payment refinements. The former approval/refusal controls and browser scenarios are historical evidence, not the current interface contract.

Original validation:

- `cd api && ./mvnw package`: **37 tests passed**, including the disabled-simulation profile. Flyway validated V1–V6 and Hibernate validated the schema in PostgreSQL 16 on the isolated test database.
- `cd api && ./mvnw clean package -DskipTests`: clean compilation/package passed after the complete test run; stale build resources were removed.
- `cd web && npm test -- --watch=false`: **70 tests passed across 19 files**.
- `cd web && npm run build`: passed without warnings; initial bundle **493.06 kB**, below the unchanged 500 kB warning budget. Native `Intl.DateTimeFormat` formats the single payment deadline without pulling date-formatting code into the initial bundle.
- Chromium with real Keycloak login and an isolated production API/database: **46 checks**, including **35 layout checks** across seven checkout states and five widths (1440, 1024, 768, 375, 320 px). Refusal followed by approval, cancellation, refresh recovery, deliberate loss of a committed creation response, and expiry passed. Three purchases produced exactly three orders despite request replay; no browser runtime errors occurred.
- Temporary identity, preview redirect/origin permissions, and purchase/catalog fixtures were cleaned up; user development services were not stopped.

Automated coverage includes authoritative totals, price/freight conflicts, ownership, snapshot preservation, rollback of multi-item failures, concurrent last-item purchases, concurrent checkout/payment replays, pending/refused/approved payments, cancellation, scheduled expiry, approval versus expiry, persisted recovery, storage failures, and confirmed-cart receipts.

## Changed files

### Documentation

- [`README.md`](../README.md)
- [`api/README.md`](../api/README.md)
- [`api/docs/modelagem/README.md`](../api/docs/modelagem/README.md)
- [`docs/implementation-backlog.md`](../docs/implementation-backlog.md)
- [`docs/transactional-checkout.md`](../docs/transactional-checkout.md)
- [`docs/visual-alignment.md`](../docs/visual-alignment.md)

### Database and configuration

- [`api/pom.xml`](../api/pom.xml)
- [`api/src/main/resources/META-INF/microprofile-config.properties`](../api/src/main/resources/META-INF/microprofile-config.properties)
- [`api/src/main/resources/application.properties.example`](../api/src/main/resources/application.properties.example)
- [`api/src/main/resources/db/migration/V6__criar_pedidos_pagamentos.sql`](../api/src/main/resources/db/migration/V6__criar_pedidos_pagamentos.sql)

### Backend and contracts

- [`api/src/main/java/br/unitins/tp2/dto/CheckoutConfiguracaoResponseDTO.java`](../api/src/main/java/br/unitins/tp2/dto/CheckoutConfiguracaoResponseDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/EnderecoEntregaResponseDTO.java`](../api/src/main/java/br/unitins/tp2/dto/EnderecoEntregaResponseDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/ItemCheckoutDTO.java`](../api/src/main/java/br/unitins/tp2/dto/ItemCheckoutDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/ItemPedidoResponseDTO.java`](../api/src/main/java/br/unitins/tp2/dto/ItemPedidoResponseDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/PagamentoDTO.java`](../api/src/main/java/br/unitins/tp2/dto/PagamentoDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/PagamentoResponseDTO.java`](../api/src/main/java/br/unitins/tp2/dto/PagamentoResponseDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/PedidoDTO.java`](../api/src/main/java/br/unitins/tp2/dto/PedidoDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/PedidoResponseDTO.java`](../api/src/main/java/br/unitins/tp2/dto/PedidoResponseDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/RevisaoPedidoDTO.java`](../api/src/main/java/br/unitins/tp2/dto/RevisaoPedidoDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/RevisaoPedidoResponseDTO.java`](../api/src/main/java/br/unitins/tp2/dto/RevisaoPedidoResponseDTO.java)
- [`api/src/main/java/br/unitins/tp2/dto/SimulacaoPagamentoDTO.java`](../api/src/main/java/br/unitins/tp2/dto/SimulacaoPagamentoDTO.java)
- [`api/src/main/java/br/unitins/tp2/exception/ConflitoPedidoException.java`](../api/src/main/java/br/unitins/tp2/exception/ConflitoPedidoException.java)
- [`api/src/main/java/br/unitins/tp2/exception/ConflitoPedidoExceptionMapper.java`](../api/src/main/java/br/unitins/tp2/exception/ConflitoPedidoExceptionMapper.java)
- [`api/src/main/java/br/unitins/tp2/job/ExpiracaoPedidosJob.java`](../api/src/main/java/br/unitins/tp2/job/ExpiracaoPedidosJob.java)
- [`api/src/main/java/br/unitins/tp2/model/EnderecoEntrega.java`](../api/src/main/java/br/unitins/tp2/model/EnderecoEntrega.java)
- [`api/src/main/java/br/unitins/tp2/model/FormaPagamento.java`](../api/src/main/java/br/unitins/tp2/model/FormaPagamento.java)
- [`api/src/main/java/br/unitins/tp2/model/ItemPedido.java`](../api/src/main/java/br/unitins/tp2/model/ItemPedido.java)
- [`api/src/main/java/br/unitins/tp2/model/Pagamento.java`](../api/src/main/java/br/unitins/tp2/model/Pagamento.java)
- [`api/src/main/java/br/unitins/tp2/model/Pedido.java`](../api/src/main/java/br/unitins/tp2/model/Pedido.java)
- [`api/src/main/java/br/unitins/tp2/model/ResultadoSimulacao.java`](../api/src/main/java/br/unitins/tp2/model/ResultadoSimulacao.java)
- [`api/src/main/java/br/unitins/tp2/model/StatusPagamento.java`](../api/src/main/java/br/unitins/tp2/model/StatusPagamento.java)
- [`api/src/main/java/br/unitins/tp2/model/StatusPedido.java`](../api/src/main/java/br/unitins/tp2/model/StatusPedido.java)
- [`api/src/main/java/br/unitins/tp2/model/converterjpa/FormaPagamentoConverter.java`](../api/src/main/java/br/unitins/tp2/model/converterjpa/FormaPagamentoConverter.java)
- [`api/src/main/java/br/unitins/tp2/model/converterjpa/ResultadoSimulacaoConverter.java`](../api/src/main/java/br/unitins/tp2/model/converterjpa/ResultadoSimulacaoConverter.java)
- [`api/src/main/java/br/unitins/tp2/model/converterjpa/StatusPagamentoConverter.java`](../api/src/main/java/br/unitins/tp2/model/converterjpa/StatusPagamentoConverter.java)
- [`api/src/main/java/br/unitins/tp2/model/converterjpa/StatusPedidoConverter.java`](../api/src/main/java/br/unitins/tp2/model/converterjpa/StatusPedidoConverter.java)
- [`api/src/main/java/br/unitins/tp2/repository/PagamentoRepository.java`](../api/src/main/java/br/unitins/tp2/repository/PagamentoRepository.java)
- [`api/src/main/java/br/unitins/tp2/repository/PedidoRepository.java`](../api/src/main/java/br/unitins/tp2/repository/PedidoRepository.java)
- [`api/src/main/java/br/unitins/tp2/resource/PedidoResource.java`](../api/src/main/java/br/unitins/tp2/resource/PedidoResource.java)
- [`api/src/main/java/br/unitins/tp2/service/PedidoService.java`](../api/src/main/java/br/unitins/tp2/service/PedidoService.java)
- [`api/src/main/java/br/unitins/tp2/service/PedidoServiceImpl.java`](../api/src/main/java/br/unitins/tp2/service/PedidoServiceImpl.java)

### Frontend

- `web/package.json`, `web/package-lock.json`, `web/angular.json` — local QR encoder, typings and CommonJS compatibility.
- `web/src/app/components/storefront/checkout/card-fields.ts`, `cartao.form.ts` — ephemeral Material card fields and local validators.
- `web/src/app/components/storefront/checkout/pix.ts`, `pix-payment.ts` — BR Code payload, SVG rendering and copy action.

- [`web/src/app/app.routes.ts`](../web/src/app/app.routes.ts)
- [`web/src/app/components/storefront/checkout/checkout.css`](../web/src/app/components/storefront/checkout/checkout.css)
- [`web/src/app/components/storefront/checkout/checkout.html`](../web/src/app/components/storefront/checkout/checkout.html)
- [`web/src/app/components/storefront/checkout/checkout.ts`](../web/src/app/components/storefront/checkout/checkout.ts)
- [`web/src/app/models/pedido.model.ts`](../web/src/app/models/pedido.model.ts)
- [`web/src/app/services/auth.service.ts`](../web/src/app/services/auth.service.ts)
- [`web/src/app/services/carrinho.service.ts`](../web/src/app/services/carrinho.service.ts)
- [`web/src/app/services/checkout.service.ts`](../web/src/app/services/checkout.service.ts)

### Tests

- `web/src/app/components/storefront/checkout/payment-fields.spec.ts` — card validation and official CRC reference vectors.

- [`api/src/test/java/br/unitins/tp2/resource/AutorizacaoResourceTest.java`](../api/src/test/java/br/unitins/tp2/resource/AutorizacaoResourceTest.java)
- [`api/src/test/java/br/unitins/tp2/resource/CatalogoTestProfile.java`](../api/src/test/java/br/unitins/tp2/resource/CatalogoTestProfile.java)
- [`api/src/test/java/br/unitins/tp2/resource/CheckoutDesabilitadoResourceTest.java`](../api/src/test/java/br/unitins/tp2/resource/CheckoutDesabilitadoResourceTest.java)
- [`api/src/test/java/br/unitins/tp2/resource/PedidoResourceTest.java`](../api/src/test/java/br/unitins/tp2/resource/PedidoResourceTest.java)
- [`web/src/app/components/storefront/checkout/checkout.spec.ts`](../web/src/app/components/storefront/checkout/checkout.spec.ts)
- [`web/src/app/services/checkout.service.spec.ts`](../web/src/app/services/checkout.service.spec.ts)
