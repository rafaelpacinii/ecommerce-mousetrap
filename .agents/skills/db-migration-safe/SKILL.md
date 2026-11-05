---
name: db-migration-safe
description: "Plan and validate backward-compatible Flyway schema changes for MouseTrap PostgreSQL, including data effects, indexes, rollout and recovery. Use when a task changes schema."
---

# Safe database migration

1. Read [policy](../../../AGENTS.md), [ADRs](../../../docs/adr/0001-record-architecture-decisions.md),
   [API setup](../../../api/README.md), current entities/repositories and both
   `api/docs/modelagem/` PlantUML files. Resolve new domain decisions before SQL.
2. Enumerate `api/src/main/resources/db/migration/`; choose the next free version
   (V1–V8 currently exist). Never edit an applied migration to fix a new requirement.
   Changing existing migration history requires explicit authorization.
3. Describe old/new reader/writer compatibility, null/default/backfill behavior,
   foreign keys, unique/check constraints, index/query justification and table-lock
   risk. Use expand → backfill → constrain/contract for incompatible deployments.
4. Create incremental SQL and matching entity/DTO/service changes only within the
   approved task. Preserve historical orders, subject ownership and atomic stock
   changes. Do not invent a tenant column or attach unrelated records.
5. Test a fresh schema and an upgrade from the prior version on disposable
   PostgreSQL 16. Run the relevant API tests and `./mvnw -B -Prelease clean verify`
   in `api/`. Exercise existing data and constraint/concurrency failures.
6. Record a deployment backup/restore plan and any forward corrective migration.
   PostgreSQL DDL rollback is not a substitute for recovering transformed data.
   Do not advertise an untested down migration or run Flyway clean.
7. Update `TASK.md`, system inventory, UML when affected, and the delivery report's
   database section with migration names, data effects, actual checks and recovery
   limits. Never test against the user's development/production database.
