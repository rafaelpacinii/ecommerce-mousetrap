---
name: persistencia-postgresql
description: "Implement or review MouseTrap JPA mappings, Panache repositories, PostgreSQL queries, constraints, indexes and concurrency. Use for persistence changes; schema execution follows db-migration-safe."
---

# PostgreSQL persistence

1. Read [policy](../../../AGENTS.md), [conventions](../../../docs/CONVENTIONS.md),
   `api/docs/modelagem/diagrama-de-classes.puml`,
   `api/docs/modelagem/banco-de-dados.puml`, affected entities and repository queries.
   Compare actual mappings with the diagram; do not treat a proposed diagram as SQL.
2. Preserve `DefaultEntity`, private attributes/accessors, Portuguese names,
   relationship cardinalities, integer enum converters and domain constraints.
   Check foreign-key ownership and historical order dependencies before deletes.
3. Use `@ApplicationScoped` Panache repositories, bound query parameters and
   bounded paging/whitelisted sorting. Inspect N+1 behavior and representative query
   plans before adding joins/indexes; do not index every column speculatively.
4. Keep price math in `BigDecimal`. Preserve transaction boundaries, stock row
   locks, optimistic versions, idempotency keys and deadlock-safe locking order.
   Test simultaneous writers and rollback/constraint behavior, not just happy reads.
5. Apply identity-subject scoping where customer data is queried. There is no
   tenant schema; reject cross-customer associations without inventing one.
6. New domain/cardinality/retention decisions need alignment unless already
   authorized. For approved schema changes, use `db-migration-safe`; never edit
   V1–V8 or recreate a user's database as a shortcut.
7. Run the relevant real-PostgreSQL tests via
   `python3 scripts/ai_checks.py verify --scope api`; record evidence in `TASK.md`
   and update UML only when the implemented model actually changes.
