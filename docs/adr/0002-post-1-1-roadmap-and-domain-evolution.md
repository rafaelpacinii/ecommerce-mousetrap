# ADR 0002 — post-1.1 master roadmap and 3NF domain normalization

- Status: accepted
- Date: 2026-11-05
- Scope: roadmap governance (`v1.2.0` → `v2.0.0`) and 3NF relational evolution (`V9`–`V15`)

## Context

MouseTrap reached `v1.0.0` (slices 1–7) and `v1.1.0` (four-banner homepage carousel,
Cloudflare R2 image uploads with `V8`, monorepo CI/CD scope detection, Dependabot,
and 13 AI governance skills). Two needs emerged for the remainder of the project:

1. **Academic modeling feedback (Normal Forms & domain richness):** The professor
   noted that parts of the initial schema (`V1`–`V8`) were overly simple (e.g.,
   `Marca` only storing `nome`, `ativo`, and `logomarca_url`) or contained
   unnormalized inline attributes (`mouse.sensor`, `mouse.modelo_switch` →
   `mouse.tipo_switch`, `pedido.transportadora`, duplicated address columns on
   `cliente`, and `desejo` lacking a `cliente_id` foreign key).
2. **Continuous visual execution:** The user requested a single visual planning
   system showing completed, active, and remaining work from `v1.0.0` to `v2.0.0`
   so each epic can be implemented sequentially without stopping to redesign.

## Decision

1. **Canonical Visual Roadmap (`docs/ROADMAP.md`) + GitHub Sync (`scripts/sync_roadmap.py`):**
   Maintain [ROADMAP.md](../ROADMAP.md) as the in-repository visual blueprint (with
   Mermaid architecture/ER diagrams and epic specifications `E1`–`E7`) and use
   `scripts/sync_roadmap.py` (`--dry-run` by default, `--apply` when authorized) to
   synchronize GitHub Milestones (`v1.0.0` through `v2.0.0`), Labels, Epic Issues,
   and GitHub Projects v2 views.
2. **3NF Relational Normalization without Over-Engineering (Epics `E1` & `E2`):**
   - Extract `Pais` (`pais`) and enrich `Marca` (`marca`) with origin country,
     description, official website, support email, founding year, default warranty
     months, and optimistic locking (`versao`).
   - Eliminate 3NF transitive dependencies in `mouse` by extracting `Sensor`
     (`sensor`: `modelo`, `fabricante`, `dpi_maximo`, `ips`, `aceleracao_g`) and
     `SwitchMouse` (`switch_mouse`: `modelo`, `fabricante`, `tipo_switch`,
     `durabilidade_milhoes_cliques`, `forca_atuacao_gf`), plus `Categoria`
     (`categoria`: `nome`, `slug`, `descricao`) and physical dimensions on `mouse`.
   - Normalize `Cliente` (`cliente`) by adding `cpf`, `data_nascimento`, `ativo`,
     `versao`, extracting `TelefoneCliente` (`telefone_cliente` `1:N`), linking
     `Desejo` (`desejo.cliente_id`), and retiring redundant inline address columns
     on `cliente` in favor of `Endereco` (`endereco`).
   - Extract `Transportadora` (`transportadora`) referenced by `pedido.transportadora_id`
     while retaining immutable delivery/shipping snapshots on historical orders.
3. **Sequential Feature Evolution (`E3`–`E7` across `v1.3.0`–`v2.0.0`):**
   - `v1.3.0`: `E3` Real Merchandising (`V11`) and `E4` Discount Coupons (`V12`).
   - `v1.4.0`: `E5` Verified Customer Reviews (`V13`) and `E6` Order Refunds (`V14`).
   - `v2.0.0`: `E7` External Payment/Shipping Gateways & Webhooks (`V15`), R2
     orphan cleanup, and integer-cent price migration.
4. **Backward-Compatible Incremental Migrations:**
   Never edit committed migrations `V1`–`V8` or use Flyway clean. Every new schema
   change (`V9`–`V15`) must backfill existing rows safely and preserve existing
   REST contracts until an explicit major version (`v2.0.0`) transition.

## Alternatives considered

- **Keep the flat `V1`–`V8` schema and only update PlantUML comments:** Rejected
  because it does not address the professor's feedback regarding 3NF normalization
  and entity richness (`Marca`, `Mouse` hardware components, `Cliente` contacts).
- **Rewrite `V1`–`V8` migrations in place:** Rejected because altering applied
  Flyway migrations breaks checksums and violates `AGENTS.md` and `db-migration-safe`.
- **Use an external-only tracker without `docs/ROADMAP.md`:** Rejected because
  repository agents and offline academic grading packages need versioned context.

## Consequences and verification

- `docs/ROADMAP.md`, `TASK.md`, and `docs/SYSTEM_STATE.md` remain synchronized at
  every epic boundary; `scripts/check_ai_governance.py` validates links and entrypoint
  context budgets (`<= 180` lines / `<= 12,000` bytes).
- `scripts/sync_roadmap.py` is tested by `scripts/test_roadmap.py` and excluded from
  the academic runtime ZIP allowlist (`scripts/package_release.py` `SCRIPT_FILES`).

## Supersedes / Superseded by

- Extends [ADR 0001](0001-record-architecture-decisions.md). Not superseded.

