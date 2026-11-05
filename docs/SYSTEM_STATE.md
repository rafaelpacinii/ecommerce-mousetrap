# System state

Inventory verified from source on 2026-11-04. Status describes implementation,
not a claim of a publicly operated production environment. Update this map when
capabilities change; use `TASK.md` for temporary execution state.

## Module map

| Module                                           | Status                                                           | Sources and practical limits                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Public storefront/catalog                        | Implemented; production deployment unverified                    | `web/src/app`, `CatalogoResource`; filters, gallery, carousel and specifications               |
| Catalog administration                           | Implemented                                                      | Protected brands/mice/customer CRUD; paging, sorting and version conflict handling             |
| Identity/customer ownership                      | Implemented                                                      | Keycloak realm, PKCE, `ClienteResource`, subject-scoped addresses/orders/wishlist              |
| Cart/checkout                                    | Implemented                                                      | Browser persistence; API revalidates stock, prices, delivery and totals                        |
| Orders/fulfillment                               | Implemented                                                      | Atomic stock, idempotency, expiry/cancellation and recorded transitions                        |
| Payments                                         | Implemented demo; live provider planned                          | PIX payload/QR and browser-only card validation; administrative local decisions                |
| Object storage                                   | Implemented integration; deployment credentials external         | `ImagemStorageServiceImpl`, AWS SDK S3 adapter for Cloudflare R2; public catalog URLs          |
| Persistence                                      | Implemented                                                      | PostgreSQL 16, Flyway V1–V8, Hibernate schema validation; next migration currently V9          |
| Verification/packaging                           | Implemented                                                      | `.github/workflows/verify.yml`, Playwright/Axe, disposable release stack and deterministic ZIP |
| AI governance                                    | Implemented in this change; client discovery needs a new session | `AGENTS.md`, `.codex/config.toml`, `.agents/skills`, runner, ADR 0001                          |
| Public production operations                     | Planned / external                                               | HTTPS domains, production Keycloak/SMTP, managed secrets, backup/restore rehearsal             |
| Categories, refunds, carrier APIs, live webhooks | Planned                                                          | No implemented contract; do not invent endpoints or settled-payment behavior                   |

## Current architecture

- API: Java 17 / Quarkus 3.39.3; Resource → Service → Repository → Entity,
  record DTOs and RFC Problem Details. See [conventions](CONVENTIONS.md).
- Web: Angular 22.2.3 / Material/CDK, TypeScript 6, Node 24 / npm 11;
  standalone components, signals/services, reactive forms and functional resolvers.
- Identity: Keycloak 26.8.1, single store, `admin`/`customer`, JWT subject ownership.
  **No multitenancy, organization selector or client-supplied tenant context.**
- R2: public, immutable catalog image URLs; not a private-download/signed-URL
  architecture. Upload limits/content checks exist. Do not apply the PDF's generic
  private-object or tenant assumptions without a new domain decision.
- Test profile explicitly uses PostgreSQL at `localhost:55439`; Dev Services is
  disabled. Failsafe integration tests remain skipped by `skipITs=true`.

## Known technical debt and uncertainty

- SPA cart calculations and API JSON price values still use decimal JavaScript
  numbers. API totals use `BigDecimal`; plan a compatible integer-cent client
  migration instead of claiming the entire application is already cent-based.
- No application lint target is configured; `tsc --noEmit`, Angular build and
  tests cover different checks and must not be labelled ESLint.
- DTOs/frontend models are maintained separately; no automatic type generation.
- Client rendering limits route-specific social previews; hosting/prerendering
  and a domain sitemap remain decisions. See [release readiness](others/release-readiness.md).
- CI now also defines Trivy container scans with non-blocking exit status. Their
  current execution is unverified; npm audit/Axe do not establish a full JVM/OS/
  container vulnerability audit or complete manual screen-reader certification.
- Historical backlog/API README statements saying image upload is planned are
  stale; the service/resource and [R2 guide](others/cloudflare-r2.md) establish current support.
- S3 upload and later catalog association are separate operations; orphan cleanup,
  deletion lifecycle and provider/retention changes need explicit design.
- Do not reuse old validation counts as present evidence. Record new results in
  `TASK.md`; public deployment and current remote CI status need separate checks.

## Maintenance protocol

When code and this map disagree, inspect the implementation and its tests, update
this document, and explain material drift. Record accepted architectural changes
in [ADRs](adr/0001-record-architecture-decisions.md). Keep local private state,
tokens and generated credentials out of persistent AI memory.
