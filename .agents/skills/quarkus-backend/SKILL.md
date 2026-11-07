---
name: quarkus-backend
description: "Implement or review MouseTrap Java/Quarkus Resources, Services, Repositories, record DTOs, HTTP contracts and transactional business behavior."
---

# Quarkus backend

1. Read [policy](../../../AGENTS.md), [business rules](../../../docs/BUSINESS_RULES.md),
   [3NF models](../../../docs/modelagem/README.md), [conventions](../../../docs/CONVENTIONS.md),
   relevant domain docs and `TASK.md`. Inspect `api/pom.xml`, the affected
   Resource/Service/Repository/DTO chain and neighboring tests before editing.
2. Identify approved `BR-*` invariants and unresolved domain decisions; never relax
   or alter a business rule without explicit user approval. Preserve Java 17,
   Quarkus-managed versions and existing endpoint paths; do not invent fields,
   entities or cross-module contracts. Ask only for genuinely new decisions.
3. Keep Resource → Service interface/implementation → Panache Repository → Entity.
   Use validated input records, output records/mappers and `Problem` error details;
   never return JPA entities. Put atomic writes and business rules in services.
4. Verify `@RolesAllowed`, JWT subject ownership, input bounds and association
   ownership. This project has no tenants: cross-customer isolation is the actual
   security boundary. Do not introduce tenant requirements from generic prompts.
5. Add behavior tests for changed success/error/authorization paths. Use
   `testes-backend` for test design and `db-migration-safe` for approved schema work.
   Routine authorization to implement does not authorize breaking existing contracts.
6. Run `python3 scripts/ai_checks.py verify --scope api` with the isolated test
   database. Use full clean verify when packaging/persistence warrants it; update
   `TASK.md` with actual commands, results and blocked prerequisites.
