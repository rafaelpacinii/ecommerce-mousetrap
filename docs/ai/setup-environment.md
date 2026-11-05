# Local environment setup procedure

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

- [Root README](../../README.md),
  [API README](../../api/README.md), [web README](../../web/README.md).
- [Full stack](../../docker-compose.yml),
  [development identity stack](../../infra/identity/compose.yaml),
  [stack generator](../../scripts/configure_stack.py).
- [Authentication](../../docs/others/authentication.md),
  [realm definition](../../infra/identity/realm/mousetrap-realm.json),
  [identity theme](../../infra/identity/themes/mousetrap/login/theme.properties).
- [R2 guide](../../docs/others/cloudflare-r2.md), [.env example](../../.env.example),
  [API example](../../api/src/main/resources/application.properties.example),
  [API defaults](../../api/src/main/resources/META-INF/microprofile-config.properties),
  [public web settings](../../web/public/config.json).
- [API manifest](../../api/pom.xml), [web manifest](../../web/package.json),
  lockfiles, test profiles and [release operations](../../docs/others/release-readiness.md).

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

| Mode                 | When to use                                                                | Components                                                                               |
| -------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Source development   | IDE development, or this topology already exists                           | Host API/web; host-accessible PostgreSQL; development Keycloak + Mailpit Compose project |
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

Continue with [Docker, identity, R2 and acceptance](setup-integrations.md).
