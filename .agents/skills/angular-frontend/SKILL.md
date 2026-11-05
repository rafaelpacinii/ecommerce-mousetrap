---
name: angular-frontend
description: "Implement or review MouseTrap Angular standalone components, routing, forms, HTTP services, models, session integration and customer/admin screens."
---

# Angular frontend

1. Read [policy](../../../AGENTS.md), [web setup](../../../web/README.md), relevant
   domain contracts and `TASK.md`. Inspect existing component/service/model/resolver
   patterns, `web/package.json` and the matching canonical SVG before editing.
2. Reuse standalone components, Material/CDK, Reactive Forms, functional resolvers
   and services/signals. Do not invent API endpoints, fields, role names or global
   state libraries. New contracts/backend/dependency changes need task authorization.
3. Keep HTTP and error mapping in services, validated forms in components and
   route preloading in resolvers. Preserve owned customer context, admin guards and
   API authority. Card fields never enter requests, local storage or logs.
4. Implement loading/success/empty/error/retry states, duplicate-submit prevention,
   accessible validation and navigation/focus behavior. Use `ui-frontend` when
   visual design is the task; preserve the approved hero and brand tokens.
5. Add meaningful component/service/route regression tests alongside behavior
   changes. Use `testes-frontend` for fixtures and observable assertions.
6. Run `python3 scripts/ai_checks.py verify --scope web`, then `cd web && npm run build`
   for production/template validation. Use disposable E2E for integrated flows;
   document real results and pending prerequisites in `TASK.md`.
