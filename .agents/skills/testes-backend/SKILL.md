---
name: testes-backend
description: "Create, review or run deterministic MouseTrap Quarkus/JUnit/REST Assured tests for API behavior, persistence, authorization, ownership and checkout concurrency."
---

# Backend tests

1. Read [policy](../../../AGENTS.md), [API test setup](../../../api/README.md),
   `api/src/test/`, relevant business docs and the failing/changed behavior.
   Follow existing JUnit/REST Assured/security fixtures rather than adding a framework.
2. Use the configured isolated PostgreSQL 16 on `localhost:55439`. Dev Services
   is disabled; do not assume it creates a database. Never point tests at normal
   application data. Keep destructive fixture cleanup inside the test database.
3. Select observable cases: valid response, validation boundary, missing identity,
   insufficient role, another customer's ID, invalid association and conflict.
   Checkout cases include stale price, last-stock concurrency, idempotent retries,
   cancellation/expiry restoration and immutable snapshots/history.
4. Use bounded deterministic synchronization for concurrency tests; avoid arbitrary
   sleeps and reliance on test order. Mock external HTTP/object storage at the
   established boundary; real PostgreSQL behavior should not be replaced with H2.
5. Run focused tests in `api/` with `./mvnw -B -Prelease -Dtest=ClassName test`,
   substituting a class actually found in the repository. Then run the affected
   suite through `python3 scripts/ai_checks.py verify --scope api`.
6. Record command, counts, failures and missing prerequisites in `TASK.md`.
   Failsafe tests are skipped by `skipITs=true`; do not count them as executed.
   Never remove failing tests or claim coverage/pass results without execution.
