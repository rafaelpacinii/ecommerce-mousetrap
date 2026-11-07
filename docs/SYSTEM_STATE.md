# System state

Inventory verified from source on 2026-11-07 (`develop` at `a97c954`; `main` at
`v1.1.0` / `4ff1a36`). Status describes implementation, not a claim of a publicly
operated production environment. Update this map when capabilities change; use
[TASK.md](../TASK.md) for active sprint state, [BUSINESS_RULES.md](BUSINESS_RULES.md)
for mandatory `BR-*` domain invariants, [docs/modelagem/](modelagem/README.md) for
complete `V1`–`V16` PlantUML models, and [ROADMAP.md](ROADMAP.md) for the `v1.0.0` → `v2.0.0` plan.

## Module map

| Module                                                | Status                                               | Sources and practical limits                                                                                                                               |
| ----------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public storefront/catalog                             | Implemented (`v1.1.0`); 3NF enrichment in `v1.2.0`   | `web/src/app`, `CatalogoResource`; four-banner carousel, combined filters, gallery and specifications                                                      |
| Catalog administration                                | Implemented (`v1.1.0`); component CRUD in `v1.2.0`   | Protected brands/mice/customer CRUD; R2 image/logo uploads, paging, sorting and version conflict handling                                                  |
| Identity/customer ownership                           | Implemented (`v1.0.0`)                               | Keycloak realm, PKCE, `ClienteResource`, subject-scoped addresses/orders/wishlist                                                                          |
| Cart/checkout                                         | Implemented (`v1.0.0`)                               | Browser persistence; API revalidates stock, prices, delivery and totals                                                                                    |
| Orders/fulfillment                                    | Implemented (`v1.0.0`)                               | Atomic stock, idempotency, expiry/cancellation and recorded transitions                                                                                    |
| Payments                                              | Implemented demo; pluggable gateway in `v2.0.0`      | PIX payload/QR and browser-only card validation; administrative local decisions                                                                            |
| Object storage                                        | Implemented (`v1.1.0`); orphan cleanup in `v2.0.0`   | `POST /imagens/{mouses\|marcas}`, `ImagemStorageServiceImpl`, AWS SDK S3 (`2.57.8`) for Cloudflare R2; public catalog URLs                                 |
| Persistence                                           | Implemented (`V1`–`V10`); 3NF evolution `V11`–`V16`   | PostgreSQL 16, Flyway V1–V10 (`V9` normalizes `pais`, `sensor`, `switch_mouse`, `telefone_cliente`, `transportadora`), Hibernate schema validation; V10 seeds 5,571 official municipalities; next migration is `V11` |
| Verification, CI/CD & packaging                       | Implemented (`v1.1.0`)                               | `.github/workflows/{verify,cd}.yml` (path-based scope detection, Trivy scan, GHCR, SSH Compose deploy), Dependabot, Playwright/Axe stack, deterministic ZIP |
| AI governance, business rules & roadmap               | Implemented (`v1.1.0` + `BUSINESS_RULES.md`)         | `AGENTS.md`, `docs/BUSINESS_RULES.md`, `docs/modelagem/`, `.agents/rules/business-rules.md`, 13 skills, `scripts/ai_checks.py`, `scripts/sync_roadmap.py`, ADRs [0001](adr/0001-record-architecture-decisions.md) & [0002](adr/0002-post-1-1-roadmap-and-domain-evolution.md) |
| 3NF normalization & Categories (`E1`–`E2`)            | `E1` (`V9`) implemented; `E2` (`V11`) next           | `Pais`, enriched `Marca`, `Sensor`, `SwitchMouse`, `TelefoneCliente`, `Transportadora`, and PlantUML reconciliation implemented in `V9`; `Categoria` + admin UI in `V11` |
| Merchandising & Discount Coupons (`E3`–`E4`)          | Specified for `v1.3.0` (`V12`–`V13`)                 | Curated weekly highlights, real `mais-vendidos` sales aggregation, and `Cupom` checkout discounts                                                          |
| Customer Reviews & Order Refunds (`E5`–`E6`)          | Specified for `v1.4.0` (`V14`–`V15`)                 | Purchase-verified `Avaliacao` (1–5 stars + JSON-LD `aggregateRating`) and atomic `REEMBOLSADO`/`ESTORNADO` stock restoration                               |
| External Gateways & Integer-Cent Pricing (`E7`)       | Specified for `v2.0.0` (`V16`)                       | `PagamentoGateway`, `FreteGateway`, idempotent webhooks, R2 orphan cleanup, and integer-cent (`precoCentavos`) migration                                   |

## Current architecture

- API: Java 17 / Quarkus 3.40.1.1, AWS SDK 2.57.8, Maven 3.10.0; Resource → Service → Repository → Entity,
  record DTOs and RFC Problem Details. See [conventions](CONVENTIONS.md).
- Web: Angular 22.2.4 / Material/CDK 22.2.5, TypeScript 6, Node 24 / npm 11;
  standalone components, signals/services, reactive forms and functional resolvers.
- Identity: Keycloak 26.8.1, single store, `admin`/`customer`, JWT subject ownership.
  **No multitenancy, organization selector or client-supplied tenant context.**
- R2: public, immutable catalog image URLs; not a private-download/signed-URL
  architecture. Upload limits/content checks exist.
- Test profile explicitly uses PostgreSQL at `localhost:55439`; Dev Services is
  disabled. Failsafe integration tests remain skipped by `skipITs=true`.

## Where we stopped and next execution sequence

- **Completed releases:** `v1.0.0` (`fbcabb6`) and `v1.1.0` (`4ff1a36`, merged into `main`
  and back-merged into `develop` at `59efe94`).
- **Master Roadmap (`v1.2.0` → `v2.0.0`):** Seven sequential epics (`E1`–`E7`) are
  fully specified in [ROADMAP.md](ROADMAP.md) and [ADR 0002](adr/0002-post-1-1-roadmap-and-domain-evolution.md)
  to address the professor's 3NF modeling review and complete the e-commerce lifecycle:
  1. **`v1.2.0` (`E1` + `E2`):** 3NF normalization (`V9`), PlantUML reconciliation, and Product Categories (`V11`).
  2. **`v1.3.0` (`E3` + `E4`):** Real Merchandising (`V12`) and Discount Coupons (`V13`).
  3. **`v1.4.0` (`E5` + `E6`):** Verified Customer Reviews (`V14`) and Order Refunds (`V15`).
  4. **`v2.0.0` (`E7`):** Pluggable Gateways/Webhooks (`V16`), R2 orphan cleanup, and integer-cent pricing.

## Address resilience (2026-11-07)

- User-approved BR-CLI-04 replacement: customer/admin forms submit local `codigoIbge`;
  optional ViaCEP autofill never blocks manual entry. Existing clients without the
  new field retain the previous lookup behavior.
- Public `GET /localidades/estados` and `/localidades/estados/{uf}/municipios` read
  PostgreSQL only. V10 inserts missing IBGE municipalities and preserves existing IDs.
- Public freight estimates validate postcode format without resolving a city;
  checkout calculates freight using the owned saved address without external HTTP.
- [ADR 0003](adr/0003-independent-address-registration.md) records the migration
  allocation (future E2–E7 migrations move to V11–V16) and tradeoffs.
- [Dependency inventory](others/external-dependencies.md) distinguishes runtime
  third parties, owned infrastructure and build dependencies.

## Known technical debt and uncertainty

- Legacy inline columns on `mouse` (`sensor`, `modelo_switch`, `tipo_switch`), `pedido`
  (`transportadora`), and `cliente` (`cep`, `logradouro`, `bairro`, `numero`, `municipio_id`)
  are preserved alongside the new 3NF tables (`V9`) for backward compatibility while **Epic E2 (`V11`)**
  wires the dedicated frontend component selectors.
- SPA cart calculations and API JSON price values still use decimal JavaScript
  numbers (`BigDecimal` on the API); **Epic E7 (`v2.0.0`)** schedules the integer-cent migration.
- No application lint target is configured; `tsc --noEmit`, Angular build and
  tests cover different checks and must not be labelled ESLint.
- Client rendering limits route-specific social previews; see [release readiness](others/release-readiness.md).
- CI and CD run Trivy container scans with non-blocking exit status (`0`), and
  partial CD deploys fall back to `latest` for unchanged service images (scheduled for hardening in `E7`).

## Maintenance protocol

When code and this map disagree, inspect the implementation and its tests, update
this document, and explain material drift. Record accepted architectural changes
in [ADRs](adr/0001-record-architecture-decisions.md). Keep local private state,
tokens and generated credentials out of persistent AI memory.
