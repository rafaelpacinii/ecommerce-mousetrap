---
description: Packaging and distribution rules for minimal clean academic submission archives.
globs: "scripts/**,**"
always_on: false
---

# Release Packaging Rules — MouseTrap

- **Output Location:** The ZIP package must always be generated outside `api/` and `web/` (e.g. `../mousetrap_submission_<timestamp>.zip`).
- **Reproducible Script:** Use `python3 scripts/package_release.py [output_path]`.
- **Strict Blacklist:** Never package `.git/`, `node_modules/`, `target/`, `.angular/`, `.vscode/`, `.gemini/`, `.codex/`, `dist/`, local `application.properties`, or `*.zip` archives.
- **Strict Whitelist:** Must include `api/src/`, `web/src/`, `api/mvnw`, `api/pom.xml`, `web/package.json`, `web/angular.json`, `web/tsconfig*.json`, Flyway migrations, docs, and `application.properties.example`.
- **Validation:** Always verify output size, file count, and SHA256 checksum after packaging.

