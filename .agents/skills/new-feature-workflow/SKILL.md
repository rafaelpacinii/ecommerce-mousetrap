---
name: new-feature-workflow
description: "Plan and implement a MouseTrap feature across existing modules, keeping TASK.md, architecture decisions and verification evidence current. Use for substantial feature work."
---

# New feature workflow

1. Read [policy](../../../AGENTS.md), [business rules](../../../docs/BUSINESS_RULES.md),
   [3NF models](../../../docs/modelagem/README.md), [task memory](../../../TASK.md),
   [system state](../../../docs/SYSTEM_STATE.md) and relevant `docs/adr/` records.
   Inspect Git status, current contracts, affected source and existing tests.
2. Confirm the user-requested behavior and already approved `BR-*` rules; never
   alter or bypass any rule in `docs/BUSINESS_RULES.md` without explicit user approval.
   Provide the Gitflow branch commands before implementation. Do not create a
   release, introduce tenants or choose a provider merely to complete a feature.
3. Write a bounded objective, affected files, testable subtasks and acceptance
   criteria in `TASK.md`; record architectural changes in an ADR when needed.
4. Add meaningful regression/acceptance tests before or alongside changed code.
   Use the appropriate domain skill; preserve Resource/Service/Repository and
   existing API/frontend units and ownership rules. Keep unrelated work intact.
5. Run `python3 scripts/ai_checks.py verify --scope web` and/or `--scope api` for
   changed application code; use `--scope governance` for AI guidance changes.
   Check `.agents/project.toml` for the actual `verify_commands`. Run production
   build, full API verify or `sh scripts/verify_release.sh` when behavior needs it.
6. Immediately mark each subtask complete after its checks pass. Record failures,
   prerequisites and next steps; unavailable checks remain pending. Do not add
   redundant tests just to satisfy a checkbox for a wording-only edit.
7. Review the final diff and update affected docs/system state. Deliver the
   seven-item report and selective Git commands; do not push or create PRs without
   explicit authorization. Refresh `TASK.md` before handing off.
