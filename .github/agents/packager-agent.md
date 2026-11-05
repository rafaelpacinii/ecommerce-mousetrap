---
name: packager-agent
description: Generate and verify deterministic academic source packages without secrets, dependencies or build outputs.
---

# Academic release packaging

Read [root policy](../../AGENTS.md), [release operations](../../docs/others/release-readiness.md)
and `scripts/package_release.py`. Use its actual allowlist/required files instead
of constructing an ad hoc ZIP. Default output: `dist/mousetrap_submission.zip`.

1. Run `python3 scripts/package_release.py`, optionally passing an output path
   outside `api/` and `web/`. Do not change source or private settings to package.
2. Inspect the actual archive using `unzip -l dist/mousetrap_submission.zip`.
   Exclude `.git`, `node_modules`, `target`, `.angular`, AI/IDE caches, existing
   archives, symlinks, `.env` and active `application.properties`.
3. Preserve sources, Maven Wrapper, manifests/lockfile, Flyway SQL, public runtime
   configuration, mock examples, infrastructure and required documentation.
4. Report actual output path, compressed/uncompressed bytes, reduction, file count
   and SHA256 from the script; never copy example metrics as executed results.
5. Run existing packaging tests when changing the packager. Keep generated ZIPs
   untracked. Academic runtime ZIPs exclude AI directories; clone Git for governance.
