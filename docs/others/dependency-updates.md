# Dependency maintenance

[`.github/dependabot.yml`](../../.github/dependabot.yml) configures dependency
version updates for the MouseTrap monorepo. It opens reviewable pull requests;
merging and publishing remain manual.

## Coverage and schedule

All entries check weekly on Monday at 09:00 in `America/Sao_Paulo` and target
`develop`, following the repository's Gitflow policy. This is the configured
check time; GitHub may queue the actual job.

| Ecosystem      | Locations                                                                         | Groups                                                       | Open version PR limit |
| -------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------- |
| Maven          | `api/pom.xml`                                                                     | Quarkus platform/plugins, AWS SDK, Maven plugins             | 3                     |
| npm            | `web/package.json`, `web/package-lock.json`                                       | Angular, other runtime dependencies, other development tools | 3                     |
| GitHub Actions | `.github/workflows/`                                                              | Workflow action references                                   | 2                     |
| Docker         | `api/Dockerfile`, `api/src/main/docker/Dockerfile.*`, `web/Dockerfile`            | Build and runtime images across the three directories        | 2                     |
| Docker Compose | `docker-compose.yml`, `infra/identity/compose.yaml`, `infra/testing/compose.yaml` | Service images across the three stacks                       | 2                     |

Commits and PR titles use Conventional Commits with `chore(deps)` or
`chore(deps-dev)`. Default Dependabot labels are retained, so custom repository
labels, reviewer accounts and registry secrets are not prerequisites.

The Angular group includes framework packages, CLI, build tooling, Material and
CDK. Quarkus updates preserve the shared `quarkus.platform.version` property for
the BOM and Maven plugin. AWS SDK modules share `aws-sdk.version`. Dependencies
managed by the Quarkus BOM remain managed by that BOM; do not introduce individual
version overrides just to clear an alert.

Routine Maven, npm and container updates exclude SemVer major upgrades. Plan
those separately: Angular may require `ng update` migrations, Quarkus must remain
compatible with Java 17, and PostgreSQL/Keycloak upgrades can require data or
configuration migrations. Action major upgrades are allowed as reviewable PRs;
check their release notes and runner requirements. Container tags do not express
every compatibility constraint: also verify Java suffixes, Node engine ranges,
Python versions and image variants during review.

These policies do not upgrade dependencies until a PR is merged and do not
change the unified application release version. Follow the
[versioning policy](versioning.md) during release preparation.

## Activate on GitHub

1. Merge the configuration into the repository's **default branch**. Dependabot
   reads its configuration there, even when `target-branch` names another branch.
   The local `origin/HEAD` currently points to `develop`; verify the actual
   default branch in GitHub rather than relying on a potentially stale local ref.
2. In the repository's **Settings → Advanced Security**, enable the dependency
   graph, Dependabot alerts and Dependabot security updates where available.
   Version updates are configured by the YAML file; security updates are a
   separate repository feature.
3. In **Insights → Dependency graph → Dependabot**, inspect the first update
   jobs and their logs. Use **Check for updates** to request a check without
   waiting for the weekly schedule.
4. Require the existing **Verify release** workflow to pass before merging.
   The configuration does not change branch protection or enable automatic merges.

Security update PRs target GitHub's default branch. Because the version update
entries explicitly set `target-branch`, do not rely on their grouping, scheduling,
commit formatting or major-version rules to configure security updates. The
weekly schedule and version PR limits do not delay or cap security update PRs.
If the default branch differs from `develop`, review the security fix there and
carry it into `develop` through the appropriate Gitflow workflow.

See GitHub's [configuration reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference),
[configuration location](https://docs.github.com/en/code-security/concepts/supply-chain-security/about-the-dependabot-yml-file)
and [security update setup](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-security-updates).

## Review and verification

The existing [CI workflow](../../.github/workflows/verify.yml) already runs for PRs
to `develop` and `main`, including Dependabot PRs. It uses a read-only repository
token, generated test credentials and disposable infrastructure. No production
secret, `.env` file or active `application.properties` is needed by Dependabot.

- **Maven:** review BOM/plugin alignment and shared version properties; run
  `cd api && ./mvnw -B -Prelease clean verify` with the isolated test database.
- **npm:** review manifest/lockfile changes together; run `npm ci`,
  `npm run audit`, `npm test -- --watch=false` and `npm run build` inside `web/`.
- **Actions:** review action release notes and inspect all CI jobs after
  the update. Keep workflow permissions limited to those actually needed.
- **Containers:** review all affected Dockerfiles/Compose stacks and use
  `sh scripts/verify_release.sh` to exercise the disposable browser stack.
  Run image scanning separately; version checks are not a container vulnerability
  assessment, and moving tags such as `postgres:16-alpine` can change without a PR.

Dependabot may be unable to repair a transitive dependency independently when a
BOM or direct dependency constrains it. Inspect the update job and advisory,
update the owning dependency when supported, and rerun CI. Do not add blanket
ignores for security alerts or bypass failing checks to merge a dependency PR.
