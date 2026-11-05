# Environment integrations and acceptance

Read [environment discovery and source setup](setup-environment.md) first.

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
