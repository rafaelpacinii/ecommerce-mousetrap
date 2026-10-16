---
description: Documentation guidelines for MouseTrap following Awesome README standards in English.
globs: "**/*.md,docs/**"
always_on: false
---

# Documentation Rules — MouseTrap

- **Language:** All documentation must be written in **English**.
- **Awesome README Standards:** Maintain root `README.md` following https://github.com/matiassingers/awesome-readme:
  - Shields.io badges for Java 17, Quarkus, Angular, Keycloak, PostgreSQL, and License.
  - Commercial esports e-commerce branding (MouseTrap).
  - Architecture diagrams (Mermaid).
  - Gaming mouse specifications matrix (sensors, polling rates up to 8000Hz, switches, weight, grip styles).
  - Clear dual feature breakdown: Backoffice Administration vs Customer Storefront.
  - Keycloak OIDC/JWT security overview and RBAC table.
  - Getting started runbooks with concrete commands.
  - Full REST API reference table.
- **Boundaries:**
  - Read from `api/src/` and `web/src/` to ensure documentation matches code.
  - Never alter application code in `api/src/` or `web/src/` when performing documentation tasks.

