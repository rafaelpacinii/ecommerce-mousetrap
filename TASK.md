# Active sprint / current task

## Current objective

Establish the **Complete Global 3NF PlantUML Model (`docs/modelagem/`, `V1`–`V15`)** and
the **Authoritative Business Rules & AI Governance Lock (`docs/BUSINESS_RULES.md`)**
on branch `feature/complete-uml-and-business-rules`, then advance to
**Epic E2 (`#44` — Product Categories & Component CRUD Screens, `V10`)**.

## Current checkpoint (2026-11-07)

- **Released baselines:** `v1.0.0` (`fbcabb6`) and `v1.1.0` (`4ff1a36` on `main`);
  `develop` is at `a97c954` (includes **Epic E1 / `PR #50`** with Flyway `V9`).
- **Completed in this sprint (`feature/complete-uml-and-business-rules`):**
  - Relocated and expanded PlantUML domain and relational diagrams from `api/docs/modelagem/`
    to global [docs/modelagem/](docs/modelagem/README.md) (`diagrama-de-classes.puml`,
    `banco-de-dados.puml`, `README.md`, and rendered `.png` previews) covering implemented
    `V1`–`V9` entities/tables and approved planned `V10`–`V15` evolution.
  - Created [docs/BUSINESS_RULES.md](docs/BUSINESS_RULES.md) codifying 73 numbered rules
    (`BR-GOV`, `BR-IAM`, `BR-CAT`, `BR-CLI`, `BR-CRT`, `BR-PRC`, `BR-ORD`, `BR-PAY`, `BR-REV`),
    including `BR-IAM-09` locking in-memory tokens + Keycloak `HttpOnly` SSO cookies (zero `localStorage`).
  - Enriched Angular `AuthService` with computed signals (`iniciaisUsuario`, `perfilPrincipal`) and
    `hasAnyRole` to match the professor's session-signal patterns without storing tokens in `localStorage`.
  - Wired mandatory business-rule consultation and explicit user-authorization locks into
    `AGENTS.md`, `.agents/rules/business-rules.md`, domain skills, `scripts/check_ai_governance.py`,
    and `scripts/package_release.py`.

## Master execution queue (`v1.2.0` → `v2.0.0`)

- [x] **Release `v1.0.0` (`#41`):** Slices 1–7 storefront, OIDC PKCE, cart, checkout, portal, admin & E2E (`V1`–`V7`).
- [x] **Release `v1.1.0` (`#42`):** 4-banner carousel, Cloudflare R2 uploads (`V8`), Dependabot, monorepo CI/CD & AI governance.
- [x] **Roadmap foundation (`PR #40`):** `docs/ROADMAP.md`, `ADR 0002`, and `scripts/sync_roadmap.py` covering Epics `E1`–`E7`.
- [x] **Epic E1 (`v1.2.0` — `#43` / `PR #50`):** 3NF Database Normalization (`V9`: `Pais`, enriched `Marca`, `Sensor`, `SwitchMouse`, enriched `Cliente` + `TelefoneCliente`, `Desejo.cliente`, `Transportadora`).
- [x] **Global UML & Business Rules Lock (current branch):** Complete `V1`–`V15` PlantUML suite in `docs/modelagem/` + `docs/BUSINESS_RULES.md` + AI governance enforcement.
- [ ] **Epic E2 (`v1.2.0` — `#44` Next):** Product Categories (`V10`: `Categoria` entity/service/resource) & admin/catalog UI for normalized 3NF components (`/admin/categorias`, `/admin/sensores`, `/admin/switches`, `/admin/transportadoras`, `/catalogo` facets).
- [ ] **Epic E3 (`v1.3.0` — `#45`):** Real Merchandising (`V11`: curated weekly highlights `GET /catalogo/mouses/destaques` & real sales-based `ordenar=mais-vendidos`).
- [ ] **Epic E4 (`v1.3.0` — `#46`):** Discount Coupons (`V12`: `Cupom` CRUD, `POST /cupons/validar`, atomic checkout lock/redemption & order snapshot).
- [ ] **Epic E5 (`v1.4.0` — `#47`):** Verified Customer Reviews (`V13`: `Avaliacao` 1–5 star ratings, purchase ownership check, JSON-LD `aggregateRating` & admin moderation).
- [ ] **Epic E6 (`v1.4.0` — `#48`):** Order Refunds & Restock (`V14`: `StatusPedido.REEMBOLSADO`, `StatusPagamento.ESTORNADO`, atomic single stock restoration & `EventoPedido`).
- [ ] **Epic E7 (`v2.0.0` — `#49`):** External Gateways, R2 Orphan Cleanup & Integer-Cent Price Migration (`V15`: `evento_webhook_pagamento`, `PagamentoGateway`/`FreteGateway`, `precoCentavos` & blocking Trivy gates).

## Completed subtasks (`feature/complete-uml-and-business-rules`)

- [x] Move `api/docs/modelagem/` to global `docs/modelagem/`, expand `diagrama-de-classes.puml`, `banco-de-dados.puml`, and `README.md` across `V1`–`V15`, and render `.png` exports locally.
- [x] Create `docs/BUSINESS_RULES.md` documenting all implemented (`V1`–`V9`) and planned (`V10`–`V15`) `BR-*` business rules.
- [x] Enforce `docs/BUSINESS_RULES.md` and `docs/modelagem/` across `AGENTS.md`, `.agents/rules/business-rules.md`, skills, all repository Markdown links, `scripts/check_ai_governance.py`, and `scripts/package_release.py`.
- [x] Validate PlantUML syntax/rendering, AI governance checks, Python test suite, and deterministic release packaging.

## Session decisions

- Keep `docs/BUSINESS_RULES.md` and `docs/modelagem/README.md` comprehensive without artificial 180-line truncation, while enforcing their presence, `BR-GOV-03` lock, and valid Markdown links in `scripts/check_ai_governance.py` alongside a concise `always_on` `.agents/rules/business-rules.md` adapter (`<= 180` lines).
- Visually separate implemented (`V1`–`V9`, blue `<<Entity>>`) from approved planned (`V10`–`V15`, amber `<<Planned>>`) items in PlantUML so agents never mistake planned tables for active SQL prior to their Flyway migration.

## Validation evidence

- PlantUML syntax & PNG rendering (`plantuml.jar -checkonly` and `-tpng` on `docs/modelagem/banco-de-dados.puml` and `docs/modelagem/diagrama-de-classes.puml`): passed.
- `python3 scripts/ai_checks.py verify --scope governance`: passed.
- `python3 -m unittest discover -s scripts -p 'test_*.py' -v`: passed.
- `python3 scripts/package_release.py`: passed.
