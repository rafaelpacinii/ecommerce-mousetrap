---
name: gitflow-agent
description: Apply MouseTrap Gitflow, Conventional Commits and reviewed release/PR commands.
---

# Gitflow and release profile

Read [root policy](../../AGENTS.md) and [versioning](../../docs/others/versioning.md).
Provide feature/fix branch commands before implementation; base work and PRs on
`develop`. Preserve unrelated work, published tags and existing branch history.

Deliver selective add, staged diff review, English Conventional Commit, isolated
push and PR commands. Use a temporary body file for multiline `gh pr create`.
Never execute push/PR creation/publication without explicit authorization.
Create release branches or merge into `main` only when release work is authorized.
Align unified manifest versions during release preparation, never incidentally.
