# Authentication, authorization and account ownership

The third implementation slice uses Keycloak for credentials, verification,
password recovery and sessions. Angular never collects or stores passwords.
Quarkus validates bearer access tokens and enforces authorization independently
of the frontend. Realm role names are `admin` and `customer`; an administrator
may also maintain a shopping profile.

## Local identity stack

Run from the repository root using fish. Choose a local bootstrap password;
do not commit it or reuse a production credential.

```fish
read --silent --prompt-str 'Local Keycloak admin password: ' KC_BOOTSTRAP_ADMIN_PASSWORD
set -gx KC_BOOTSTRAP_ADMIN_PASSWORD $KC_BOOTSTRAP_ADMIN_PASSWORD
docker compose -f infra/identity/compose.yaml up -d
```

Keycloak is at `http://localhost:8180`; Mailpit is at `http://localhost:8025`.
Both bind to loopback. Keycloak persists its development data in a named Docker
volume and imports `mousetrap-realm.json` on first startup. Import skips an
existing realm: later configuration changes must be applied deliberately through
the admin console, not assumed to overwrite existing data. Restarting with a new
bootstrap password does not change an existing administrator's password.

The bootstrap username defaults to `admin`. Use the console to establish a
permanent administrator and manage users. To authorize an application operator,
create a user in the **mousetrap** realm, confirm their email, set a password,
then assign the **admin** realm role. An administrator of the Keycloak **master**
realm does not automatically have access to the store's administrative screens.
Public registration assigns `customer` and never `admin`.

Mailpit captures local confirmation and recovery messages. Its SMTP service is
available only to the Compose network. No real email delivery provider is
configured. Use the Mailpit inbox to open links during local development.

Start the API and SPA after the identity stack is ready:

```fish
cd api
./mvnw quarkus:dev
```

```fish
cd web
npm ci
npm start
```

Restart existing development processes after installing the new dependencies.
Keep the isolated PostgreSQL test container running when using continuous tests;
see [API test setup](../api/README.md#testes).

## Configuration and protocol

- `mousetrap-web` is a public SPA client. Authorization Code with S256 PKCE is
  required. Implicit flow, password grants and service accounts are disabled.
- The allowed SPA redirects are the exact local `/auth/callback` and
  `/silent-check-sso.html` URLs on port 4200. Logout returns to the storefront.
- The default `basic` scope supplies the token subject; it must not be removed.
  Access tokens contain the `mousetrap-api` audience. The API checks issuer,
  signature, expiration and audience, and reads roles from `realm_access/roles`.
  It does not accept opaque tokens or fall back to JWT introspection.
- Tokens remain in adapter memory. Session storage contains only a validated
  internal return path; access/refresh tokens are never persisted there.
- The interceptor refreshes access tokens before protected API requests and
  sends them only to the configured API origin and path. Public catalog and CEP
  reads do not require a token. A 401 clears the local session and opens login
  without replaying a write. A 403 does not trigger a login loop.
- Silent SSO checks restore sessions where browser cookie policy permits.
  Tracking protection can prevent silent restoration; explicit login still
  works. Failed identity initialization displays a retry on the login page while
  leaving public navigation available.

`web/public/config.json` configures the API and identity URLs at runtime. Every
HTTP service uses `APP_SETTINGS`; a new frontend build is not required to change
these URLs. This file is public and must never contain credentials. On the API,
`OIDC_AUTH_SERVER_URL` overrides the checked-in local OIDC defaults.

## Navigation and authorization contracts

| Endpoint / screen                                                        | Access                                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `GET /catalogo/mouses`, `/catalogo/mouses/{id}`, `/catalogo/filtros`     | Public                                                              |
| `GET /ceps/{cep}`                                                        | Public                                                              |
| `/mouses/**`, `/marcas/**`, administrative `/clientes/**` API operations | `admin`                                                             |
| `GET /clientes/me`, `PUT /clientes/me`                                   | `customer` or `admin`                                               |
| `PUT /clientes/{id}/identidade`                                          | `admin`, after reviewing the legacy customer and confirmed identity |
| `/admin/mouses`, `/admin/marcas`, `/admin/clientes` and their forms      | Admin guard plus API authorization                                  |
| `/meus-dados`, `/enderecos`                                                           | Authenticated profile and delivery address                          |
| `/login`, `/cadastro`, `/auth/callback`                                  | Unified account entry and callback                                  |

Administrative API read payloads include inactive records and are now protected
along with writes. Anonymous clients must use `/catalogo/**`. Existing API paths
and DTO shapes are retained; their access requirements intentionally change in
this authentication slice. Old frontend CRUD paths redirect to `/admin/**`,
including create/edit links. Guards run before edit resolvers load private data.
Administrators now land at `/admin/pedidos` for the implemented order-management dashboard;
customers return to the storefront or their saved intended destination.

The login and registration entry cards follow wireframes 07/08. Credential,
verification and recovery forms are hosted by Keycloak with the MouseTrap theme
and original SVG mark. Registration proceeds through identity verification and
then the owned profile/address form. Password reset uses the login form's
forgot-password link and the configured email delivery service. No duplicate
password database or password-grant endpoint is introduced.

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
