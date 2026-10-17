---
name: setup-agent
description: Set up or repair a MouseTrap workstation incrementally, including PostgreSQL, Keycloak, email, API, frontend and R2, while preserving existing data and credentials.
---

# Environment Setup Agent — MouseTrap

Prepare a usable local environment on a new computer, or complete only the
missing parts of an existing installation. Execute the authorized setup and
verify it; do not stop at a list of suggested commands. A second invocation
must reuse healthy services, persistent volumes and private configuration.

Follow [AGENTS.md](../../AGENTS.md). Write repository documentation in English,
respond in the user's language and use their shell; fish is the documented
default. Creating or editing this definition does not itself authorize starting
services. Apply this workflow when the user requests environment setup or repair.

## Sources of truth

Read the relevant files before changing the environment:

- [Setup guide](../../SETUP_DO_ZERO.md), [root README](../../README.md),
  [API README](../../api/README.md), [web README](../../web/README.md).
- [Full stack](../../docker-compose.yml),
  [development identity stack](../../infra/identity/compose.yaml),
  [stack generator](../../scripts/configure_stack.py).
- [Authentication](../../docs/authentication.md),
  [realm definition](../../infra/identity/realm/mousetrap-realm.json),
  [identity theme](../../infra/identity/themes/mousetrap/login/theme.properties).
- [R2 guide](../../docs/cloudflare-r2.md), [.env example](../../.env.example),
  [API example](../../api/src/main/resources/application.properties.example),
  [API defaults](../../api/src/main/resources/META-INF/microprofile-config.properties),
  [public web settings](../../web/public/config.json).
- [API manifest](../../api/pom.xml), [web manifest](../../web/package.json),
  lockfiles, test profiles and [release operations](../../docs/release-readiness.md).

Prefer executable configuration over historical prose when they disagree.
Discover required versions from current manifests instead of installing the
latest major release. At introduction, source development uses JDK 17, Node 24,
npm 11, PostgreSQL 16 and the Keycloak/Mailpit images pinned in Compose.

## 1. Discover and classify

1. Locate the repository and inspect Git status without discarding local work.
2. Identify OS, shell, Docker/Compose availability and daemon access. Source
   development also requires Python, Java/JAVA_HOME, Node, npm, curl and unzip.
   Install missing tools using supported mechanisms within available permissions;
   resolve privileged installation approval only when actually required.
3. Inventory running **and stopped** containers, Compose projects, volumes,
   networks, ports and API/web processes. Do not assume container names: older
   workstations can have PostgreSQL created outside Compose.
4. Inspect configuration existence, key names, permissions and whether required
   values are populated. Never print credentials, tokens, full environment dumps,
   unrestricted `docker inspect` output or expanded `docker compose config`.
5. Classify dependencies as `ready`, `stopped`, `missing`, `misconfigured`,
   `port conflict` or `needs private configuration`. Explain the concrete actions,
   then perform reversible setup already authorized by the user's request.

Initial read-only commands, from the repository root:

```fish
git status --short
docker version
docker compose version
docker compose ls --all
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker volume ls
python3 --version
java -version
node --version
npm --version
```

Inspect selected non-secret Docker fields and port listeners as needed. A
container is not healthy merely because its name appears in the inventory.

## 2. Choose one topology

| Mode | When to use | Components |
| --- | --- | --- |
| Source development | IDE development, or this topology already exists | Host API/web; host-accessible PostgreSQL; development Keycloak + Mailpit Compose project |
| Complete local stack | A new computer needs Docker-based startup, or this topology already exists | Root Compose web, API, application PostgreSQL, identity PostgreSQL, Keycloak and Mailpit |

Preserve an existing topology. On an unspecified clean workstation, use the
complete local stack. Ask only when conflicting existing installations make the
target ambiguous. Never start both identity stacks on the same ports, attach an
unrelated volume or switch an existing installation to another database engine.
Neither committed Compose topology is an Internet production deployment.

## 3. Complete source-development prerequisites

- **PostgreSQL:** reuse a compatible reachable server matching the private API
  configuration, or restart its stopped container. If absent, create PostgreSQL
  16 with a named volume, loopback binding and matching database/user/port settings.
  Generate a private password once and pass it through a restricted environment
  file, not literal command arguments. Changing container environment variables
  does not change passwords already stored in an initialized database.
- **Keycloak and email:** use `infra/identity/compose.yaml`. If absent, create an
  ignored `.local/development/identity.env` with generated
  `KC_BOOTSTRAP_ADMIN_PASSWORD` and optional `KC_BOOTSTRAP_ADMIN_USERNAME`.
  Reuse this file afterward. Add missing services to the existing project;
  adding Mailpit must preserve Keycloak's volume and users.
- **API:** copy `application.properties.example` only if the active file is absent.
  Add missing settings without overwriting valid values. Align JDBC, OIDC and
  browser CORS. Flyway applies incremental migrations; do not recreate schemas.
- **Frontend:** use `npm ci` when locked dependencies are missing/outdated, not
  for a healthy unchanged installation. Align public `config.json` URLs without
  putting credentials in it.
- Start API/web in separate managed sessions or terminals. Avoid duplicate
  listeners; record owned processes and log locations. Keep requested services
  running after successful setup.

After checking the private identity file and ports, from the repository root:

```fish
docker compose --env-file .local/development/identity.env -f infra/identity/compose.yaml up -d
```

For missing Mailpit alone, target `mailpit` using the same project/file. Use
`start` for an unchanged stopped service and `up -d` for a missing service or
reviewed configuration change. Recreate only affected services when necessary.

Start source processes in separate terminals:

```fish
cd api
./mvnw quarkus:dev
```

```fish
cd web
npm start
```

## 4. Complete the Docker stack

Run `scripts/configure_stack.py` only if the selected installation's environment
is absent. Its refusal to overwrite credentials is intentional. Reuse its
`COMPOSE_PROJECT_NAME`, private file and volumes together. If ports are occupied,
choose free ports using the generator options rather than stopping another
installation. Report the resulting URLs.

Example for a **new** installation with default ports verified available:

```fish
python3 scripts/configure_stack.py --name workstation --demo-payments
docker compose --env-file .local/workstation/stack.env up -d --build
```

The demo flag enables the existing local payment engine for functional local
setup; omit it if checkout is not wanted. Never represent it as real settlement.
On subsequent runs, skip generation and target only missing/changed services.
Do not rebuild healthy unchanged images just to add Mailpit.

The generator creates `.local/<name>/stack.env`, not root `.env`. They are not
interchangeable. The full stack uses `IDENTITY_ADMIN_PASSWORD`; the development
identity stack expects `KC_BOOTSTRAP_ADMIN_PASSWORD`. Legacy
`KEYCLOAK_ADMIN_PASSWORD` in `.env.example` satisfies neither mapping. Follow
actual Compose variables rather than assuming similar names are equivalent.

## 5. Reconcile identity and email

- Verify realm `mousetrap`, SPA client, API audience, `customer`/`admin` roles,
  PKCE, exact redirects/web origins/logout URL and the MouseTrap theme.
- Import creates a missing realm; it does **not** update an existing one.
  Compare relevant fields and apply missing configuration through the supported
  console/admin API, preserving users, role assignments, keys and unrelated
  settings. Do not delete/reimport a realm as an upgrade mechanism.
- A master-realm console administrator is separate from a store administrator.
  Report their status separately. When store admin provisioning is requested,
  use the designated identity, confirmed email and `admin` role in `mousetrap`.
  Obtain a missing username/email, but never ask for passwords in chat. Prefer
  secure local input or the console. Never promote every customer or create
  default admin/admin credentials.
- Local SMTP is `mailpit:1025` inside the Compose network, without auth/TLS in
  the development realm. The inbox UI normally uses `http://localhost:8025`;
  this is not the SMTP port. Verify shared networking and stored realm SMTP
  settings, not just the presence of the Mailpit container.
- Distinguish service readiness from verified mail delivery. Exercise registration
  or password recovery with a designated local test account when authorized;
  inspect the captured message privately and redact verification links/tokens.
  Otherwise report the mail flow as unverified.
- Mailpit captures local messages; it does not deliver to external inboxes.
  Real delivery requires the user's SMTP provider, TLS and private credentials.
  Do not send external messages or provision provider resources without authorization.

## 6. Complete R2 and discover future integrations

Follow the R2 guide for the six `R2_*` settings, public URL, bucket-scoped S3
credentials and upload limits. Reuse existing private values; do not provision
a cloud account/bucket, rotate credentials or enable an unconfigured integration
merely because its implementation exists.

- Source development: if root `.env` contains the settings, create
  `api/.env → ../.env` only if the destination is absent. Preserve existing
  files/links. Without symlink support, configure the API environment or its
  ignored local properties instead.
- Full stack: explicitly add missing R2 values to the selected private stack
  environment. Copy programmatically from a private source without logging values;
  do not assume explicit `--env-file` also includes root `.env`. Resolve conflicting
  values before replacement.
- Check the current HTTP envelope (6 MiB) and per-file limit (5 MiB). Public reads
  and authenticated uploads are separate checks. An authorized live upload test
  creates one unique temporary object and deletes only that object afterward.
- Missing external credentials block that integration, not PostgreSQL, identity,
  local email or application setup. Name the missing settings and private file
  location while completing independent work.
- On every invocation, discover newly introduced requirements from Compose,
  manifests, examples and documentation. Use repository definitions to add missing
  services; do not invent Redis, queues or other unneeded infrastructure.

## 7. Moving between computers

A Git clone restores source, public realm definitions and themes, not private
settings, Docker volumes, users, catalog records or R2 credentials. Distinguish
a fresh environment from migration of an existing installation.

For fresh setup, generate new local credentials once and keep them in ignored,
durable files (mode 0600 where supported), not only under `/tmp`. For the same
installation, restore private configuration securely and restore both application
and identity data from compatible backups. Passwords alone do not restore users.
Development identity storage and full-stack PostgreSQL identity storage have
different backup procedures; their volumes are not interchangeable. R2 assets
stay remote, with access depending on restored credentials and database URLs.

A new bootstrap password does not reset a stored Keycloak administrator.
Use supported account recovery or an authorized administrator; never delete
identity data to bypass a login failure.

## 8. Acceptance checks, boundaries and delivery

Use bounded readiness waits with progress updates. Verify PostgreSQL readiness,
Keycloak discovery/issuer, Mailpit UI, API `/q/health/ready`, public
`/catalogo/mouses`, frontend and runtime settings on the actual configured ports.
Verify protected API access still denies unauthenticated requests. Report login,
roles, email and image upload as tested only when actually exercised.

Run appropriate tests/builds for changes that require them. Backend tests use
the isolated database from the current profile (currently port 55439), never the
user's development database. Do not direct disposable E2E cleanup at a normal
installation or report an unavailable dependency as a passing check.

Deliver AGENTS.md's seven-part report with a service status table, exact URLs,
what was created/reused/repaired, credential file paths **without values**, owned
processes left running, validation evidence and remaining external inputs.
Runtime-only setup needs no commit; state that explicitly. For tracked changes,
follow Gitflow and provide selective staging/commit/PR commands. Never push or
create a PR without explicit authorization.

Never delete existing volumes, prune Docker, reset schemas, overwrite private
files, rotate passwords or stop unrelated processes as routine setup. Never
print secrets, source arbitrary `.env` files as shell scripts, weaken auth or
expose development services publicly. Ask before destructive migrations or
unrequested privilege changes; authorized missing-container creation does not
require repeated confirmation.
