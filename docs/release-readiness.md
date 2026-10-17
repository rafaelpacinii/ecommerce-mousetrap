# Release readiness — slice 7

This slice completes the engineering checklist for the existing storefront and
administration. It does not add a live financial provider, refunds, carrier APIs,
image uploads or categories. The approved hero composition is preserved.

## Route metadata and indexing

`SeoService` supplies route descriptions, OpenGraph, Twitter card type, canonical
URLs and robots directives. Public home/catalog URLs are canonical without
query filters. Product data uses the API's name, SKU, brand, BRL price, actual
stock and ordered image URLs; unavailable products are noindex without stale
JSON-LD. Product scripts escape `<` and are removed when leaving the page.
Cart, checkout, authentication, profile, history, wishlist and administration use
noindex/nofollow with generic descriptions and no personal data in tags.

Canonical URLs use the served document origin and must be checked at the final
HTTPS hostname. The application is client rendered. JavaScript-capable crawlers
can read route tags; social crawlers that do not execute JavaScript receive the
default index metadata. Route-specific link previews/prerendering and a domain
sitemap require a later hosting decision; no fabricated production URL or
claim of server-rendered SEO is included. Robots directives do not replace
backend authorization. Nginx also supplies HTTP-level X-Robots-Tag on private paths, so the rule applies
before JavaScript executes. Preserve that header through a public reverse proxy.

## Images, fonts and accessibility

- The hero selects 768/1440/2400 WebP variants using srcset/sizes. Its explicit
  dimensions, decorative alternative and loading priority remain intact.
- Product images have descriptive API-managed alternatives, fixed dimensions,
  contain sizing, asynchronous decoding, below-fold lazy loading and an
  accessible failure state. External image URLs are not transformed by a CDN;
  operators should provide compressed images sized for display.
- Material Icons are bundled locally with their license. Text uses the system
  fallback when Inter is absent; neither build nor runtime requests Google Fonts.
- Global focus rings, the skip link, labeled controls, status/alert regions and
  non-destructive initial dialog focus are covered by browser tests. Reduced
  motion preferences disable decorative transitions/animations.
- The visual references remain [canonical SVG wireframes](ui-wireframes/README.md).
  Browser verification checks widths 1440, 1024, 768, 375 and 320 and Axe rules
  tagged WCAG 2 A/AA and 2.1 AA. Automated checks do not establish complete WCAG
  conformance; screen-reader usability and additional browsers remain manual QA.

Production bundle budgets fail the build above the configured thresholds.
Local unit/build/audit results and browser findings are recorded in the backlog; old slice results describe their original implementation dates.

## Deployment configuration

The root `docker-compose.yml` is a **local, loopback-only release rehearsal**:
SPA/Nginx, API, application PostgreSQL, identity PostgreSQL, Keycloak and Mailpit.
There are no hardcoded credentials or reused container names. The existing
`infra/identity/compose.yaml` remains an independent development alternative.
Do not run both stacks on the same ports.

`python3 scripts/configure_stack.py` creates an ignored `.local/<name>/stack.env`
(mode 0600) with independent passwords and a public realm definition containing
exact SPA origins/callbacks. It refuses to overwrite an environment. Import only
creates a realm when absent; use the console/admin API for subsequent updates.
Changing bootstrap environment variables does not reset stored identity users.
Keep the same private environment and database backups when moving an installation.

| Setting | Scope and behavior |
| --- | --- |
| `DATABASE_PASSWORD` | Application PostgreSQL secret; backend only |
| `IDENTITY_DATABASE_PASSWORD` | Identity PostgreSQL secret; identity only |
| `IDENTITY_ADMIN_PASSWORD` | First-start master console bootstrap secret |
| `PUBLIC_WEB_URL` | Exact CORS origin and realm redirect origin |
| `PUBLIC_API_URL` | Browser API base URL, public |
| `PUBLIC_IDENTITY_URL` | Browser identity URL and expected JWT issuer, public |
| `REALM_DIRECTORY` | Generated public realm import directory |
| `PAYMENT_DEMO_ENABLED` | Defaults false; explicit true enables local payment engine |
| `VIACEP_URL` | Real ViaCEP by default; test fixture only in the E2E overlay |

Public `config.json` contains only API/identity URLs, realm and SPA client ID.
Nginx generates it with JSON escaping at startup. It and index/SSO HTML are
revalidated; content-hashed bundles have long caching, other static files expire
after one day. Missing assets return 404 rather than HTML; direct Angular routes
fall back to index.html. Security headers disable MIME guessing, restrict framing,
limit referrer data and disable unused camera/microphone/geolocation access.

The API's `-Prelease` Maven profile excludes active `application.properties`.
Always run a **clean** release build to remove stale target resources. The Docker
context independently excludes local credentials. Flyway applies versioned
migrations at startup and Hibernate validates; no schema recreation/baseline is
enabled. Readiness `/q/health/ready` includes datasource checks; liveness is
`/q/health/live`. OIDC uses internal JWKS access while validating the public issuer,
so localhost URLs are not used for container-to-container discovery.

### Before public hosting

The committed stack is deliberately not an Internet production topology.
Prepare these concrete environment changes before exposing a host:

1. Supply final HTTPS SPA/API/identity hostnames, trusted certificates and an
   HTTPS reverse proxy/load balancer. Keep PostgreSQL unexposed. Update exact
   realm redirect/logout origins and CORS; do not introduce wildcard origins.
2. Run Keycloak using its production `start` configuration, hostname v2 and a
   trusted proxy setup appropriate to TLS termination. Configure real SMTP with
   credentials from a secret manager; Mailpit is local development only.
3. Replace generated demo credentials with deployment-managed secrets. Keep
   payment simulation disabled unless publishing an explicitly designated demo.
   No production payment settlement is implemented.
4. Restrict access to infrastructure administration and health/metrics where
   appropriate. Verify JWT issuer/audience and cross-account denial through the
   public proxy. Use trusted proxy headers only from that proxy.
5. Back up both PostgreSQL databases and identity configuration. Rehearse restore
   into a separate stack, validate Flyway checksums and apply migrations before
   switching traffic. Database rollback requires a compatible backup/forward fix;
   do not edit V1–V7 or run Flyway clean against an installation.
6. Pin approved container image digests for the deployment and scan those images
   in its registry. CI currently audits npm dependencies and runs application
   checks; a full OS/JVM/container vulnerability audit is not claimed.

The local setup guide is [SETUP_DO_ZERO.md](../SETUP_DO_ZERO.md).

## Repeatable verification

GitHub Actions `.github/workflows/verify.yml` defines four independent jobs:
Java 17 + PostgreSQL tests and release packaging checks; Node 24 audit/unit/build;
Docker + Chromium browser tests; and deterministic source packaging. Permissions
are read-only; no deploy, push, PR creation or secret upload is performed. The
browser job creates generated credentials and isolated volumes rather than using
repository credentials. Remote Actions execution occurs after an authorized push.

```fish
cd web
npm ci
npm run audit
npm test -- --watch=false
npm run build
npx playwright install --with-deps chromium
cd ..
python3 -m unittest discover -s scripts -p 'test_*.py' -v
sh scripts/verify_release.sh
python3 scripts/package_release.py
```

The release runner requires Docker Compose and free loopback ports 14205, 18480,
18481 and 18025. It creates a uniquely named stack, builds the same Dockerfiles,
adds a deterministic postcode fixture and exercises actual identity/API/database
integration. The fixture is enabled only by `infra/testing/compose.yaml`; it is
never part of the normal stack. The test bootstraps temporary verified customers
and a realm administrator, performs browser PKCE login, purchase, wishlist,
refused-card retry, payment confirmation, shipping/delivery and a second purchase.
It checks authorization/ownership, metadata cleanup, responsive containment,
Axe contrast/labels, keyboard skip/menu/dialog behavior, no card payload leakage,
no Google font requests, cache behavior, missing assets and API readiness.

On completion or failure the runner removes **only its own** stack and volumes.
No credentials/tokens are saved in Playwright traces, videos or screenshots.
Historical dummy purchase rows exist only in that disposable database. Generated
private environment files remain ignored; delete obsolete test directories locally
when no longer needed. Tests intentionally refuse non-local/non-test environments.
Backend focused tests remain the authority for simultaneous stock commitment,
request idempotency and scheduler races; the browser exercises the complete flow.

## Source delivery

The versioned `scripts/package_release.py` includes source, wrappers, manifests,
public assets, documentation, infrastructure and release scripts. It excludes
`.git`, `.github`, `node_modules`, `target`, `.angular`, build/test outputs, local
environments, active application.properties, private key formats and symlinks.
The allowlist is defense in depth, not a replacement for reviewing public source
for accidentally hardcoded secrets. ZIP timestamps and permissions are normalized;
identical inputs produce identical bytes. The archive validates mandatory files,
paths, duplicates, CRC integrity and exclusions before reporting SHA256 and sizes.

```fish
python3 scripts/package_release.py
unzip -l dist/mousetrap_submission.zip
```

The default archive is under ignored root `dist/`, outside both application
modules. It includes documentation and runtime assets needed for a clean setup;
no fixed size claim is made.

## Primary references

- [Angular security](https://angular.dev/best-practices/security) and [update guide](https://angular.dev/update).
- [Keycloak containers](https://www.keycloak.org/server/containers), [production configuration](https://www.keycloak.org/server/configuration-production), [hostname v2](https://www.keycloak.org/server/hostname).
- [Quarkus OIDC configuration](https://quarkus.io/guides/security-oidc-expanded-configuration/).
- [Playwright fixtures](https://playwright.dev/docs/test-fixtures) and [accessibility testing](https://playwright.dev/docs/accessibility-testing).
- [WCAG contrast requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum).
- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).
