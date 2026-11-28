# Authentication, authorization and account ownership

MouseTrap uses Keycloak for credentials, token issuance and sessions, with all
identity communication centralized in the Quarkus backend ([ADR 0007](../adr/0007-backend-mediated-keycloak-auth.md)).
Angular communicates exclusively with the Quarkus REST API (`apiUrl`), never calls
Keycloak directly, and never stores passwords or tokens in `localStorage`.
PostgreSQL never stores user passwords. Realm role names are `admin` and `customer`;
an administrator may also maintain a shopping profile.

## Local identity stack

Run from the repository root using fish. Choose a local bootstrap password;
do not commit it or reuse a production credential.

```fish
read --silent --prompt-str 'Local Keycloak admin password: ' KC_BOOTSTRAP_ADMIN_PASSWORD
set -gx KC_BOOTSTRAP_ADMIN_PASSWORD $KC_BOOTSTRAP_ADMIN_PASSWORD
docker compose -f infra/identity/compose.yaml up -d
```

Keycloak runs at `http://localhost:8180` (backend-only); Mailpit runs at
`http://localhost:8025`. Keycloak imports `mousetrap-realm.json` on first startup,
provisioning realm `mousetrap`, resource audience `mousetrap-api`, and confidential
backend client `mousetrap-backend` (service account with `manage-users` in
`realm-management`). Copy the generated `mousetrap-backend` client secret from the
Keycloak Admin Console into your local `KEYCLOAK_CLIENT_SECRET` (or `application.properties`).
For disposable Docker rehearsal (`scripts/configure_stack.py` / `scripts/verify_release.sh`),
a fresh `IDENTITY_CLIENT_SECRET` is generated and injected automatically.

## Configuration and protocol

- `mousetrap-backend` is a confidential client (`publicClient = false`,
  `directAccessGrantsEnabled = true`, `serviceAccountsEnabled = true`) used only by Quarkus.
- Access tokens carry the `mousetrap-api` audience. Quarkus validates issuer,
  signature, expiration and audience, and reads roles from `realm_access/roles`.
- Angular holds only the short-lived `accessToken` in runtime memory (`AuthService`).
  Quarkus stores the refresh token in an `HttpOnly; SameSite=Lax; Path=/auth` cookie
  (`mousetrap_refresh`) used by `POST /auth/refresh` and revoked by `POST /auth/logout`.
- `web/public/config.json` exposes only `apiUrl`. No Keycloak URL, realm, client ID,
  or credential is exposed to the browser.
- `authInterceptor` attaches `Authorization: Bearer` exclusively to protected requests
  matching `apiUrl`, refreshes expiring tokens via `/auth/refresh`, clears local state
  and redirects to `/login` on `401`, and avoids login loops on `403`.

## Navigation and authorization contracts

| Endpoint / screen | Access |
| --- | --- |
| `POST /auth/login`, `POST /auth/cadastro`, `POST /auth/refresh`, `POST /auth/logout` | Public (`@PermitAll`, mediated by Quarkus) |
| `GET /auth/me` | `customer` or `admin` |
| `GET /catalogo/mouses`, `/catalogo/mouses/{id}`, `/catalogo/filtros`, `/ceps/**`, `/localidades/**` | Public |
| `/mouses/**`, `/marcas/**`, `/imagens/**`, `/admin/pedidos/**`, administrative `/clientes/**` | `admin` |
| `GET /clientes/me`, `PUT /clientes/me`, `/clientes/me/enderecos/**`, `/desejos/**`, `/pedidos/**` | `customer` or `admin` |
| `/admin/**` | `adminGuard` plus backend `@RolesAllowed("admin")` |
| `/meus-dados`, `/enderecos`, `/meus-pedidos`, `/lista-de-desejos`, `/checkout` | `authGuard` plus backend JWT ownership |
| `/login`, `/cadastro`, `/acesso-negado` | Native Angular forms and role denial screen |

## Customer profile and migration V4

V4 adds nullable, unique `cliente.identidade_subject`. Existing rows and addresses
remain intact and unclaimed. Never infer ownership by matching an email: an
existing legacy record requires administrative review before any identity
association or email conflict is resolved. V1/V2/V3 are unchanged.

### Linking a reviewed legacy customer

A legacy customer can already have the same email as a registered identity while
`identidade_subject` is still null. In that case `/clientes/me` returns 404 and
profile creation must not insert a duplicate customer. Saving now explains that
administrative linking is required, rather than reporting a generic duplicate
email error.

After verifying the enabled identity and its confirmed email in the configured
identity provider, an authorized administrator can call
`PUT /clientes/{id}/identidade` with:

```json
{
  "identidadeSubject": "reviewed-user-subject",
  "email": "customer@example.com"
}
```

The supplied email must match the existing customer. The operation returns 200,
keeps the same customer ID, personal data and saved addresses, and is idempotent
for the same link. It rejects replacing an existing owner or binding an identity
already assigned to another customer. Row locking and the existing unique subject
constraint protect concurrent attempts. Customers and anonymous callers cannot
use this operation. No migration or automatic email-based claiming is introduced.

After linking, reload `/meus-dados`: profile updates and new addresses use the
existing customer. Do not delete a customer or change their email to bypass this
conflict, because that would lose or detach their existing data.

`GET /clientes/me` returns only the row identified by the verified token subject,
or 404 when the customer has not completed a local profile. `PUT /clientes/me`
creates or updates that same profile (200), validating address data through the
existing CEP service. The request fields are `nome`, `cep`, `logradouro`,
`bairro`, `numero`, and optional `complemento`. Email comes exclusively from a
verified token; no customer ID or subject is accepted from the caller. Unique
database constraints also protect concurrent first-time provisioning.

Email and credentials are managed through the identity provider's account page.
An administrator cannot change an owned profile's email through the legacy CRUD.
The profile retains legacy principal-address fields for API compatibility. V5
provides multiple saved addresses. The account UI separates **Meus dados** at
`/meus-dados` from **Endereços** at `/enderecos`, while the
shared customer sidebar remains available across account, order and wishlist
screens. Initial registration still requires both name and address under the
existing profile DTO. See [the customer portal](customer-portal-admin-orders.md).

## Tests and deployment limits

Backend authorization tests use Quarkus test identities and OIDC claims; they
require PostgreSQL but not a running identity server. They cover public access,
401/403 boundaries, admin CRUD, subject ownership, verified email, legacy email
collision, and stable profile updates. These fixtures are test-scoped; they do
not disable production security. Frontend tests cover refresh, token isolation,
expiration, return URL validation, guards, legacy redirects and self-service.

The Compose stack is for local development: H2, HTTP, a bootstrap administrator
and captured email. Production requires HTTPS, persistent identity storage,
production SMTP, exact deployed redirects/origins, API CORS alignment and secret
management. Do not expose the local Mailpit inbox publicly.

Primary references: [Keycloak JavaScript adapter](https://www.keycloak.org/securing-apps/javascript-adapter),
[Quarkus bearer authentication](https://quarkus.io/guides/security-oidc-bearer-token-authentication/),
and [Keycloak Docker setup](https://www.keycloak.org/getting-started/getting-started-docker).

## Validation record

- `cd api; ./mvnw verify -Dquarkus.http.test-port=18081`: **24 tests passed**. Authorization and
  existing catalog/customer/CEP checks use isolated PostgreSQL on port 55439.
  Failsafe retains its existing `skipITs=true`; HTTP tests run through Surefire.
- `cd web; npm test -- --watch=false`: **52 tests passed across 14 files**,
  covering session, interceptors, guards, self-service,
  redirects, catalog/gallery and existing CRUD coverage.
- `cd web; npm run build`: production bundle and component-style budgets.
- Live Chromium QA used the production SPA, the packaged API, PostgreSQL,
  Keycloak and Mailpit. Only the public runtime API URL and temporary local
  preview redirects were adjusted for the QA environment; no domain or identity
  responses were replaced with fixtures.
- Verified registration, email confirmation, password setup, real CEP lookup,
  profile creation/update/read, SSO restoration, logout, recovery email,
  password reset and subsequent login with the new password.
- Verified customer denial, role-aware admin landing and the three admin lists;
  tampered signatures, wrong issuer/audience and expired tokens were rejected.
  Temporary token-test clients and all QA customer/admin identities were removed.
- Account/identity layouts passed at 1440, 768, 375 and 320 px; the admin shell also
  passed at 1024 px. A visual review checked the branded login card after its
  responsive sizing correction. Preview redirects were restored to port 4200.
- `npm audit --omit=dev` reports one existing high-severity advisory in
  `@angular/router` 22.1.6, concerning SSR numeric URL matrix parameters. This
  application builds a browser-only SPA. The adapter added in this slice has no
  production audit finding; framework dependency updates remain a separate task.
