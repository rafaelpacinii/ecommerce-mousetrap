# Active sprint / current task

## Current objective

Complete **Epic E1 (`#43` — 3NF Database Normalization, Enriched Entities & PlantUML Reconciliation)**
via Flyway migration `V9` and prepare **Epic E2 (`#44` — Product Categories & Component CRUD Screens)**
as the next sprint on `develop`.

## Current checkpoint (2026-11-05)

- **Released baselines:** `v1.0.0` (`fbcabb6`) and `v1.1.0` (`4ff1a36` on `main`, back-merged to
  `develop` at `59efe94`); manifests (`api/pom.xml`, `web/package.json`, `web/package-lock.json`)
  are aligned at `1.1.0`.
- **Completed in this sprint (`feature/e1-3nf-domain-normalization`):**
  - Flyway migration `V9__normalizar_catalogo_clientes_transportadoras.sql` with safe backfill.
  - 3NF JPA entities (`Pais`, `Sensor`, `SwitchMouse`, `TelefoneCliente`, `Transportadora`, `TipoTelefone`),
    enriched `Marca`, `Mouse`, `Cliente`, `Desejo`, `Pedido`, repositories, record DTOs, and services.
  - Reconciled PlantUML diagrams (`banco-de-dados.puml`, `diagrama-de-classes.puml`, `README.md`) and
    cleaned up stale R2 documentation notes.

## Master execution queue (`v1.2.0` → `v2.0.0`)

- [x] **Release `v1.0.0` (`#41`):** Slices 1–7 storefront, OIDC PKCE, cart, checkout, portal, admin & E2E (`V1`–`V7`).
- [x] **Release `v1.1.0` (`#42`):** 4-banner carousel, Cloudflare R2 uploads (`V8`), Dependabot, monorepo CI/CD & AI governance.
- [x] **Roadmap foundation (`PR #40`):** Create `docs/ROADMAP.md`, `ADR 0002`, and `scripts/sync_roadmap.py` covering Epics `E1`–`E7`.
- [x] **Epic E1 (`v1.2.0` — `#43`):** 3NF Database Normalization (`V9`: `Pais`, enriched `Marca`, `Sensor`, `SwitchMouse`, enriched `Cliente` + `TelefoneCliente`, `Desejo.cliente`, `Transportadora`) & PlantUML diagram reconciliation.
- [ ] **Epic E2 (`v1.2.0` — `#44` Next):** Product Categories (`V10`: `Categoria` entity/service/resource) & admin/catalog UI for normalized 3NF components (`/admin/categorias`, `/admin/sensores`, `/admin/switches`, `/admin/transportadoras`, `/catalogo` facets).
- [ ] **Epic E3 (`v1.3.0` — `#45`):** Real Merchandising (`V11`: curated weekly highlights `GET /catalogo/mouses/destaques` & real sales-based `ordenar=mais-vendidos`).
- [ ] **Epic E4 (`v1.3.0` — `#46`):** Discount Coupons (`V12`: `Cupom` CRUD, `POST /cupons/validar`, atomic checkout lock/redemption & order snapshot).
- [ ] **Epic E5 (`v1.4.0` — `#47`):** Verified Customer Reviews (`V13`: `Avaliacao` 1–5 star ratings, purchase ownership check, JSON-LD `aggregateRating` & admin moderation).
- [ ] **Epic E6 (`v1.4.0` — `#48`):** Order Refunds & Restock (`V14`: `StatusPedido.REEMBOLSADO`, `StatusPagamento.ESTORNADO`, atomic single stock restoration & `EventoPedido`).
- [ ] **Epic E7 (`v2.0.0` — `#49`):** External Gateways, R2 Orphan Cleanup & Integer-Cent Price Migration (`V15`: `evento_webhook_pagamento`, `PagamentoGateway`/`FreteGateway`, `precoCentavos` & blocking Trivy gates).

## Completed subtasks for Epic E1 (`#43`)

- [x] Create `api/src/main/resources/db/migration/V9__normalizar_catalogo_clientes_transportadoras.sql` with safe backfill of existing `mouse`, `marca`, `cliente`, `desejo` and `pedido` data.
- [x] Implement JPA entities (`Pais`, `Sensor`, `SwitchMouse`, `TelefoneCliente`, `Transportadora`, `TipoTelefone`), repositories, record DTOs, and services while keeping existing REST contracts backward-compatible.
- [x] Reconcile `api/docs/modelagem/diagrama-de-classes.puml`, `banco-de-dados.puml`, and `README.md` with the 3NF model, and update stale R2 notes in `api/README.md` and `docs/others/implementation-backlog.md`.
- [x] Verify migration `V9`, backend tests (`56/56`), and governance checks.

## Session decisions

- Address the professor's modeling feedback by normalizing transitive dependencies (`Sensor`, `SwitchMouse`, `Pais`, `TelefoneCliente`, `Transportadora`) and enriching `Marca`, `Mouse`, and `Cliente` in incremental Flyway migration `V9`, never rewriting `V1`–`V8`.
- Auto-synchronize `Sensor`, `SwitchMouse`, `Desejo.cliente`, and `Transportadora` in backend services so existing REST clients remain 100% compatible while new 3NF fields are persisted and returned.

## Validation evidence

- `cd api && ./mvnw -B -Prelease clean verify`: **56 tests passed** (`0` failures, `0` errors; Flyway validated and applied `V1`–`V9` on PostgreSQL 16).
- `python3 scripts/ai_checks.py verify --scope governance`: passed (entrypoints, 13 skills, links, TOML and context budgets).
- `python3 -m unittest discover -s scripts -p 'test_*.py' -v`: 14 Python unit tests passed.
