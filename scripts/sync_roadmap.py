#!/usr/bin/env python3
"""Synchronize MouseTrap's master roadmap with GitHub Milestones, Labels, Issues, and Projects."""
import argparse
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
ROADMAP_PATH = ROOT / 'docs/ROADMAP.md'

LABELS = (
    {'name': 'epic', 'color': '7d53de', 'description': 'Master roadmap epic'},
    {'name': 'status:done', 'color': '2ea44f', 'description': 'Completed and merged'},
    {'name': 'status:ready', 'color': 'dacc3e', 'description': 'Next in queue for implementation'},
    {'name': 'status:planned', 'color': '0a122a', 'description': 'Specified in docs/ROADMAP.md'},
    {'name': 'scope:api', 'color': '1d76db', 'description': 'Quarkus REST API and services'},
    {'name': 'scope:web', 'color': '5319e7', 'description': 'Angular SPA and Material screens'},
    {'name': 'scope:db', 'color': '006b75', 'description': 'PostgreSQL schema and Flyway migrations'},
    {'name': 'scope:docs', 'color': '0e8a16', 'description': 'Documentation, ADRs and PlantUML'},
)

MILESTONES = (
    {
        'key': 'v1.0.0',
        'title': 'v1.0.0 — Storefront & Admin Baseline',
        'state': 'closed',
        'description': 'Completed MVP slices 1–7: public catalog, Keycloak OIDC PKCE, cart, ViaCEP, transactional checkout, customer portal, wishlist, admin operations and E2E stack (V1–V7).',
    },
    {
        'key': 'v1.1.0',
        'title': 'v1.1.0 — Carousel, R2, CI/CD & AI Governance',
        'state': 'closed',
        'description': 'Completed post-1.0 release: 4-banner hero carousel, Cloudflare R2 uploads (V8), incremental setup guides, Dependabot, monorepo CI/CD scope detection and 13 AI governance skills.',
    },
    {
        'key': 'v1.2.0',
        'title': 'v1.2.0 — 3NF Normalization, Enriched Catalog & Categories',
        'state': 'open',
        'description': 'Epics E1 & E2: 3NF relational restructuring (Pais, Marca+, Sensor, SwitchMouse, TelefoneCliente, Transportadora — V9), PlantUML reconciliation, and Product Categories (Categoria — V10).',
    },
    {
        'key': 'v1.3.0',
        'title': 'v1.3.0 — Merchandising & Discount Coupons',
        'state': 'open',
        'description': 'Epics E3 & E4: Curated weekly highlights, real best-sellers sales aggregation (V11), and Discount Coupons (Cupom) with atomic checkout redemption (V12).',
    },
    {
        'key': 'v1.4.0',
        'title': 'v1.4.0 — Customer Reviews & Order Refunds',
        'state': 'open',
        'description': 'Epics E5 & E6: Verified 1–5 star customer reviews with SEO AggregateRating (V13) and Order Refunds with atomic stock restoration (V14).',
    },
    {
        'key': 'v2.0.0',
        'title': 'v2.0.0 — External Gateways, R2 Cleanup & Integer-Cent Pricing',
        'state': 'open',
        'description': 'Epic E7: R2 orphan cleanup, pluggable payment/shipping gateways & webhook idempotency (V15), integer-cent price migration, and blocking Trivy gates.',
    },
)

EPICS = (
    {
        'code': 'V1.0',
        'title': '[v1.0.0] Storefront, OIDC, Cart, Transactional Checkout & Admin Baseline (Slices 1–7)',
        'milestone': 'v1.0.0',
        'state': 'closed',
        'column': 'Done',
        'migration': 'V1–V7',
        'labels': ('epic', 'status:done', 'scope:api', 'scope:web', 'scope:db'),
        'body': (
            '## Summary\n'
            'Completed baseline e-commerce implementation across slices 1–7 (`v1.0.0`).\n\n'
            '## Delivered Scope\n'
            '- [x] Slice 1: Brand palette, Material M3 theme, storefront layout and homepage hero.\n'
            '- [x] Slice 2: Public catalog (`/catalogo`), combined filters, gallery and specifications (`V3`).\n'
            '- [x] Slice 3: Keycloak OIDC PKCE login/registration, subject-scoped `/clientes/me` and guarded `/admin/**` (`V4`).\n'
            '- [x] Slice 4: Persistent Angular cart, ViaCEP lookup, freight calculation and owned addresses (`V5`).\n'
            '- [x] Slice 5: Transactional checkout, stock locks, UUID idempotency, PIX/card demo and order expiry (`V6`).\n'
            '- [x] Slice 6: Customer order portal, timeline events, persisted wishlist (`Desejo`) and admin fulfillment (`V7`).\n'
            '- [x] Slice 7: SEO metadata, Product JSON-LD, local fonts, disposable Playwright/Axe stack and deterministic ZIP.\n'
        ),
    },
    {
        'code': 'V1.1',
        'title': '[v1.1.0] 4-Banner Carousel, Cloudflare R2 Uploads, Monorepo CI/CD & AI Governance',
        'milestone': 'v1.1.0',
        'state': 'closed',
        'column': 'Done',
        'migration': 'V8',
        'labels': ('epic', 'status:done', 'scope:api', 'scope:web', 'scope:db', 'scope:docs'),
        'body': (
            '## Summary\n'
            'Completed compatible enhancements released in `v1.1.0`.\n\n'
            '## Delivered Scope\n'
            '- [x] Accessible 4-banner homepage campaign carousel (`feature/homepage-banner-carousel`).\n'
            '- [x] Storefront navigation, catalog search and `/enderecos` WCAG contrast refinements.\n'
            '- [x] Cloudflare R2 catalog image and brand logo uploads (`POST /imagens/{mouses|marcas}`, `V8`).\n'
            '- [x] Incremental workstation and integration setup guides (`docs/ai/setup-*.md`).\n'
            '- [x] Dependabot configuration and dependency upgrades across Quarkus, AWS SDK, Angular 22.2.4 and Actions.\n'
            '- [x] Monorepo path-based CI/CD scope detection (`verify.yml`, `cd.yml`), Trivy scans, GHCR and SSH Compose deploy.\n'
            '- [x] Repository AI governance restructuring (`AGENTS.md`, 13 skills in `.agents/skills/`, `ADR 0001`).\n'
        ),
    },
    {
        'code': 'E1',
        'title': '[Epic E1] 3NF Database Normalization, Enriched Entities & PlantUML Reconciliation (V9)',
        'milestone': 'v1.2.0',
        'state': 'open',
        'column': 'Ready / Next',
        'migration': 'V9',
        'labels': ('epic', 'status:ready', 'scope:api', 'scope:db', 'scope:docs'),
        'body': (
            '## Objective\n'
            'Address the academic modeling review by normalizing transitive dependencies (1NF/2NF/3NF), '
            'enriching overly simple domain entities, and reconciling the PlantUML diagrams with the implemented codebase.\n\n'
            '## Checklist\n'
            '- [ ] Create `V9__normalizar_catalogo_clientes_transportadoras.sql` following `db-migration-safe`.\n'
            '- [ ] Normalize `Pais` (`pais`) and enrich `Marca` (`pais_origem_id`, `descricao`, `site_oficial`, `email_suporte`, `ano_fundacao`, `garantia_padrao_meses`, `versao`).\n'
            '- [ ] Extract `Sensor` (`sensor`) and `SwitchMouse` (`switch_mouse`) to eliminate 3NF transitive dependencies on `mouse`, and add physical dimensions (`comprimento_mm`, `largura_mm`, `altura_mm`, `autonomia_bateria_horas`, `garantia_meses`).\n'
            '- [ ] Enrich `Cliente` (`cpf`, `data_nascimento`, `ativo`, `versao`), extract `TelefoneCliente` (`telefone_cliente` 1:N), and link `Desejo.cliente`.\n'
            '- [ ] Extract `Transportadora` (`transportadora`) referenced by `Pedido.transportadora` while preserving immutable order snapshots.\n'
            '- [ ] Reconcile `api/docs/modelagem/diagrama-de-classes.puml`, `banco-de-dados.puml` and `README.md` with the 3NF schema.\n'
            '- [ ] Add backend unit/integration tests verifying migration V9 backfill and backward-compatible DTO contracts.\n'
        ),
    },
    {
        'code': 'E2',
        'title': '[Epic E2] Product Categories (Categoria) & Enriched Component CRUD Screens (V10)',
        'milestone': 'v1.2.0',
        'state': 'open',
        'column': 'Planned',
        'migration': 'V10',
        'labels': ('epic', 'status:planned', 'scope:api', 'scope:web', 'scope:db'),
        'body': (
            '## Objective\n'
            'Add product taxonomy (`Categoria`) and expose complete administrative CRUD and public catalog filters for the normalized 3NF entities.\n\n'
            '## Checklist\n'
            '- [ ] Create `V10__criar_categorias.sql` (`categoria` table + `mouse.categoria_id` FK and index).\n'
            '- [ ] Implement `Categoria` entity, repository, DTOs, service and admin resource (`/categorias`).\n'
            '- [ ] Expose admin endpoints for `/sensores`, `/switches`, `/transportadoras` and `/paises`.\n'
            '- [ ] Extend `GET /catalogo/mouses` and `GET /catalogo/filtros` with `idCategoria`, `idSensor` and `idSwitch` facets.\n'
            '- [ ] Build Angular standalone CRUD screens under `/admin/categorias`, `/admin/sensores`, `/admin/switches` and `/admin/transportadoras`.\n'
            '- [ ] Update `/admin/marcas`, `/admin/mouses`, `/admin/clientes`, `/meus-dados` and `/catalogo` to manage and filter the enriched 3NF fields.\n'
        ),
    },
    {
        'code': 'E3',
        'title': '[Epic E3] Real Merchandising: Curated Weekly Highlights & Best-Sellers Aggregation (V11)',
        'milestone': 'v1.3.0',
        'state': 'open',
        'column': 'Planned',
        'migration': 'V11',
        'labels': ('epic', 'status:planned', 'scope:api', 'scope:web', 'scope:db'),
        'body': (
            '## Objective\n'
            'Deliver data-backed merchandising on the storefront homepage and catalog.\n\n'
            '## Checklist\n'
            '- [ ] Create `V11__adicionar_destaque_mouse.sql` (`destaque` and `ordem_destaque` on `mouse`).\n'
            '- [ ] Implement `ordenar=mais-vendidos` in `CatalogoServiceImpl` aggregating quantities from paid/shipped/delivered orders.\n'
            '- [ ] Add `GET /catalogo/mouses/destaques` for curated weekly highlights with deterministic fallback.\n'
            '- [ ] Add highlight controls in `/admin/mouses` and wire `/` and `/catalogo` to the new merchandising endpoints.\n'
        ),
    },
    {
        'code': 'E4',
        'title': '[Epic E4] Discount Coupons (Cupom) & Atomic Checkout Redemption (V12)',
        'milestone': 'v1.3.0',
        'state': 'open',
        'column': 'Planned',
        'migration': 'V12',
        'labels': ('epic', 'status:planned', 'scope:api', 'scope:web', 'scope:db'),
        'body': (
            '## Objective\n'
            'Support percentage and fixed-amount promotional coupons with server-side validation and atomic checkout locking.\n\n'
            '## Checklist\n'
            '- [ ] Create `V12__criar_cupons_desconto.sql` (`cupom` table + `cupom_id`, `codigo_cupom`, `valor_desconto` on `pedido`).\n'
            '- [ ] Implement `Cupom` entity, `TipoDesconto` enum/converter, admin CRUD `/cupons` and `POST /cupons/validar`.\n'
            '- [ ] Lock coupon row in `PedidoServiceImpl` during checkout, enforce validity/minimum subtotal/usage cap, and restore usage count on order cancellation or expiry.\n'
            '- [ ] Build `/admin/cupons` CRUD and integrate coupon application in `/carrinho`, `/checkout` and order detail screens.\n'
        ),
    },
    {
        'code': 'E5',
        'title': '[Epic E5] Verified Customer Reviews & Product Ratings (Avaliacao — V13)',
        'milestone': 'v1.4.0',
        'state': 'open',
        'column': 'Planned',
        'migration': 'V13',
        'labels': ('epic', 'status:planned', 'scope:api', 'scope:web', 'scope:db'),
        'body': (
            '## Objective\n'
            'Allow customers who purchased a mouse to publish verified 1–5 star reviews and surface aggregate ratings in the catalog and SEO JSON-LD.\n\n'
            '## Checklist\n'
            '- [ ] Create `V13__criar_avaliacoes_produto.sql` (`avaliacao` linked to `mouse`, `cliente` and `pedido`, `UNIQUE(cliente_id, mouse_id)`).\n'
            '- [ ] Enforce purchase ownership (`PAGO`, `ENVIADO` or `ENTREGUE`) in `POST /catalogo/mouses/{id}/avaliacoes`.\n'
            '- [ ] Expose `GET /catalogo/mouses/{id}/avaliacoes`, aggregate rating fields on catalog DTOs, and `PATCH /admin/avaliacoes/{id}/visibilidade`.\n'
            '- [ ] Render star ratings on product cards and `/catalogo/:id`, add `aggregateRating` in `SeoService`, and build review submission & admin moderation UIs.\n'
        ),
    },
    {
        'code': 'E6',
        'title': '[Epic E6] Order Refunds, Post-Payment Cancellation & Stock Restoration (Estorno — V14)',
        'milestone': 'v1.4.0',
        'state': 'open',
        'column': 'Planned',
        'migration': 'V14',
        'labels': ('epic', 'status:planned', 'scope:api', 'scope:web', 'scope:db'),
        'body': (
            '## Objective\n'
            'Model post-payment order refunds (`REEMBOLSADO` / `ESTORNADO`) with atomic stock restoration and immutable timeline events.\n\n'
            '## Checklist\n'
            '- [ ] Create `V14__adicionar_estorno_pedido_pagamento.sql` expanding status checks and adding `estornado_em` and `motivo_estorno`.\n'
            '- [ ] Implement atomic refund operation in `PedidoServiceImpl` (`POST /admin/pedidos/{id}/estornar` and customer request for unshipped paid orders).\n'
            '- [ ] Restore mouse stock exactly once under deterministic lock ordering and record `EventoPedido`.\n'
            '- [ ] Update `/admin/pedidos/:id` and `/meus-pedidos/:id` with refund actions, badges and timeline entries.\n'
        ),
    },
    {
        'code': 'E7',
        'title': '[Epic E7] External Gateways, R2 Orphan Cleanup & Integer-Cent Price Migration (V15)',
        'milestone': 'v2.0.0',
        'state': 'open',
        'column': 'Planned',
        'migration': 'V15',
        'labels': ('epic', 'status:planned', 'scope:api', 'scope:web', 'scope:db', 'scope:docs'),
        'body': (
            '## Objective\n'
            'Close remaining architectural technical debt and introduce pluggable external payment/shipping adapters for `v2.0.0`.\n\n'
            '## Checklist\n'
            '- [ ] Create `V15__criar_eventos_webhook.sql` (`evento_webhook_pagamento`) for idempotent payment webhook deduplication.\n'
            '- [ ] Implement `PagamentoGateway` and `FreteGateway` interfaces keeping local simulation for dev/test while supporting external providers.\n'
            '- [ ] Implement R2 orphan object audit and cleanup service comparing bucket keys with `imagem_mouse` and `marca` URLs.\n'
            '- [ ] Migrate client cart and API price contracts to integer cents (`precoCentavos`) with full test coverage.\n'
            '- [ ] Enforce blocking Trivy `CRITICAL`/`HIGH` container scans and full image digest pinning in `.github/workflows/{verify,cd}.yml`.\n'
        ),
    },
)


def build_plan() -> dict:
    """Return the deterministic synchronization payload without executing subprocesses."""
    if not ROADMAP_PATH.is_file():
        raise FileNotFoundError(f'Missing canonical roadmap: {ROADMAP_PATH}')
    return {
        'roadmap': str(ROADMAP_PATH.relative_to(ROOT).as_posix()),
        'labels': list(LABELS),
        'milestones': list(MILESTONES),
        'epics': list(EPICS),
    }


def format_board(plan: dict | None = None) -> str:
    """Render a readable ASCII Kanban / Roadmap overview for terminal inspection."""
    data = plan or build_plan()
    lines = [
        'MouseTrap — Master Visual Roadmap (v1.0.0 -> v2.0.0)',
        '=' * 78,
        f"{'Code':<6} | {'Column':<13} | {'Milestone':<8} | {'Flyway':<6} | Title",
        '-' * 78,
    ]
    for epic in data['epics']:
        lines.append(
            f"{epic['code']:<6} | {epic['column']:<13} | {epic['milestone']:<8} | "
            f"{epic['migration']:<6} | {epic['title']}"
        )
    lines.append('=' * 78)
    return '\n'.join(lines)


def _run_gh(args: list[str], runner=subprocess.run, input_text: str | None = None) -> str:
    result = runner(
        ['gh', *args],
        cwd=ROOT,
        input=input_text,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"gh {' '.join(args)} failed: {result.stderr.strip()}")
    return result.stdout.strip()


def apply_to_github(repo: str, runner=subprocess.run) -> dict:
    """Idempotently synchronize labels, milestones, and epic issues to GitHub via gh CLI."""
    plan = build_plan()
    for label in plan['labels']:
        _run_gh([
            'label', 'create', label['name'],
            '--repo', repo,
            '--color', label['color'],
            '--description', label['description'],
            '--force',
        ], runner=runner)

    raw_milestones = _run_gh([
        'api', f'repos/{repo}/milestones?state=all&per_page=100',
    ], runner=runner)
    existing_milestones = {
        item['title']: item['number']
        for item in json.loads(raw_milestones or '[]')
    }
    milestone_numbers = {}
    for milestone in plan['milestones']:
        title = milestone['title']
        if title in existing_milestones:
            number = existing_milestones[title]
            _run_gh([
                'api', '--method', 'PATCH', f'repos/{repo}/milestones/{number}',
                '-f', f'title={title}',
                '-f', f"state={milestone['state']}",
                '-f', f"description={milestone['description']}",
            ], runner=runner)
        else:
            created = json.loads(_run_gh([
                'api', '--method', 'POST', f'repos/{repo}/milestones',
                '-f', f'title={title}',
                '-f', f"state={milestone['state']}",
                '-f', f"description={milestone['description']}",
            ], runner=runner))
            number = created['number']
        milestone_numbers[milestone['key']] = number

    raw_issues = _run_gh([
        'issue', 'list', '--repo', repo, '--state', 'all', '--limit', '200',
        '--json', 'number,title,state',
    ], runner=runner)
    existing_issues = {
        item['title']: item
        for item in json.loads(raw_issues or '[]')
    }

    synced_issues = []
    for epic in plan['epics']:
        title = epic['title']
        milestone_number = milestone_numbers[epic['milestone']]
        payload = json.dumps({
            'title': title,
            'body': epic['body'],
            'milestone': milestone_number,
            'labels': list(epic['labels']),
        })
        if title not in existing_issues:
            created_issue = json.loads(_run_gh(
                ['api', '--method', 'POST', f'repos/{repo}/issues', '--input', '-'],
                runner=runner,
                input_text=payload,
            ))
            issue_number = str(created_issue['number'])
            if epic['state'] == 'closed':
                _run_gh([
                    'api', '--method', 'PATCH',
                    f'repos/{repo}/issues/{issue_number}',
                    '-f', 'state=closed',
                ], runner=runner)
            synced_issues.append({'title': title, 'action': 'created', 'state': epic['state']})
        else:
            issue_number = str(existing_issues[title]['number'])
            update_payload = json.dumps({
                'title': title,
                'body': epic['body'],
                'milestone': milestone_number,
                'labels': list(epic['labels']),
                'state': epic['state'],
            })
            _run_gh(
                ['api', '--method', 'PATCH', f'repos/{repo}/issues/{issue_number}', '--input', '-'],
                runner=runner,
                input_text=update_payload,
            )
            synced_issues.append({'title': title, 'action': 'updated', 'state': epic['state']})

    return {
        'repo': repo,
        'labels_synced': len(plan['labels']),
        'milestones_synced': len(plan['milestones']),
        'issues': synced_issues,
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', default='rafaelpacinii/ecommerce-mousetrap',
                        help='Target GitHub owner/repository')
    parser.add_argument('--apply', action='store_true',
                        help='Execute gh CLI mutations against GitHub (defaults to dry-run)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Print the synchronization plan without mutating GitHub')
    parser.add_argument('--status', action='store_true',
                        help='Print the ASCII Kanban / Roadmap status table')
    args = parser.parse_args(argv)

    plan = build_plan()
    if args.status or not args.apply:
        print(format_board(plan))
    if not args.apply:
        print(f"\nDry run complete: {len(plan['milestones'])} milestones, "
              f"{len(plan['labels'])} labels, and {len(plan['epics'])} epics ready. "
              "Pass --apply to synchronize with GitHub.")
        return 0

    report = apply_to_github(args.repo)
    print(json.dumps(report, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())

