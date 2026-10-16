---
description: Version control rules enforcing Gitflow and GitHub CLI workflows for the MouseTrap Monorepo.
globs: "**"
always_on: true
---

# Gitflow & GitHub CLI Rules — MouseTrap

- **Branching Model:** Follow Atlassian Gitflow Workflow (https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow):
  - `main`: Production releases with semantic version tags (`vX.Y.Z`).
  - `develop`: Integration branch; default base for all feature and bugfix branches.
  - `feature/<name>`: New capabilities, branched from `develop` and merged into `develop`.
  - `bugfix/<name>` or `fix/<name>`: Fixes, branched from `develop` and merged into `develop`.
  - `release/<version>`: Release stabilization, merged into `main` and `develop`.
  - `hotfix/<name>`: Emergency fixes from `main`, merged into `main` and `develop`.
  - `support/<version>`: Maintenance of historical releases.
- **Unified Monorepo:** All modules (`api/`, `web/`, `scripts/`, `.github/`, `.agents/`) reside in a single Git repository at the workspace root.
- **Command Presentation Rules:**
  - Provide commands in distinct blocks:
    1. Status check: `git branch --show-current && git status --short`
    2. Staging: `git add <files>`
    3. Diff check: `git diff --cached`
    4. Commit: `git commit -m "<type>(<scope>): <description>"`
    5. Push: `git push -u origin <branch>` (isolated block)
    6. PR: `gh pr create --base develop ...`
  - Push and PR commands must NEVER be executed automatically.
- **Conventional Commits:** Enforce `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.

