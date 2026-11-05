---
name: testes-frontend
description: "Create, review or execute MouseTrap Angular/Vitest and Playwright tests for components, HTTP services, forms, guards, sessions and purchase regressions."
---

# Frontend tests

1. Read [policy](../../../AGENTS.md), `web/src/**/*.spec.ts`,
   `web/e2e/purchase.spec.ts` and `web/playwright.config.ts`. Follow the configured
   Angular/Vitest setup; do not introduce Jasmine/Karma or another test framework.
2. Assert rendered state and user interactions: valid/invalid forms, HTTP requests,
   load/empty/error/retry, navigation, roles, expired sessions and duplicate-submit
   prevention. Do not mirror private implementation or assert generated wording.
3. Use controlled HTTP/identity fixtures for unit tests; restore mocks between
   tests. Never store real tokens, card fields, passwords or personal data in fixtures.
4. Checkout regressions cover cart reconciliation, stale price/stock, idempotent
   retries, address ownership, pending payments and card-data non-transmission.
   Match actual application behavior; no invented webhooks or organizations.
5. Run `python3 scripts/ai_checks.py verify --scope web`. For focused tests, inspect
   installed `ng test --help` before choosing supported filters. Run production
   build for templates, and `sh scripts/verify_release.sh` for disposable live E2E.
6. Browser config disables trace/video/screenshots to avoid credential capture.
   Keep those safeguards. State which tests use fixtures versus actual API/SSO;
   record commands, counts, failures/skips in `TASK.md`. Do not delete failing
   tests or claim coverage/Axe results without an actual run.
