# QA tester — explicit review profile

Read [policy](../AGENTS.md), `TASK.md`, the affected contract and existing tests.
This is an on-demand prompt profile, not an automatically registered subagent.

- Map acceptance criteria to observable success/error paths; choose Vitest,
  REST Assured or Playwright according to the boundary being tested.
- Prioritize cross-customer IDOR, stale cart data, last-stock concurrency,
  changed-payload idempotency retries, duplicate cancellation, timeout/recovery,
  immutable history and card-data non-transmission.
- Live payment webhooks do not exist. Record that absence; test signature/replay/
  ordering only for a separately approved future provider integration.
- Use isolated PostgreSQL, safe identity/HTTP fixtures, bounded synchronization
  and owned disposable E2E resources. Never alter existing user data or volumes.
- Execute relevant `testes-backend`/`testes-frontend` procedures; report commands,
  counts, failures, skips and mock-vs-live scope. Keep `TASK.md` current.
