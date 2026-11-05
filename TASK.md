# Active sprint / current task

## Current objective

Record the exact post-merge checkpoint on `develop` (`d42c88f`) after completing PR #35
(`feature/restructure-ai-config` → `develop`), and track pending verification,
dependency maintenance, `v1.1.0` release preparation and backlog items.

## Where we stopped (checkpoint on 2026-11-05)

- Active branch: `develop` at `d42c88f`, synchronized with `origin/develop`.
- Stable baseline: `main` and tag `v1.0.0` remain at `fbcabb6`; manifests (`api/pom.xml`,
  `web/package.json`, `web/package-lock.json`) stay at `1.0.0` until release preparation.
- Completed on `develop` since `v1.0.0`:
  - Four-banner homepage campaign carousel (`feature/homepage-banner-carousel`, PR #19).
  - Storefront navigation, catalog search and `/enderecos` WCAG contrast fixes (PRs #20, #24).
  - Cloudflare R2 catalog image/brand logo uploads and Flyway `V8` (`feature/r2-catalog-images`, PR #21).
  - Incremental setup procedures and environment guides (`feature/setup-agent`, PR #22; `docs/ai/setup-*.md`).
  - Dependabot configuration and merged dependency updates across Maven, npm, Actions,
    Docker and Compose (`feature/configure-dependabot`, PR #23, PRs #25–#34).
  - Path-based monorepo scope detection in `.github/workflows/verify.yml` and
    `.github/workflows/cd.yml`, Trivy container scans, GHCR publishing and conditional
    SSH Compose deployment (`fix/ci-cd-pipeline`, PR #24; `feature/restructure-ai-config`, PR #35).
  - Repository AI governance restructuring (`AGENTS.md`, `CLAUDE.md`, `.codex/config.toml`,
    `.agents/project.toml`, 13 skills in `.agents/skills/`, rules/personas, ADR 0001,
    `scripts/ai_checks.py`, `scripts/check_ai_governance.py`, and `docs/others/` layout, PR #35).

## Step-by-step checklist (completed vs. remaining)

- [x] Restructure AI governance, 13 canonical skills, runner presets and `docs/others/` layout.
- [x] Add path-based monorepo scope detection to `verify.yml` and `cd.yml`.
- [x] Resolve PR #35 conflicts with `origin/develop` (`dae0043`), align Angular 22.2.4 /
      Material & CDK 22.2.5 manifests, push `ea27489` and merge PR #35 into `develop` (`d42c88f`).
- [x] Update `TASK.md` and `docs/SYSTEM_STATE.md` with the post-merge checkpoint and remaining work.
- [ ] Review and validate the two pending Maven Dependabot branches rebased on `d42c88f`:
  - `origin/dependabot/maven/api/develop/maven-plugins-efb2ace15a` (`8547d6d`: Surefire/Failsafe `3.5.6` → `3.6.1`).
  - `origin/dependabot/maven/api/develop/org.apache.maven-apache-maven-3.10.0` (`9d12c24`: Maven Wrapper `3.9.16` → `3.10.0`).
- [ ] Clean up superseded remote branches (`github-actions-073acec55a`, `angular-1b495c61cd` and merged feature branches) when authorized.
- [ ] Execute Docker-backed checks (`cd api && ./mvnw -B -Prelease clean verify` against PostgreSQL on `localhost:55439` and `sh scripts/verify_release.sh` for Playwright/Axe E2E) on a Docker-enabled host or confirm remote CI on `develop`.
- [ ] Prepare release `v1.1.0` when requested: branch `release/v1.1.0` from `develop`, align manifest versions to `1.1.0` per [versioning policy](docs/others/versioning.md), open PR to `main`, tag `v1.1.0` and back-merge to `develop`.
- [ ] Complete external production readiness before public hosting: HTTPS domains/proxy, production Keycloak/SMTP, `DEPLOY_*` and R2 secrets, and database/identity backup-restore rehearsal.
- [ ] Scope and approve future backlog slices before implementation: categories (`V9+`), live payment gateway/webhooks/refunds, carrier shipping APIs, curated/sales-based merchandising, R2 orphan cleanup, and integer-cent client/JSON price migration.

## Acceptance criteria for current checkpoint

- `TASK.md` and `docs/SYSTEM_STATE.md` accurately reflect `develop` at `d42c88f` and distinguish completed work, blocked local checks, release steps and planned features.
- Governance verification (`python3 scripts/ai_checks.py verify --scope governance`) and Python unit tests pass within the 180-line / 12,000-character entrypoint budget.
- No remote push, branch deletion or release creation is executed without explicit user authorization.

## Session decisions

- Keep application manifests at `1.0.0` on `develop`; version bumps happen exclusively on `release/v1.1.0` per `docs/others/versioning.md`.
- Preserve partial-build CD fallback (`latest` for unchanged service images) and non-blocking Trivy exit code (`0`) until an explicit policy change is requested.
- Record Docker-dependent backend/E2E checks as pending environment prerequisites rather than skipping or removing tests.

## Validation evidence

- `python3 scripts/ai_checks.py verify --scope governance`: passed (entrypoints, 13 skills, links, TOML and context budgets).
- `python3 -m unittest discover -s scripts -p 'test_*.py' -v`: 11 Python unit tests passed.
- Previous integration checks on `ea27489`/`d42c88f`: actionlint 1.7.12 passed on `verify.yml` and `cd.yml`; `npm ci`, `npm run audit` (0 vulnerabilities), web `tsc --noEmit`, 127 Vitest tests across 26 files, `npm run build` (347.36 kB initial bundle), API `./mvnw -B -Prelease clean compile` (118 Java 17 source files) and deterministic `scripts/package_release.py` passed.
- Pending Docker-dependent checks in this WSL environment: `cd api && ./mvnw -B -Prelease clean verify` (requires PostgreSQL on `localhost:55439`) and `sh scripts/verify_release.sh` (requires Docker Compose).
