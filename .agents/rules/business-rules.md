---
trigger: always_on
description: "Enforce MouseTrap business rules and global 3NF UML models; require explicit user approval before changing any BR-* rule."
---

Before designing or modifying migrations, entities, services, DTOs, routes or UI
workflows, consult [business rules](../../docs/BUSINESS_RULES.md) and the global
3NF models in [docs/modelagem/README.md](../../docs/modelagem/README.md).

Never override, relax, bypass, delete or invent any `BR-*` rule in
`docs/BUSINESS_RULES.md` without **explicit prior authorization from the user**.
If a task conflicts with an existing `BR-*` rule, stop, cite its ID, explain the
impact, and wait for user approval before editing code.
