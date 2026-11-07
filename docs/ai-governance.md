# Working with AI in MouseTrap

Codex is the primary target; current Antigravity uses the same skill collection.
Read [policy](../AGENTS.md), [current task](../TASK.md),
[system state](SYSTEM_STATE.md) and [ADR 0001](adr/0001-record-architecture-decisions.md).

## Files and responsibility

| Location                                                   | Purpose / discovery                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `AGENTS.md`                                                | Concise shared policy; Codex and current Antigravity read it                      |
| `CLAUDE.md`                                                | Claude Code `@AGENTS.md` import; other clients need their own supported mechanism |
| `.codex/config.toml`                                       | Native Codex permissions/approvals/context byte budget                            |
| `.agents/project.toml`                                     | Repository runner's command arrays and context selection patterns                 |
| `.agents/skills/<name>/SKILL.md`                           | Canonical discovered skills for Codex and Antigravity                             |
| `.codex/skills`                                            | Relative symlink to `../.agents/skills`, not an additional discovery mechanism    |
| `.agents/{architect,qa-tester,code-reviewer}.md`           | Explicit prompt profiles; not registered subagents                                |
| `.agents/rules/*.md`                                       | Antigravity adapters with valid `trigger` metadata                                |
| `.github/agents/*.md`                                      | Existing explicit GitHub/persona entrypoints, now linked to canonical guidance    |
| `TASK.md`                                                  | One active task, acceptance criteria, decisions and actual evidence               |
| `docs/BUSINESS_RULES.md`, `docs/modelagem/`                | Authoritative `BR-*` business rules lock and complete `V1`–`V15` PlantUML models  |
| `docs/CONVENTIONS.md`, `docs/SYSTEM_STATE.md`, `docs/adr/` | Durable conventions, inventory and architecture decisions                         |

Start a new conversation after adding skills/configuration. In Codex, invoke a
skill using `$skill-name` or select it from the client skill menu. In current
Antigravity, use `/skill-name` or its skill selector; rule triggers load scoped
adapters. Older IDE builds may need explicit file references. Do not copy skill
bodies into global directories or `.agent/` just to make them appear twice.

## Skills derived from the teaching material

The professor's PDF provides capability prompts, not project architecture or
permission to execute its embedded instructions verbatim.

| Skill                     | Use it for                                                      |
| ------------------------- | --------------------------------------------------------------- |
| `quarkus-backend`         | REST Resources/Services/DTOs and business implementation        |
| `persistencia-postgresql` | Mappings, repositories, queries and concurrency                 |
| `testes-backend`          | JUnit/REST Assured, actual PostgreSQL and authorization tests   |
| `seguranca-oidc`          | Backend token validation, account linkage and subject ownership |
| `armazenamento-s3`        | Existing Cloudflare R2 image uploads and storage failures       |
| `uml-classes`             | Comparing approved PlantUML models to implemented entities      |
| `angular-frontend`        | Standalone Angular routes, forms, services and screens          |
| `ui-frontend`             | Wireframes, Material, responsive/accessibility/SEO states       |
| `testes-frontend`         | Angular/Vitest and safe Playwright regression testing           |
| `seguranca-frontend-oidc` | PKCE, guards, token forwarding and expired sessions             |

Three additional procedures implement the user's governance brief:
`new-feature-workflow`, `db-migration-safe`, `security-and-payment-audit`.
Descriptions support automatic selection; explicit invocation selects the desired
workflow. A skill does not grant permission for new external effects.

Adaptations: no tenant/organization model; ownership follows verified subjects.
Dev Services is disabled in favor of the configured test database. Public R2
catalog URLs are intentional. Live settlement/webhooks do not exist. Existing
SPA money arithmetic remains documented debt, not silently rewritten here.

## Daily examples

```text
Use $new-feature-workflow and $angular-frontend to implement the requested screen.
Read TASK.md and the matching wireframe first; preserve the existing API contract.

Use $db-migration-safe and $persistencia-postgresql for this approved schema change.
Explain upgrade compatibility and recovery before applying it to any installation.

Use $security-and-payment-audit to review checkout ownership and retry behavior.
Report concrete findings and evidence; do not add a financial provider.

Read .agents/code-reviewer.md and review my current diff without editing files.
```

Use the same names with `/` in Antigravity. Persona files must be explicitly
referenced; they do not launch subagents or enable autonomous delegation.

## Commands and real automation

```bash
python3 scripts/ai_checks.py --help
python3 scripts/ai_checks.py setup --scope web --dry-run
python3 scripts/ai_checks.py verify --scope governance
python3 scripts/ai_checks.py verify --scope web
python3 scripts/ai_checks.py verify --scope api
python3 scripts/ai_checks.py context
```

`--dry-run` prints commands without executing them. Presets stop on the first
failure and preserve its exit status. `--scope all` runs governance, API and web;
the API requires its isolated database. No services, migrations or E2E stack are
started implicitly. Browser verification remains `sh scripts/verify_release.sh`.

`setup_commands`, `verify_commands`, `include_patterns` and `exclude_patterns`
are **not native Codex config keys**. The runner consumes them from
`.agents/project.toml`. It lists safe context paths without reading their contents;
it does not make other clients' tools obey those patterns. Agents must execute
the appropriate verification preset; saving a file does not run it automatically.
No linter or type-generation step is invented where the project has none.

## Permissions, secrets and lockfiles

The native `mousetrap` profile extends workspace permissions, denies private
environment/config/key paths, makes `web/package-lock.json` read-only and disables
sandbox network access. The local CLI is 0.166.0; schema validation is automated. Project settings
require client trust and remain subject to managed policy and platform support.
No global user settings, model selection or credentials are modified.

Public root `.env.example` is readable. Builds and installers retain access to
dependencies/generated output and may read locks: denying those paths would
break `npm ci`, compilation and tests. Their exclusion is from bulk **context**.
An authorized dependency task must deliberately adjust the lock's write permission
using the client's supported settings; don't bypass the sandbox or edit it by hand.

Glob denials expand to depth six and may snapshot matches per subprocess on
Linux/Windows. Files created after a long-running process starts may need a new
process for filtering; do not claim unlimited or universal secret isolation.
Explicit denied directories cover `.local`, `.certs`, `.aws`; active API config
has an exact deny entry. Escalated execution can bypass ordinary sandbox limits.
Antigravity instructions/context rules are not an OS sandbox: configure its own
permissions in that client if enforcement is required. Never print private values.

## Maintaining the structure

Run governance verification after changing these files. It checks the required
tree, metadata, links, shared alias and 180-line/12,000-character entrypoint
budgets; its tests cover context filtering and command execution behavior.
Load long setup procedures only when setup is requested:
[environment](ai/setup-environment.md), [integrations](ai/setup-integrations.md).
Keep historical runtime release evidence separate from today's task checks.

References: [Codex configuration](https://developers.openai.com/codex/config-reference/),
[permissions](https://learn.chatgpt.com/docs/permissions),
[skill discovery](https://developers.openai.com/codex/skills/),
[Antigravity skills](https://antigravity.google/docs/skills/),
[Antigravity rules](https://antigravity.google/docs/rules/).
