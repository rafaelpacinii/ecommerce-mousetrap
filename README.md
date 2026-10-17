# MouseTrap

Gaming mouse storefront and administration built with Angular 22.2, Quarkus 3.39,
Java 17, PostgreSQL 16 and Keycloak 26.8. The repository includes the application,
identity theme, SVG wireframes, automated verification and source packaging.

## Implemented

- Responsive homepage with a four-banner carousel, public catalog with combined filters, galleries and gaming specifications.
- PKCE authentication, registration, email verification/recovery, owned customer profiles and saved addresses.
- Persistent cart, ViaCEP lookup, delivery estimates and authoritative checkout totals.
- Transactional orders, stock concurrency, idempotency, cancellation and expiry.
- PIX BR Code/QR with the final total and fictitious recipient, local card-field validation, and administrative payment decisions.
- Customer order history, recorded fulfillment timeline, tracking and persisted wishlist.
- Guarded catalog/customer administration, paging, sorting, optimistic version checks and accessible confirmations.
- Route/social metadata, Product JSON-LD, local icon fonts, CI and a complete local release stack.

Payments use a local demonstration engine, disabled outside dev/test unless explicitly
enabled. Card credentials stay in the browser and are neither sent nor stored.
Live payment providers, real settlement, refunds, carrier integration, binary image
uploads, categories and sales-based merchandising remain future work.

## Start here

Read [setup from scratch](SETUP_DO_ZERO.md) for the complete local stack or
[developer authentication setup](docs/authentication.md) for independently running
Angular and Quarkus. The root Compose stack uses its own databases and requires
an explicitly generated private environment; it does not reuse the older local
identity stack or its credentials. Do not start both on the same ports.

```fish
python3 scripts/configure_stack.py --demo-payments
docker compose --env-file .local/release/stack.env up -d --build
```

The storefront is at `http://localhost:4200`; API at `http://localhost:8080`;
identity console at `http://localhost:8180`; local email inbox at
`http://localhost:8025`. Credentials are generated once in the ignored,
permission-restricted `.local/release/stack.env`. There is no seeded store
administrator: create one in the `mousetrap` realm and assign its `admin` role.
The bootstrap console administrator belongs to `master`.

This loopback-only stack is a release rehearsal. Before public deployment, follow
[release operations, TLS, secrets, backups and migration guidance](docs/release-readiness.md).

## Architecture and contracts

The API follows Resource → Service → Repository with Java record DTOs and
incremental Flyway migrations V1–V8. The SPA uses standalone components, Angular
Material, services/signals and lazy routes. Backend roles and ownership are
mandatory; guards only improve navigation.

| Area | Routes / documentation |
| --- | --- |
| Public catalog | `GET /catalogo/mouses`, `/catalogo/mouses/{id}`, `/catalogo/filtros`; [contracts](docs/public-catalog.md) |
| Catalog image uploads | Admin-only `POST /imagens/{mouses\|marcas}`; [Cloudflare R2 setup](docs/cloudflare-r2.md) |
| Postcode / freight | `/ceps/{cep}`, `/ceps/{cep}/frete`; [addresses](api/docs/clientes-cep.md) |
| Owned profile / addresses | `/clientes/me`, `/clientes/me/enderecos`; [authentication](docs/authentication.md) |
| Checkout / payments | `/pedidos`; [transactional contracts](docs/transactional-checkout.md) |
| History / fulfillment / wishlist | `/pedidos/me`, `/admin/pedidos`, `/desejos`; [operations](docs/customer-portal-admin-orders.md) |
| Storefront | `/`, `/catalogo`, `/catalogo/:id`, `/carrinho`, `/checkout` |
| Customer area | `/meus-dados`, `/enderecos`, `/meus-pedidos`, `/meus-pedidos/:id`, `/lista-de-desejos` |
| Administration | `/admin/pedidos`, `/admin/mouses`, `/admin/marcas`, `/admin/clientes` |

See [implementation status](docs/implementation-backlog.md),
[canonical SVG screens](docs/ui-wireframes/README.md), [web development](web/README.md),
[API development](api/README.md) and [engineering rules](AGENTS.md).

## Verify and package

```fish
cd web
npm ci
npm run audit
npm test -- --watch=false
npm run build
cd ..
python3 -m unittest discover -s scripts -p 'test_*.py' -v
python3 scripts/package_release.py
```

Backend tests require the isolated database described in [API setup](api/README.md):
`cd api; ./mvnw -B -Prelease clean verify`. Browser verification uses a disposable
Compose stack, actual PKCE login and Axe accessibility checks:

```fish
cd web
npx playwright install --with-deps chromium
cd ..
sh scripts/verify_release.sh
```

The generated `dist/mousetrap_submission.zip` contains source, build wrappers,
configuration examples, deployment files and documentation. The script validates
integrity, mandatory files and exclusions and reports sizes, reduction, file count
and SHA256. It excludes dependencies, build outputs, caches, symlinks and local
credentials. Archive bytes are deterministic for identical source contents.

CI runs backend, frontend, browser and packaging jobs for PRs to `develop`/`main`.
It never deploys. Features and bug fixes target `develop`; release publication
requires explicit review. Commits follow Conventional Commits in English.
Application releases follow the [MAJOR.MINOR.PATCH policy](docs/versioning.md).
The compatible homepage carousel targets the next minor release, `1.1.0`.

[MIT License](LICENSE.md).
