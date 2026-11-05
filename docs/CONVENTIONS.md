# Conventions beyond automated checks

Read [repository policy](../AGENTS.md) first. Executable sources take precedence
over historical release notes when identifying implemented behavior.

## API contracts and persistence

- Packages remain under `br.unitins.tp2`; domain entities/attributes/tables retain
  Portuguese names. Follow existing JPA mappings rather than silently renaming
  columns to a new casing convention. SQL evolution uses incremental Flyway files.
- Entities inherit `DefaultEntity`; repositories use Panache Repository, not
  entity Active Record. Resource → Service → Repository is the request boundary.
- Request/response DTOs are separate Java records. Validate required inputs,
  lengths/ranges, associations and allowed state transitions in the proper layer.
- `Problem` in `api/src/main/java/br/unitins/tp2/exception/Problem.java` defines
  `type`, `title`, `status`, `detail`, `instance`, and `errors` containing
  `{field, message}`. Use `application/problem+json`, stable HTTP statuses and
  safe messages; never expose exception traces or SQL in an error response.
- Existing contracts use 200/201/204 as appropriate, 400 validation, 401 missing
  authentication, 403 insufficient access, 404 missing/hidden resources and 409
  conflicts. Inspect the actual mapper/service before introducing a new mapping.
- Public catalog lives under `/catalogo`; `/marcas` and `/mouses` are protected
  administration. Do not infer public access from historical agent examples.
- Keep pagination limits, whitelisted sort fields, DTO projections and query
  parameter binding. Inspect query plans before proposing performance indexes.

## Commerce and identity

- Authoritative amounts use `BigDecimal`; avoid constructing it from `double`.
  Preserve decimal JSON BRL units and existing rounding contracts. New browser
  arithmetic should use integer cents without silently changing API units.
- `PedidoServiceImpl` owns checkout totals, stock locks, request fingerprints,
  idempotency, expiration and restoration. Reuse those business operations.
- Order item snapshots/history remain immutable. Retried payment or cancellation
  must not repeat inventory or event side effects.
- Ownership is based on the verified identity subject. There is no tenant model.
  Never link accounts solely by matching an email or accept a customer ID as proof.
- Role checks also apply at the API. UI guards/interceptors are not authorization.
- PIX/card behavior is demonstration-only. No financial provider or webhook
  exists. Card number/CVV stay out of HTTP bodies, persistence and telemetry.

## Frontend and UI

- Components are standalone; reuse services/signals, Reactive Forms and Material.
  Organize CRUD under `components/<resource>/<resource>-list` and `-form`;
  functional route resolvers load edit state. Preserve existing exceptions deliberately.
- Support loading, empty, success, error and retry states. Prevent duplicate
  submission; keep accessible errors, keyboard focus and confirmation dialogs.
- Consult the matching [SVG wireframe](ui-wireframes/README.md). Tokens are in
  `web/src/material-theme.scss`, `web/src/styles.css` and wireframe 00.
  Preserve `#0a122a`, `#7d53de`, `#dacc3e`, `#d1f5ff`, `#eef8ff`; yellow/cyan
  surfaces use dark text. Keep the approved homepage hero composition.
- Keep implementation terminology out of customer/admin product flows. Use
  local Material Icons, meaningful image alternatives and reduced-motion support.
- Public metadata must describe actual products. Private routes remain noindex;
  never leak identity/customer data into canonical URLs, JSON-LD or social tags.

## Logs and private data

Log operation, safe status and a non-sensitive correlation identifier. Do not log
tokens, authorization/cookie headers, passwords, signed URLs, raw checkout forms,
card fields, customer addresses or complete user objects. Avoid unrestricted
environment dumps, expanded Compose configuration and SDK exceptions containing
signed requests. Use mock values only in examples. R2 credentials remain backend-only.

## Verification and version control

Run the verification preset for the changed scope and relevant behavior tests.
Tests assert observable behavior and meaningful regressions, not source wording.
Declare unavailable databases/Docker/browser binaries as blocked, never passed.
The project has no configured application linter or generated client-type pipeline.

Use English Conventional Commits: `feat`, `fix`, `refactor`, `docs`, `test`,
`chore`, `perf`, with a concrete scope and imperative description. Feature/fix PRs
target `develop`; publishing requires explicit authorization. Application version
selection follows [versioning](others/versioning.md), not the number of commits.
