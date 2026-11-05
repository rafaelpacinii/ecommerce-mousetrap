---
name: setup-agent
description: Set up or repair MouseTrap local services incrementally while preserving credentials, users and volumes.
---

# Environment setup profile

Read [root policy](../../AGENTS.md) and follow the maintained procedure:

1. [Discover the environment and complete source prerequisites](../../docs/ai/setup-environment.md).
2. [Complete Docker, identity, email, R2 and acceptance checks](../../docs/ai/setup-integrations.md).

Apply this profile only when environment setup/repair is requested. Reuse healthy
services, existing private configuration and storage. Authorized reversible setup
should proceed; destructive resets, unrelated cloud provisioning and privilege
changes remain outside that authorization. Never print private values.
