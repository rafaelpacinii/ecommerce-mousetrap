# ADR 0001 — repository AI governance and decision records

- Status: accepted for this repository restructuring
- Date: 2026-11-04
- Scope: development instructions/tooling only; no application contract change

## Context

Root policy and legacy agent/rule files repeated architecture and stale versions.
The user's brief asks for compact shared policy, task memory, three procedures
and scoped personas. The professor's PDF supplies ten backend/frontend skill
prompts, including assumptions that do not match this single-store application.

## Decision

1. Keep `AGENTS.md` at most 180 lines. Put detailed conventions, system inventory
   and daily usage in separate documents; `TASK.md` tracks one current task.
2. Store thirteen canonical skill folders in `.agents/skills/`, discovered by
   Codex and current Antigravity. `.codex/skills` is a relative directory symlink
   to that collection, satisfying the requested layout without copying bodies.
3. Use only supported native keys in `.codex/config.toml`. Real permission
   profiles deny private files and make the npm lock read-only. Repository
   setup/verify commands and context patterns live in `.agents/project.toml`,
   consumed by `scripts/ai_checks.py`; they are not undocumented Codex options.
4. Context exclusions omit builds/dependencies/locks from the runner's inventory;
   runtime build tools still access dependencies, outputs and the lockfile.
   Permissions and context selection are separate mechanisms.
5. Keep `CLAUDE.md` as an `@AGENTS.md` import. Existing GitHub personas and
   Antigravity rules become concise adapters; root policy remains authoritative.
   Persona files are explicit prompt profiles, not claims of native subagent setup.
6. Adapt teaching examples to PostgreSQL test profiles, subject ownership and
   public R2 images. Creating these skills does not authorize schema, provider,
   privilege or payment behavior changes.

## Consequences and limits

- Commands work without new application dependencies; the runner needs Python
  3.11+ for `tomllib`. Skills are readable without executing the runner.
- Native permissions require a compatible trusted client/config layer; the
  local CLI is 0.166.0; configuration is checked against the official schema.
  A host's managed policy can override repository defaults.
- Deny-glob matching can be bounded/snapshotted per subprocess on some platforms;
  see the usage guide. Neither instructions nor context lists enforce Antigravity
  filesystem permissions. Escalated operations are outside the normal sandbox.
- Symlink support is needed for the compatibility alias; `.agents/skills` stays
  the canonical path even when a checkout cannot materialize the alias.
- Academic runtime ZIPs intentionally exclude AI configuration directories;
  use a Git checkout for the complete governance environment.

## Future ADR template

Create `NNNN-short-decision-name.md` with **Title, Status, Date, Context,
Decision, Alternatives, Consequences, Verification, Supersedes/Superseded by**.
State the real trigger, affected contracts/data, rollout and rollback constraints.
An ADR proposal is not permission to implement an unapproved domain change.

## Verification and references

Run `python3 scripts/ai_checks.py verify --scope governance`. Use real source
inspection and behavior checks for later application decisions.

- [Codex configuration](https://developers.openai.com/codex/config-reference/)
- [Codex permissions](https://learn.chatgpt.com/docs/permissions)
- [Codex skills](https://developers.openai.com/codex/skills/)
- [Antigravity skills](https://antigravity.google/docs/skills/)
- [Antigravity rules](https://antigravity.google/docs/rules/)
