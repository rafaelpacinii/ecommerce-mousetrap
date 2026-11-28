# ADR 0007 — Backend-mediated Keycloak authentication and registration

- Accepted on 2026-11-28
- Updates identity flow for `BR-IAM-02`, `BR-IAM-06`, and `BR-IAM-09` (authorized by the user on 2026-11-28).

## Context

Academic evaluation requirements mandate that the Angular frontend must communicate
exclusively with the Quarkus REST API and never issue direct HTTP calls to Keycloak
or embed Keycloak client/administrative configuration. User sign-in, self-service
registration, session inspection, token renewal, and logout must be mediated by
Quarkus while keeping OAuth 2.0 / OpenID Connect (OIDC) JWT validation, role-based
authorization (`admin` and `customer`), Angular `HttpInterceptor` + route guards,
and zero password persistence in PostgreSQL.

## Decision

1. **Remove browser-to-Keycloak coupling:** Retire `keycloak-js`, `/silent-check-sso.html`,
   and `identityUrl`/`realm`/`clientId` from `web/public/config.json`. Angular knows
   only `apiUrl` and renders native Reactive Forms on `/login` and `/cadastro`.
2. **Confidential backend OIDC client (`mousetrap-backend`):** Quarkus communicates
   server-to-server with Keycloak using `mousetrap-backend` (`publicClient = false`,
   `directAccessGrantsEnabled = true`, `serviceAccountsEnabled = true`, audience mapper
   `mousetrap-api`, and `realm-management` user-provisioning roles on its service account).
   Client secrets and optional fallback admin credentials stay strictly in backend
   environment/configuration variables.
3. **Quarkus `/auth` endpoints:**
   - `POST /auth/login`: exchanges credentials via Keycloak's OIDC token endpoint,
     verifies allowed realm roles (`customer`/`admin`) and local account status, sets
     the refresh token in an `HttpOnly; SameSite=Lax; Path=/auth` cookie
     (`mousetrap_refresh`), and returns the short-lived JWT `accessToken` + user summary.
   - `POST /auth/cadastro`: validates personal (and optional delivery address) fields,
     rejects pre-existing local emails (`BR-IAM-07`), provisions the Keycloak user
     (`enabled = true`, `emailVerified = true`, role `customer`) without storing any
     password in PostgreSQL, creates the linked `Cliente` record (compensating in
     Keycloak if local persistence fails), and opens an authenticated session.
   - `POST /auth/refresh`: validates browser origin when present, exchanges the
     `mousetrap_refresh` `HttpOnly` cookie at Keycloak, rotates the cookie, and returns
     a fresh `accessToken` + user summary for seamless page reloads.
   - `GET /auth/me`: returns the authenticated user's verified `sub`, name, email,
     roles, and profile completion state under `@RolesAllowed({"customer", "admin"})`.
   - `POST /auth/logout`: revokes the refresh session at Keycloak's OIDC logout endpoint
     and clears the `mousetrap_refresh` cookie (`Max-Age=0`).
4. **Unchanged resource-server & SPA boundaries:** Quarkus continues validating JWT
   issuer, signature, expiration, `mousetrap-api` audience, `realm_access/roles`, and
   strict `sub` ownership (`BR-IAM-04`, `BR-IAM-05`). Angular keeps `accessToken`
   exclusively in memory, attaches `Authorization: Bearer` only to `apiUrl` via
   `authInterceptor`, handles `401`/`403` distinctly, and enforces `authGuard` and
   `adminGuard`.

## Consequences

- Angular makes zero network requests to port `8180` or Keycloak endpoints.
- Newly registered shoppers can sign in immediately during grading without Mailpit,
  while `email_verified == true` and zero-password PostgreSQL invariants remain intact.
- Refresh tokens never enter JavaScript memory, `localStorage`, or `sessionStorage`.
