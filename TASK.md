# Active sprint / current task

## Current objective

Resolve PR #35 (`feature/restructure-ai-config` → `develop`) locally, preserving
AI governance, monorepo CI/CD scope detection and upstream fixes/dependency updates.
Publish only with explicit user authorization.

## Context and relevant files

- Branch was clean and synchronized at `d5e7aed` before integration.
- Current integration base: `origin/develop` at `dae0043`; merge base `04721be`.
- Conflicts: `.github/workflows/cd.yml`, `.github/workflows/verify.yml` and the
  renamed `docs/others/release-readiness.md`.
- Governance/conventions: `AGENTS.md`, `docs/CONVENTIONS.md`, ADR 0001.
- GitHub confirms PR #35 conflicts with `develop`. No existing local merge/work
  was discarded. Original conflict stages were saved under `/tmp/mousetrap-pr35-merge`.

## Step-by-step execution checklist

- [x] Fetch origin and reproduce the PR conflict locally.
- [x] Combine scope-aware workflows with upstream action versions and release docs.
- [x] Preserve upstream application/dependency fixes and update current inventory.
- [x] Validate workflows, governance, Python scripts and affected application builds.
- [x] Stage the resolved integration and prepare its local merge commit.
- [x] Prepare validation evidence and the separate remote push command.

## Acceptance criteria

- No unmerged index entries, conflict markers or whitespace errors remain.
- CI/CD scope detection and always-run package/governance checks survive.
- Action references match upstream accepted updates; application fixes are retained.
- Documentation remains in `docs/others/` with working local links and current
  deployment secret names. No migrations, private settings or production state change.
- Actual validation results and skipped prerequisites are recorded; no remote
  push, PR mutation or deployment occurs without explicit authorization.

## Session decisions

- Merge `origin/develop` into the existing PR branch instead of rewriting history.
- Resolve workflow conflicts semantically: retain feature scope conditions and
  use upstream action refs throughout, including feature-only checkout steps.
- Retain the existing partial-build deployment behavior and document digest/latest
  fallback accurately; changing that policy is outside this conflict resolution.
- Upstream Angular dependency declarations did not match resolved lock versions,
  making `npm ci` fail with ERESOLVE. Align the manifest to the already resolved
  Angular 22.2.4 / Material/CDK 22.2.5 versions and regenerate lock metadata via npm.
- Previous AI restructuring is committed in `d5e7aed`; its usage guide remains
  `docs/ai-governance.md`. Do not reuse its historical test/package evidence here.

## Validation evidence

- Governance checks and all 11 Python tests passed.
- Both workflows passed actionlint 1.7.12. Their upstream action refs and three
  embedded Python blocks validated; 16 CI/CD scope scenarios passed.
- `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`, then
  `npm ci`: passed, zero reported vulnerabilities. No forced peer overrides.
- Web TypeScript check and 127 tests across 26 files passed.
- `cd web && npm run build`: passed; initial production bundle 347.36 kB.
- API `./mvnw -B -Prelease clean compile`: passed, 118 Java 17 source files;
  active local configuration absent from generated classes. JAVA_HOME was set
  only for the command to the already installed JDK 17.
- Docker is unavailable in this WSL distribution. PostgreSQL-dependent backend
  tests, full browser E2E, container scans and deployment were not executed.
- Ten upstream application/infrastructure files match origin/develop exactly;
  manifest/lockfile roots agree and canonical documentation relocation survives.
- Workflow/AI Markdown formatting, source package integrity and whitespace passed.
- Final local merge result and publication commands will be recorded in
  `dist/pr35-merge-delivery.md`; updating the GitHub PR still requires a push.
- Resolved paths are staged; `git ls-files -u` is empty and the staged whitespace
  check passes. Publication command: `git push origin feature/restructure-ai-config`.
