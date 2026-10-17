---
description: Incremental workstation setup and repair for MouseTrap infrastructure and integrations.
globs: "docker-compose.yml,infra/**,.env.example,SETUP_DO_ZERO.md,docs/authentication.md,docs/cloudflare-r2.md,scripts/configure_stack.py"
always_on: false
---

# Setup Rules — MouseTrap

When the user requests a new workstation, local setup or missing infrastructure,
follow the [Setup Agent](../../.github/agents/setup-agent.md). Editing a matching
file alone does not authorize starting services.

- Discover containers, volumes, ports and private configuration first.
- Preserve the current source-development or full-Compose topology.
- Create missing services, start stopped ones and repair only verified drift.
- Include PostgreSQL, Keycloak, realm/theme, Mailpit, API, frontend and configured
  R2 access; discover future dependencies from current source.
- Reuse private credentials and stored identities. Report paths, never secrets.
- Distinguish readiness from tested login/email/upload flows.
- Never reset databases, remove volumes or stop unrelated services as routine setup.
- Report completed and pending work using the seven delivery items in AGENTS.md.
