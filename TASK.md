# Active task — Backend-mediated Keycloak authentication and registration (2026-11-28)

## Objective and scope

Centralize all Keycloak OAuth 2.0 / OIDC communication in the Quarkus backend so
Angular communicates exclusively with the Quarkus API (`apiUrl`), with zero direct
browser calls to Keycloak and zero passwords stored in PostgreSQL. User explicitly
approved updating `BR-IAM-02`, `BR-IAM-06`, and `BR-IAM-09` while preserving role
identifiers `admin` and `customer` (`BR-IAM-03`) and unrelated workspace work.

- [x] Update `BR-IAM-02`, `BR-IAM-06`, `BR-IAM-09`, [ADR 0007](docs/adr/0007-backend-mediated-keycloak-auth.md), and auth docs/skills.
- [x] Configure `mousetrap-backend` confidential client in `mousetrap-realm.json`, Compose, and `configure_stack.py`.
- [x] Implement Quarkus `/auth/{login,cadastro,refresh,me,logout}`, `KeycloakIdentityClient`, `HttpOnly` refresh cookie, and safe `Cliente` linkage.
- [x] Implement Angular `/login` and `/cadastro` Reactive Forms, in-memory `AuthService`, `authInterceptor` (`401`/`403` + refresh), and guards without `keycloak-js`.
- [x] Add/update Quarkus JUnit/REST Assured tests (`AuthResourceTest`, `KeycloakIdentityClientTest`), Angular/Vitest tests, Python stack/package tests, and Playwright E2E flow.
- [x] Run governance, Python, Web, npm audit, API package/unit tests, and release archive verification; record Docker-blocked checks.

## Verification and blocked prerequisites

- Passed: `python3 scripts/ai_checks.py verify --scope governance` (38 entrypoints, 13 skills, 8 governance tests) and `python3 -m unittest discover -s scripts -p 'test_*.py' -v` (16/16 passed).
- Passed: `python3 scripts/ai_checks.py verify --scope web` (`tsc --noEmit` + 30 files / 143 Vitest tests passed), `cd web && npm run build` (359.19 kB initial, zero budget warnings), `cd web && npm run audit` (0 vulnerabilities; `keycloak-js` removed).
- Passed: `cd api && ./mvnw -B -o -Prelease test-compile package -DskipTests` and `./mvnw -B -o -Prelease -Dtest=KeycloakIdentityClientTest,ImagemStorageServiceTest test` (7/7 JUnit tests passed).
- Blocked in current WSL session (Docker Desktop WSL integration inactive; `127.0.0.1:55439` unreachable): `cd api && ./mvnw -B -Prelease clean verify` (`AuthResourceTest` + `@QuarkusTest` suite) and `sh scripts/verify_release.sh` (live Keycloak + PostgreSQL + Playwright E2E). Run both once Docker is started.
- Archive `dist/mousetrap_submission_2026-11-28.zip`: 363 files, 898,329 compressed / 1,758,486 uncompressed bytes (48.91% reduction), SHA-256 `c47e24b697f344b4e8b44797a8274c706381aea564967605e84f84cbdb940ef8` (undated `dist/mousetrap_submission.zip` automatically removed).

---

# Completed task — Runnable submission under 2 MB (2026-11-21)

- [x] Keep runtime inputs only and enforce the 2,000,000-byte ZIP limit.
- [x] Verify the dated ZIP by building both modules, checking Compose and running the API.

# Completed task — Static homepage artwork and native scroll effects (2026-11-21)

- [x] Replace mouse playback with static artwork and native scrolling effects, verify Web/Chromium/Axe, and regenerate submission archive.

# Completed task — S3 image download and orphan cleanup (2026-11-21)

- [x] Deliver R2 attachment download and admin orphan cleanup with `BR-CAT-13` reservation protection (`V11`).
