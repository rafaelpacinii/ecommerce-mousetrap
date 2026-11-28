---
trigger: model_decision
description: "Use when preparing an academic source ZIP or reviewing submission exclusions."
---

Follow [packaging profile](../../.github/agents/packager-agent.md) and
[root policy](../../AGENTS.md). Execute `scripts/package_release.py` to generate a dated
`dist/mousetrap_submission_YYYY-MM-DD.zip` and automatically remove undated ZIPs.
