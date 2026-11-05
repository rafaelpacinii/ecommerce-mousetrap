---
trigger: glob
globs: "**/*.md, docs/**"
description: "Keep MouseTrap documentation in English and grounded in implemented source."
---

Follow [root policy](../../AGENTS.md) and [conventions](../../docs/CONVENTIONS.md).
Verify contracts against code; distinguish implemented, planned and unverified
behavior in [system state](../../docs/SYSTEM_STATE.md). Do not alter application
code for a documentation-only task. Keep AI entrypoints within 180 lines.
