# MouseTrap API

Java 17 / Quarkus 3.39 REST API with PostgreSQL 16, Panache repositories,
transactional services, Java record DTOs, Bean Validation and RFC 7807 errors.
Resources never bypass the service layer. Flyway migrations V1–V7 create the
catalog, owned profiles/addresses, transactional orders, events and wishlist.

## Implemented contracts

- Public active catalog: `GET /catalogo/mouses`, `/catalogo/mouses/{id}`, `/catalogo/filtros`.
- Public postcode and freight: `GET /ceps/{cep}` and `GET /ceps/{cep}/frete`.
- Protected admin CRUD: `/marcas`, `/mouses`, `/clientes`.
- Verified identity-owned profile: `GET/PUT /clientes/me`; saved addresses at `/clientes/me/enderecos`.
- Idempotent transactional checkout, payment attempts, cancellation and expiration at `/pedidos`.
- Owner-scoped history/details, administrative payment decisions and fulfillment at `/admin/pedidos`.
- Database-backed admin indicators and subject-owned persistent wishlist at `/desejos`.

See [catalog](../docs/public-catalog.md), [authentication](../docs/authentication.md),
[addresses](docs/clientes-cep.md), [checkout](../docs/transactional-checkout.md) and
[history/fulfillment](../docs/customer-portal-admin-orders.md) for exact methods,
payloads and status rules. Live payments/refunds/carriers and image uploads remain
future integrations. Card credentials are never accepted by payment DTOs.

## Development

Set `JAVA_HOME` to your JDK 17 installation. Install curl and unzip for the Maven
Wrapper; its pinned ZIP distribution checksum is verified on first installation.
Run a local PostgreSQL and [identity service](../docs/authentication.md), then:

```fish
cd api
if not test -f src/main/resources/application.properties
    cp src/main/resources/application.properties.example src/main/resources/application.properties
end
./mvnw quarkus:dev
```

Adjust only the ignored local configuration with your database URL/credentials.
The API defaults to port 8080; development Swagger and Dev UI are at
`/q/swagger-ui` and `/q/dev`. Public health checks are `/q/health/live` and
`/q/health/ready`; readiness includes datasource availability.

Shared operational defaults live in `META-INF/microprofile-config.properties`:
Flyway migrates, Hibernate validates, SQL/bind logging is off and OIDC validates
issuer/audience/realm roles. CORS allows only the configured `WEB_ORIGIN`.
Configuration examples contain mock values; no secret belongs in source control.

## Verification

The HTTP suite uses an isolated database on port 55439, independent of port 5432:

```fish
docker run --detach --rm --name ecommerce-mouses-crud-tests --publish 127.0.0.1:55439:5432 --env POSTGRES_USER=ecommerce_test --env POSTGRES_PASSWORD=ecommerce_test --env POSTGRES_DB=ecommerce_test postgres:16-alpine
docker exec ecommerce-mouses-crud-tests pg_isready -U ecommerce_test -d ecommerce_test
cd api
./mvnw -B -Prelease clean verify
```

Wait for `pg_isready` before running tests. Keep the database running during
Quarkus continuous testing. If it reports `Connection to localhost:55439 refused`,
recreate the disposable container and rerun. Surefire executes the HTTP tests;
Failsafe integration tests remain disabled (`skipITs=true`), not silently counted
as executed. Browser integration has its own [release runner](../docs/release-readiness.md).

Coverage includes authorization, active catalog filtering, address ownership,
profile uniqueness, validation, CORS, checkout idempotency/concurrency, stock
restoration, payment decisions, expiry, history, fulfillment and wishlist ownership.

## Release artifacts and migrations

Always build deployable artifacts from a clean directory using `-Prelease`:

```fish
./mvnw -B -Prelease clean package -DskipTests
java -jar target/quarkus-app/quarkus-run.jar
```

The complete `target/quarkus-app` directory is required. The release profile
excludes the active local configuration; provide database credentials and OIDC
settings through the deployment environment. The Docker build applies this
profile and also excludes the local file from its build context.

Existing Flyway migrations must not be edited. Start new installations with an
empty database; back up and validate existing installations before upgrading.
No destructive schema generation or automatic baseline is enabled. See
[deployment and backups](../docs/release-readiness.md).
