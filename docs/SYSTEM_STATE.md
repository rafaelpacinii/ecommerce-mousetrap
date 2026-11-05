# System state

Inventory verified from source on 2026-11-05 (`develop` at `d42c88f`; `main` at
`v1.0.0` / `fbcabb6`). Status describes implementation, not a claim of a publicly
operated production environment. Update this map when capabilities change; use
`TASK.md` for active task execution state.

## Module map

| Module                                                       | Status                                                        | Sources and practical limits                                                                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public storefront/catalog                                    | Implemented; production deployment unverified                 | `web/src/app`, `CatalogoResource`; four-banner carousel, combined filters, gallery and specifications                                                      |
| Catalog administration                                       | Implemented                                                   | Protected brands/mice/customer CRUD; R2 image/logo uploads, paging, sorting and version conflict handling                                                  |
| Identity/customer ownership                                  | Implemented                                                   | Keycloak realm, PKCE, `ClienteResource`, subject-scoped addresses/orders/wishlist                                                                          |
| Cart/checkout                                                | Implemented                                                   | Browser persistence; API revalidates stock, prices, delivery and totals                                                                                    |
| Orders/fulfillment                                           | Implemented                                                   | Atomic stock, idempotency, expiry/cancellation and recorded transitions                                                                                    |
| Payments                                                     | Implemented demo; live provider planned                       | PIX payload/QR and browser-only card validation; administrative local decisions                                                                            |
| Object storage                                               | Implemented integration; deployment credentials external      | `POST /imagens/{mouses\|marcas}`, `ImagemStorageServiceImpl`, AWS SDK S3 (`2.57.8`) for Cloudflare R2; public catalog URLs                                 |
| Persistence                                                  | Implemented                                                   | PostgreSQL 16, Flyway V1–V8 (`V8` adds `marca.logomarca_url`), Hibernate schema validation; next migration is `V9`                                         |
| Verification, CI/CD & packaging                              | Implemented on `develop`                                      | `.github/workflows/{verify,cd}.yml` (path-based scope detection, Trivy scan, GHCR, SSH Compose deploy), Dependabot, Playwright/Axe stack, deterministic ZIP |
| AI governance                                                | Implemented and merged on `develop` (PR #35)                  | `AGENTS.md`, `CLAUDE.md`, `.codex/config.toml`, `.agents/project.toml`, 13 skills in `.agents/skills` (`.codex/skills` alias), `scripts/ai_checks.py`, ADR 0001 |
| Release & public operations                                  | `v1.0.0` on `main`; `v1.1.0` unreleased on `develop`; external | Manifests stay `1.0.0` until `release/v1.1.0`; HTTPS domains, production Keycloak/SMTP, `DEPLOY_*` secrets and backup/restore rehearsal remain external     |
| Categories, refunds, carrier APIs, live webhooks, best-sellers | Planned                                                       | No implemented contract; do not invent endpoints, sales rankings or settled-payment behavior                                                               |

## Current architecture

- API: Java 17 / Quarkus 3.40.1.1, AWS SDK 2.57.8; Resource → Service → Repository → Entity,
  record DTOs and RFC Problem Details. See [conventions](CONVENTIONS.md).
- Web: Angular 22.2.4 / Material/CDK 22.2.5, TypeScript 6, Node 24 / npm 11;
  standalone components, signals/services, reactive forms and functional resolvers.
- Identity: Keycloak 26.8.1, single store, `admin`/`customer`, JWT subject ownership.
  **No multitenancy, organization selector or client-supplied tenant context.**
- R2: public, immutable catalog image URLs; not a private-download/signed-URL
  architecture. Upload limits/content checks exist. Do not apply the PDF's generic
  private-object or tenant assumptions without a new domain decision.
- Test profile explicitly uses PostgreSQL at `localhost:55439`; Dev Services is
  disabled. Failsafe integration tests remain skipped by `skipITs=true`.

## Where we stopped and what remains to be done

- **Completed checkpoint (`develop` at `d42c88f`):** PR #35 merged AI governance,
  `docs/others/` documentation relocation, path-based monorepo CI/CD scope detection
  and aligned Angular 22.2.4 / Material & CDK 22.2.5 manifests alongside post-`v1.0.0`
  features (four-banner homepage carousel, storefront search/navigation/contrast fixes,
  Cloudflare R2 uploads + `V8`, setup guides, Dependabot and CD pipeline).
- **Pending dependency maintenance:** two rebased Maven Dependabot branches on `origin`
  target `d42c88f` (`maven-plugins-efb2ace15a` at `8547d6d` for Surefire/Failsafe `3.6.1`,
  and `org.apache.maven-apache-maven-3.10.0` at `9d12c24` for Maven Wrapper `3.10.0`);
  superseded remote branches (`github-actions-073acec55a`, `angular-1b495c61cd`) can be pruned.
- **Pending Docker-backed verification:** local WSL lacks Docker, so PostgreSQL API
  tests (`cd api && ./mvnw -B -Prelease clean verify`) and disposable browser E2E
  (`sh scripts/verify_release.sh`) must run on a Docker host or in GitHub Actions.
- **Next release (`v1.1.0`):** cut `release/v1.1.0` from `develop`, bump `api/pom.xml`,
  `web/package.json` and `web/package-lock.json` to `1.1.0` per [versioning](others/versioning.md),
  merge to `main`, tag `v1.1.0` and back-merge to `develop`.
- **External production operations:** provision HTTPS reverse proxy/domains, production
  Keycloak (`start`, hostname v2) and SMTP, GitHub Actions `DEPLOY_*` secrets, R2 custom
  domain/credentials, and database/identity backup-restore rehearsal.

## Known technical debt and uncertainty

- SPA cart calculations and API JSON price values still use decimal JavaScript
  numbers. API totals use `BigDecimal`; plan a compatible integer-cent client
  migration instead of claiming the entire application is already cent-based.
- No application lint target is configured; `tsc --noEmit`, Angular build and
  tests cover different checks and must not be labelled ESLint.
- DTOs/frontend models are maintained separately; no automatic type generation.
- Client rendering limits route-specific social previews; hosting/prerendering
  and a domain sitemap remain decisions. See [release readiness](others/release-readiness.md).
- CI and CD run Trivy container scans with non-blocking exit status (`0`), and
  partial CD deploys fall back to `latest` for unchanged service images.
  npm audit/Axe do not establish a full JVM/OS/container audit or manual screen-reader certification.
- Historical [backlog](others/implementation-backlog.md) and `api/README.md` statements
  saying image upload is planned are stale; the service/resource and [R2 guide](others/cloudflare-r2.md)
  establish current support.
- S3 upload and later catalog association are separate operations; orphan cleanup,
  deletion lifecycle and provider/retention changes need explicit design.
- Do not reuse old validation counts as present evidence. Record new results in
  `TASK.md`; public deployment and current remote CI status need separate checks.

## Maintenance protocol

When code and this map disagree, inspect the implementation and its tests, update
this document, and explain material drift. Record accepted architectural changes
in [ADRs](adr/0001-record-architecture-decisions.md). Keep local private state,
tokens and generated credentials out of persistent AI memory.
