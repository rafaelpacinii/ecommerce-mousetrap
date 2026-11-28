---
name: packager-agent
description: Generate and verify deterministic dated academic source packages without secrets, dependencies, build outputs, or undated archives.
---

# Academic release packaging

Read [root policy](../../AGENTS.md), [release operations](../../docs/others/release-readiness.md)
and `scripts/package_release.py`. Use its actual allowlist/required files instead
of constructing an ad hoc ZIP. Default output: `dist/mousetrap_submission_YYYY-MM-DD.zip`.

1. Run `python3 scripts/package_release.py` (which defaults to the current date
   `dist/mousetrap_submission_YYYY-MM-DD.zip` and removes any undated
   `mousetrap_submission*.zip` in `dist/`). Do not change source or private settings to package.
2. Inspect the actual archive using `unzip -l dist/mousetrap_submission_YYYY-MM-DD.zip`.
   Exclude `.git`, `node_modules`, `target`, `.angular`, AI/IDE caches, existing
   archives, symlinks, `.env` and active `application.properties`.
3. Preserve sources, Maven Wrapper, manifests/lockfile, Flyway SQL, public runtime
   configuration, mock examples, infrastructure and required documentation.
4. Report actual dated output path, compressed/uncompressed bytes, reduction, file
   count and SHA256 from the script; never copy example metrics as executed results.
5. Run existing packaging tests when changing the packager. Keep generated ZIPs
   untracked. Academic runtime ZIPs exclude AI directories; clone Git for governance.
