# MouseTrap versioning policy

MouseTrap uses one version across the API, SPA and source release, following
[Semantic Versioning 2.0.0](https://semver.org/). Published versions are immutable.
The stable baseline is `v1.0.0`.

| Component | When to increment | Example after 1.0.0 |
| --- | --- | --- |
| MAJOR | Incompatible public API, persisted/domain contract or documented supported behavior requiring consumer migration | 2.0.0 |
| MINOR | New functionality that preserves existing contracts and supported flows | 1.1.0 |
| PATCH | Compatible correction of incorrect behavior, without adding functionality | 1.0.1 |

Reset both lower components on a major increment and PATCH on a minor increment.
For example, 1.4.7 becomes 2.0.0 for an incompatible change or 1.5.0 for a new
compatible feature. Components are integers: 1.9.0 is followed by 1.10.0 for the
next minor release. Use the highest increment required by the complete release
diff; do not derive versions from commit counts, backlog stages or branch age.

For this application, public compatibility includes documented HTTP DTOs/paths,
authorization and ownership guarantees, stored enum meanings, customer purchase
flows and supported runtime setup. A compatible schema migration does not by
itself require a major release. Dependency updates are assessed by their actual
effect on those contracts, rather than copying a dependency's version number.

## Workflow

1. Implement new capabilities on `feature/*` and corrections on `fix/*` or
   `bugfix/*`, based on `develop`. Use `hotfix/*` from `main` only for an urgent
   correction to a published release.
2. Record the expected release impact in the PR. `feat` usually means MINOR;
   `fix` means PATCH; `!` or a `BREAKING CHANGE` footer requires MAJOR when the
   documented contracts become incompatible. Documentation/refactoring alone
   does not automatically add a feature or require a major release.
3. When preparing a release, choose `release/vMAJOR.MINOR.PATCH` and align the
   project version in `api/pom.xml`, `web/package.json` and the root package entry
   in `web/package-lock.json`. Do not change dependency versions to match the
   application release. Feature implementation does not create a release branch,
   change a published tag or automatically publish.
4. Validate and review the release PR into `main`. Create an annotated
   `vMAJOR.MINOR.PATCH` tag on the released `main` commit and publish it explicitly.
5. Merge release adjustments back into `develop`. Keep feature/bugfix PR bases
   on `develop` and preserve existing migrations and published tags.

## Current unreleased change

The four-banner homepage carousel adds compatible functionality after 1.0.0.
Its target is **1.1.0** (`release/v1.1.0`, tag `v1.1.0`) if no incompatible change
is added to that release. It is not a patch merely because it is a visual change.
The released 1.0.0 tag and manifests are not rewritten by the feature branch.
