---
trigger: model_decision
description: "Use when preparing an academic source ZIP or reviewing submission exclusions."
---

Follow [packaging profile](../../.github/agents/packager-agent.md) and
[root policy](../../AGENTS.md). Execute the existing `scripts/package_release.py`;
verify exclusions, integrity and actual metrics. Do not package secrets or builds.
