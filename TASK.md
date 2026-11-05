# Active sprint / current task

## Current objective

Establish the visual end-to-end roadmap (`v1.0.0` → `v2.0.0`) in [ROADMAP.md](docs/ROADMAP.md),
[ADR 0002](docs/adr/0002-post-1-1-roadmap-and-domain-evolution.md), and `scripts/sync_roadmap.py`,
and queue **Epic E1 (3NF Database Normalization, Enriched Entities & PlantUML Reconciliation)**
as the immediate next implementation sprint on `develop`.

## Current checkpoint (2026-11-05)

- **Released baselines:** `v1.0.0` (`fbcabb6`) and `v1.1.0` (`4ff1a36` on `main`, back-merged to
  `develop` at `59efe94`); manifests (`api/pom.xml`, `web/package.json`, `web/package-lock.json`)
  are aligned at `1.1.0`.
- **Visual planning & tracking:**
  - Canonical specification and Mermaid ER/milestone diagrams: [docs/ROADMAP.md](docs/ROADMAP.md).
  - Architectural decision record for 3NF domain evolution: [ADR 0002](docs/adr/0002-post-1-1-roadmap-and-domain-evolution.md).
  - GitHub Milestones/Labels/Issues sync utility: `scripts/sync_roadmap.py` + `scripts/test_roadmap.py`.

## Master execution queue (`v1.2.0` → `v2.0.0`)

- [x] **Release `v1.0.0`:** Slices 1–7 storefront, OIDC PKCE, cart, checkout, portal, admin & E2E (`V1`–`V7`).
- [x] **Release `v1.1.0`:** 4-banner carousel, Cloudflare R2 uploads (`V8`), Dependabot, monorepo CI/CD & AI governance.
- [x] **Roadmap foundation:** Create `docs/ROADMAP.md`, `ADR 0002`, and `scripts/sync_roadmap.py` covering Epics `E1`–`E7`.
- [ ] **Epic E1 (`v1.2.0` — Next):** 3NF Database Normalization (`V9`: `Pais`, enriched `Marca`, `Sensor`, `SwitchMouse`, enriched `Cliente` + `TelefoneCliente`, `Desejo.cliente`, `Transportadora`) & PlantUML diagram reconciliation.
- [ ] **Epic E2 (`v1.2.0`):** Product Categories (`V10`: `Categoria` entity/service/resource) & admin/catalog UI for normalized 3NF components (`/admin/categorias`, `/admin/sensores`, `/admin/switches`, `/admin/transportadoras`, `/catalogo` facets).
- [ ] **Epic E3 (`v1.3.0`):** Real Merchandising (`V11`: curated weekly highlights `GET /catalogo/mouses/destaques` & real sales-based `ordenar=mais-vendidos`).
- [ ] **Epic E4 (`v1.3.0`):** Discount Coupons (`V12`: `Cupom` CRUD, `POST /cupons/validar`, atomic checkout lock/redemption & order snapshot).
- [ ] **Epic E5 (`v1.4.0`):** Verified Customer Reviews (`V13`: `Avaliacao` 1–5 star ratings, purchase ownership check, JSON-LD `aggregateRating` & admin moderation).
- [ ] **Epic E6 (`v1.4.0`):** Order Refunds & Restock (`V14`: `StatusPedido.REEMBOLSADO`, `StatusPagamento.ESTORNADO`, atomic single stock restoration & `EventoPedido`).
- [ ] **Epic E7 (`v2.0.0`):** External Gateways, R2 Orphan Cleanup & Integer-Cent Price Migration (`V15`: `evento_webhook_pagamento`, `PagamentoGateway`/`FreteGateway`, `precoCentavos` & blocking Trivy gates).

## Step-by-step subtasks for active Epic E1 (ready to start after merging roadmap PR)

- [ ] Create `api/src/main/resources/db/migration/V9__normalizar_catalogo_clientes_transportadoras.sql` with safe backfill of existing `mouse`, `marca`, `cliente`, `desejo` and `pedido` data.
- [ ] Implement JPA entities (`Pais`, `Sensor`, `SwitchMouse`, `TelefoneCliente`, `Transportadora`, `TipoTelefone`), repositories, record DTOs, and services while keeping existing REST contracts backward-compatible.
- [ ] Reconcile `api/docs/modelagem/diagrama-de-classes.puml`, `banco-de-dados.puml`, and `README.md` with the 3NF model, and update stale R2 notes in `api/README.md` and `docs/others/implementation-backlog.md`.
- [ ] Verify migration `V9`, backend tests, and governance checks.

## Session decisions

- Address the professor's modeling feedback by normalizing transitive dependencies (`Sensor`, `SwitchMouse`, `Pais`, `TelefoneCliente`, `Transportadora`) and enriching `Marca`, `Mouse`, and `Cliente` in incremental Flyway migrations (`V9`–`V10`), never rewriting `V1`–`V8`.
- Keep `scripts/sync_roadmap.py` safe by default (`--dry-run`) and require explicit `--apply` before mutating GitHub Milestones/Issues.

## Validation evidence

- `python3 scripts/ai_checks.py verify --scope governance`: passed (entrypoints, 13 skills, links, TOML and context budgets).
- `python3 -m unittest discover -s scripts -p 'test_*.py' -v`: 14 Python unit tests passed (including `test_roadmap.py`).
- `python3 scripts/sync_roadmap.py --dry-run`: passed (6 milestones, 8 labels, 9 epic issues verified).
- `python3 scripts/package_release.py` and `git diff --check`: passed.
