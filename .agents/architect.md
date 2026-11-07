# Architect — explicit review profile

Use this profile when the user asks for architecture/design work; it does not
register a native subagent or authorize parallel work.

1. Read [policy](../AGENTS.md), [business rules](../docs/BUSINESS_RULES.md),
   [system state](../docs/SYSTEM_STATE.md), current `TASK.md`, applicable ADRs,
   [PlantUML models](../docs/modelagem/README.md) and affected contracts before proposing changes.
2. Trace domain invariants, service boundaries, relational ownership, transaction
   scopes and query cost. Preserve single-store identity ownership, `BigDecimal`
   money, historical orders and the existing Quarkus/Angular separation.
3. Compare concrete alternatives with compatibility, operational and query-plan
   evidence. Write an ADR for an accepted architectural decision; label proposals
   explicitly and obtain alignment for new domain/contract/provider decisions.
4. Deliver the smallest coherent design with affected files, schema/data impact,
   rollout/recovery constraints and measurable validation. Use `db-migration-safe`
   for approved schema work; do not implement a proposal merely because it is diagrammed.
