---
name: uml-classes
description: "Create or reconcile MouseTrap PlantUML class/database diagrams with approved domain rules and implemented JPA mappings. Use for modeling or diagram reviews."
---

# UML class modeling

1. Read [policy](../../../AGENTS.md), [business rules](../../../docs/BUSINESS_RULES.md),
   relevant domain docs and [global modeling](../../../docs/modelagem/README.md).
   Compare `docs/modelagem/diagrama-de-classes.puml` and `docs/modelagem/banco-de-dados.puml`
   with actual `api/src/main/java/br/unitins/tp2/model/`.
2. Check private attributes, coherent Java/SQL types, `DefaultEntity` inheritance,
   multiplicities, enum converters and composition/aggregation against lifecycle.
   Represent actual customer ownership; do not insert tenant relationships.
3. Separate implemented facts, an approved planned model and unresolved proposals.
   Explain every material diagram/code divergence and its source of evidence.
4. Update diagrams within the authorized modeling scope. A diagram edit does not
   authorize entity/DTO changes, migration creation, data backfill or domain rules.
5. Render using an already available local PlantUML tool if installed; otherwise
   report rendering as unexecuted. Check syntax, references and affected Markdown
   links. Do not upload private diagrams to a public renderer as a workaround.
6. Record what changed, unresolved discrepancies and actual validation in `TASK.md`;
   use `db-migration-safe` only when implementation/schema work is separately in scope.
