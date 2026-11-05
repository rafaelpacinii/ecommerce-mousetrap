---
name: seguranca-frontend-oidc
description: "Implement or review MouseTrap browser OIDC login/logout, PKCE callbacks, session expiry, route guards and controlled bearer-token forwarding."
---

# Frontend OIDC security

1. Read [authentication](../../../docs/others/authentication.md), [policy](../../../AGENTS.md),
   existing auth service/guards/interceptor, `web/public/config.json`, runtime config
   loader and public realm definition. Never open private credentials to discover URLs.
2. Preserve Authorization Code with PKCE S256, public client `mousetrap-web` and
   realm `mousetrap`. No browser client secret; no invented issuer/scopes/endpoints.
3. Keep token handling minimal and session cleanup explicit. Forward bearer tokens
   only to the configured API origin/path boundary, never ViaCEP, image URLs or
   third-party destinations. Preserve safe return URLs and logout destinations.
4. Test callback/login/logout, session expiry, failed refresh, missing identity,
   401/403, insufficient role and attempted admin navigation. Do not create an
   organization/profile selector: the application has no tenant context.
5. Treat backend roles and ownership as final. UI access checks cannot grant a
   role, approve a payment or attach another customer's address/order.
6. Never log tokens/credentials or persist them in local storage to simplify a
   test. Use safe fixtures, web checks and real disposable PKCE E2E when needed.
   Record actual evidence and provider-dependent gaps in `TASK.md`.
