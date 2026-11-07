---
name: security-and-payment-audit
description: "Audit MouseTrap identity, ownership, checkout, stock and simulated payments for concrete security regressions. Use for requested security/payment reviews and changes to those trust boundaries."
---

# Security and payment audit

1. Read [policy](../../../AGENTS.md), [business rules](../../../docs/BUSINESS_RULES.md),
   [authentication](../../../docs/others/authentication.md),
   [checkout](../../../docs/others/transactional-checkout.md),
   [order operations](../../../docs/others/customer-portal-admin-orders.md) and the actual
   Resources, Services and exception mappers. Inventory routes and permissions.
2. Verify public catalog access and admin/customer denial paths. Trace JWT
   issuer/audience/subject into profile, address, order and wishlist ownership.
   Test one identity attempting another customer's IDs, including nested resources.
3. Trace API-calculated prices/freight/totals and order snapshots. Exercise stale
   client prices, invalid quantities, concurrent last-item checkout, reused
   idempotency keys with changed payloads and retries after a network failure.
4. Check payment decisions require admin authority; customers cannot approve
   payment. Retry/cancel/expire must restore stock at most once, preserve history
   and reject illegal transitions. Card number/CVV never leave browser memory.
5. Inspect input bounds, sort allowlists, parameterized queries, safe error output,
   CORS, token forwarding, upload validation and logs without opening private files.
   Use adversarial fixtures rather than real credentials or customer data.
6. Record **live provider/webhooks absent**. Do not fabricate webhook coverage.
   If a separately approved integration is later added, audit signature, raw-body
   validation, event idempotency, replay/out-of-order delivery and reconciliation.
7. Run relevant API/web checks and disposable browser verification when feasible.
   Report findings with severity, file/line, trigger, impact, evidence and a scoped
   fix. Distinguish confirmed failures, unverified hypotheses and absent features.
   Record commands and blocked prerequisites in `TASK.md`; no publication or live
   financial/identity mutations are authorized by invoking this skill.
