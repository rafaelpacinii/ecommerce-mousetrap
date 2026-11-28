---
name: seguranca-frontend-oidc
description: "Implement or review MouseTrap Angular backend-mediated login/registration/logout, in-memory session state, route guards and controlled bearer-token forwarding."
---

# Frontend OIDC security

1. Read [authentication](../../../docs/others/authentication.md), [policy](../../../AGENTS.md),
   existing auth service/guards/interceptor, `web/public/config.json`, runtime config
   loader and public realm definition. Never open private credentials to discover URLs.
2. Communicate exclusively with Quarkus (`/auth/*` on `apiUrl`); never call Keycloak
   directly from Angular or expose Keycloak URLs/secrets in `config.json`.
3. Keep `accessToken` strictly in Angular memory and `mousetrap_refresh` in the API's
   `HttpOnly` cookie. Forward bearer tokens only to the configured API origin/path
   boundary, never ViaCEP, image URLs or third-party destinations.
4. Test login/registration/logout, session refresh, 401/403 handling, insufficient role
   and attempted admin navigation. Do not create an organization/profile selector:
   the application has no tenant context.
5. Treat backend roles and ownership as final. UI access checks cannot grant a
   role, approve a payment or attach another customer's address/order.
6. Never log tokens/credentials or persist them in `localStorage` to simplify a
   test. Use safe fixtures, web checks and disposable E2E when needed.
   Record actual evidence and provider-dependent gaps in `TASK.md`.
