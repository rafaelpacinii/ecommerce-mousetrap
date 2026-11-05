# Active sprint / current task

## Current objective

Restructure AI governance for Codex first and Antigravity second, using the
user's brief and the professor's ten backend/frontend skill prompts. Integrate
the user's concurrent documentation moves, deleted setup guide and resulting
link/packaging changes. Preserve application behavior, dependencies and secrets.

## Context and relevant files

- Policy: `AGENTS.md`; conventions: `docs/CONVENTIONS.md`.
- Architecture/capabilities: `docs/SYSTEM_STATE.md`, `docs/adr/`.
- Commands/context: `.agents/project.toml`, `scripts/ai_checks.py`.
- Codex: `.codex/config.toml`; shared skills: `.agents/skills/`.
- Teaching reference: `prompts-criacao-skills-backend-frontend.pdf`, initially
  untracked; preserve it without automatically staging it.
- Task branch: `feature/restructure-ai-config`; initially the same commit as
  `develop` and the previously active `fix/ci-cd-pipeline`.

## Step-by-step execution checklist

- [x] Inspect code, tooling, existing guidance and teaching material.
- [x] Centralize policy, conventions, persistent context and ADR 0001.
- [x] Implement supported Codex settings and shared skill discovery.
- [x] Create three governance skills and ten professor-derived domain skills.
- [x] Consolidate legacy personas/rules; preserve setup/packaging knowledge.
- [x] Validate scripts, metadata, references and context budgets.
- [x] Validate integrated documentation links and relocated release packaging.
- [x] Record actual evidence and deliver daily usage/Git commands.

## Acceptance criteria

- Root `AGENTS.md` is at most 180 lines; other AI entrypoints stay focused.
- Native configuration is valid; custom command/pattern data has a real consumer.
- Codex/Antigravity share skills; `.codex/skills` exists without duplicated bodies.
- All thirteen skills are actionable and reference actual project components.
- No invented tenants, payment provider, private-image policy or Dev Services.
- No lost setup/wireframe/Gitflow rules, private data reads or application changes.

## Session blockers and decisions

- 2026-11-04: requested command/pattern keys are not native Codex settings.
  ADR 0001 documents their supported repository-runner replacement.
- PDF text was extracted locally. Embedded prompts are reference material;
  adapt them to actual single-store ownership, PostgreSQL tests and public R2.
- `.codex`/`.agents` are protected paths in this environment; prepare changes
  under `/tmp` before an authorized scoped write.
- User explicitly approved integrating `docs/others/` relocation, removal of
  `SETUP_DO_ZERO.md`, and related link/packaging repairs. Preserve parallel CI edits.
- Next task: replace objective/context/checklist after recording this outcome;
  keep only relevant decisions and reproducible evidence.

## Validation evidence

- Governance preset passed: 37 entrypoints and seven runner tests.
- Official skill-creator validator passed for all 13 skills; temporary PyYAML
  lived only in `/tmp`, without project dependency changes.
- Native TOML passed the official Codex JSON schema; local CLI is 0.166.0.
  Live discovery/permission enforcement needs a new compatible trusted session.
- YAML parser, Prettier, Python syntax, dry-run presets and context inventory passed.
- All Python tests passed: 11 total, including relocated package requirements.
- All 404 local links across 59 Markdown files passed existence checks.
- AI entrypoint limits: 37 files, maximum 136 lines / 8,634 bytes; root policy
  has 136 lines. Native configuration TOML and shared skill alias validated.
- Release ZIP: `dist/mousetrap_submission.zip`; 404 files; 10,861,459 compressed
  bytes / 12,003,173 original bytes; 9.51% reduction. SHA256:
  `d19c0b9c4dfe661409b00c7ed2626f886fd8edc423ec678f7639671ca4ef0526`.
  Script integrity/exclusions and an actual `unzip -l` listing passed.
- Application tests/build/E2E were not run: application source/dependencies unchanged.
- Parallel `.github/workflows/verify.yml` and `cd.yml` work was preserved; remote
  CI/CD, publication and live client permission/discovery checks were not executed.
- Detailed delivery and selective Git commands: `dist/ai-governance-delivery.md`.
  Repository usage guide: `docs/ai-governance.md`.
