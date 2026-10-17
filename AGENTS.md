---
name: mousetrap-agents
description: Master repository engineering directives, architecture patterns, and specialized agent specifications for the MouseTrap commercial gaming e-commerce platform.
---

# MouseTrap E-Commerce — Master Agent Guidelines (AGENTS.md)

This document establishes the architecture standards, coding conventions, version control protocols, and specialized agent roles for **MouseTrap** — a commercial-grade e-commerce platform specializing in high-performance gaming mice and esports peripherals.

Although developed in an academic setting, this project follows enterprise software engineering standards. Every agent, assistant, and contributor must strictly follow the specifications set forth herein.

---

## 1. Specialist Agent Directory & Roles

In accordance with GitHub's analysis of over 2,500 top-performing agent configurations (*specialists over general helpers*), the repository defines five dedicated agent personas located under `.github/agents/` and `.agents/rules/`:

| Agent | Config File | Primary Responsibility | Standard / Reference |
| :--- | :--- | :--- | :--- |
| **Documentation Agent** | [`.github/agents/docs-agent.md`](.github/agents/docs-agent.md) | Produces commercial documentation in English across all modules | [Awesome README](https://github.com/matiassingers/awesome-readme) |
| **Gitflow & Release Agent** | [`.github/agents/gitflow-agent.md`](.github/agents/gitflow-agent.md) | Manages branching, Conventional Commits, and GitHub CLI PR workflows | [Atlassian Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) |
| **Release Packager Agent** | [`.github/agents/packager-agent.md`](.github/agents/packager-agent.md) | Generates clean, minimized ZIP submission archives for evaluation | Educational Delivery Standard |
| **Principal Architect Agent** | [`.github/agents/architect-agent.md`](.github/agents/architect-agent.md) | Guides commercial e-commerce roadmap, Keycloak RBAC, and fullstack consistency | Enterprise Clean Architecture |
| **UI/UX, Design System & SEO Agent** | [`.github/agents/ui-ux-agent.md`](.github/agents/ui-ux-agent.md) | Enforces unified color palette, Angular Material M3 theming, SVG wireframes, and SEO | Material Design 3 & WCAG 2.1 AA |

---

## 2. Commands You Can Use (Executable Reference)

Run all development and verification tasks using these standard commands:

### Backend (Quarkus 3.15+, Java 17)

```bash
# Start backend in dev mode (Dev UI at /q/dev, Swagger UI at /q/swagger-ui)
cd api && ./mvnw quarkus:dev

# Run automated tests with isolated test profile
cd api && ./mvnw test

# Verify code formatting and compile
cd api && ./mvnw clean compile
```

### Frontend (Angular 22+, Node.js)

```bash
# Install dependencies
cd web && npm ci

# Start frontend application (runs at http://localhost:4200)
cd web && npm start

# Run unit tests
cd web && npm test -- --watch=false

# Production build
cd web && npm run build
```

### Local Infrastructure (PostgreSQL 16 & Keycloak 24+)

```bash
# PostgreSQL 16 container for development
docker run --detach --name mouse-store-postgres \
  --publish 127.0.0.1:5432:5432 \
  --env POSTGRES_DB=db --env POSTGRES_USER=dbuser --env POSTGRES_PASSWORD=dbpasswd \
  --volume mouse-store-postgres-data:/var/lib/postgresql/data postgres:16-alpine

# Keycloak 24+ container for authentication
docker run --detach --name mousetrap-keycloak \
  --publish 8180:8080 \
  --env KEYCLOAK_ADMIN=admin --env KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:24.0.5 start-dev
```

### Packaging & Distribution

```bash
# Generate clean, minimized ZIP submission package
python3 scripts/package_release.py

# Verify package exclusions and check for bloat
unzip -l ../mousetrap_submission_*.zip | grep -E "node_modules|\.git|target|\.angular|application\.properties$" || echo "✅ Zero prohibited files found."
```

---

## 3. Commercial Scope & V1.0 Roadmap

The commercial vision of MouseTrap is a competitive gaming peripheral store. The v1.0 release roadmap consists of:

### 3.1 Backoffice Administration

- **Catalog CRUD:** Brands (`Marca`), Gaming Mice (`Mouse`), Connection Types (`TipoConexao`), and Categories.
- **Gaming Specifications Management:** Optical sensor models (PixArt PAW3395, Focus Pro 30K, HERO 2), polling rate support (up to 8000Hz), optical/mechanical switches, weight, and multi-mode connectivity.
- **Inventory & Pricing:** Stock tracking, price updates, optimistic locking concurrency control.
- **Order Management:** Status progression (`PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- **Customer Directory:** Customer list, registration details, and address data.

### 3.2 Customer Storefront

- **Esports Product Catalog:** Responsive grid with gaming-centric facet filters (Brand, Sensor, Polling Rate, Weight, Grip Style, Connectivity).
- **Product Detail Page:** Interactive specs sheet, image gallery, switch feel description, stock availability.
- **Cart & Checkout:** Client-side cart persistence, address autocomplete via ViaCEP, order placement.
- **Order Tracking:** Customer order history and live status timeline.

### 3.3 Keycloak Authentication & Authorization

- **Realm:** `mousetrap` configured on Keycloak 24+.
- **Clients:**
  - `mousetrap-api`: Bearer-only backend client validating JWT tokens via `quarkus-oidc`.
  - `mousetrap-web`: Public SPA client utilizing Authorization Code flow with PKCE.
- **Roles & Permissions:**
  - `admin`: Full administrative access to `/marcas/**`, `/mouses/**` (CUD), `/clientes/**`, `/pedidos/**`.
  - `customer`: Customer profile `/clientes/me`, order creation `/pedidos`, personal history `/pedidos/me`.
  - `public`: Unauthenticated catalog browsing (`GET /mouses`, `GET /marcas`, `GET /cep/**`).

---

## 4. Architectural Standards & Code Conventions

### 4.1 Backend Patterns (Quarkus / Java 17)

- **Domain Entities & Inheritance:**
  - All business entities inherit from `DefaultEntity` (`id` via `IDENTITY`, `dataCadastro`, `dataAlteracao` with `@PrePersist` and `@PreUpdate`).
  - Domain entity names and table names remain in **Portuguese** for consistency with educational domain requirements (`Mouse`, `Marca`, `TipoConexao`, `Cliente`, `Endereco`, `Municipio`, `Estado`, `Pedido`).
  - Enums must feature `id` (`Integer`) and `label` (`String`), constructor, getters, static `valueOf(Integer id)`, and an `@Converter(autoApply = true)` in `br.unitins.tp2.model.converterjpa`.
- **Panache Repository Pattern:**
  - Classes implement `PanacheRepository<T>` and are annotated with `@ApplicationScoped`.
  - Active Record directly on entities is forbidden.
  - REST Resources must never query Repositories directly; the Service layer is mandatory.
- **DTO Separation (Java Records):**
  - Strictly use Java Records for data transfer.
  - Input: `<Entity>DTO` containing Bean Validation (`@NotBlank`, `@NotNull`, `@Min`, `@Size`, `@Pattern`).
  - Output: `<Entity>ResponseDTO` containing a static mapper `valueOf(Entity entity)`.
- **Service Layer:**
  - Decoupled interface (`<Entity>Service`) and implementation (`<Entity>ServiceImpl` with `@ApplicationScoped`).
  - Write methods annotated with `@Transactional`.
  - Business rule violations throw custom `ValidationException` mapped to RFC 7807 Problem Details.
- **REST Resources (JAX-RS):**
  - Annotated with `@Path("/<resources>")`, `@Produces(APPLICATION_JSON)`, `@Consumes(APPLICATION_JSON)`.
  - Return standardized HTTP responses: `200 OK`, `201 CREATED`, `204 NO CONTENT`.
  - Validate payloads using `@Valid`.
- **CORS Configuration:**
  - Maintained in `application.properties` allowing origin `http://localhost:4200` with credentials and standard HTTP verbs (`GET,PUT,POST,DELETE,PATCH,OPTIONS`).

### 4.2 Frontend Patterns (Angular 22+)

- **Standalone Components:** All components must use `standalone: true`. Import only necessary Angular Material modules and common directives.
- **Directory Structure:**

  ```text
  web/src/app/
  ├── components/
  │   └── <resource>/
  │       ├── <resource>-list/     # Table view (mat-table, actions, pagination)
  │       └── <resource>-form/     # Create & Edit form (Reactive Forms)
  ├── models/                      # Interfaces, DTOs, and Enums
  ├── services/                    # HttpClient communication and error mapping
  └── resolvers/                   # Functional Route Resolvers (ResolveFn<T>)
  ```

- **List Component Pattern:**
  - Use `mat-table` with sortable headers, pagination, and filter inputs.
  - Action column containing Edit (`edit` icon -> `/editar/:id`) and Delete (`delete` icon with confirmation dialog).
  - Header toolbar with screen title and "Novo Cadastro" action button (`add` icon).
  - Feedback notifications via `MatSnackBar`.
- **Form Component Pattern:**
  - Reactive Forms using `FormGroup` with explicit validators.
  - Dual Create/Edit handling: route resolver preloads data on edit (`patchValue`), clean state on create.
  - Form controls with `mat-form-field`, `matInput`, `mat-select`, and `mat-error`.
  - Styled submit button (`mat-raised-button color="primary"`) and cancel/back button (`mat-button` -> `../`).
- **Services & Resolvers:**
  - Services provide standard CRUD observables (`findAll`, `findById`, `create`, `update`, `delete`).
  - Route Resolvers use modern functional `ResolveFn<T>` to fetch data before navigation completes.

### 4.3 Unified Design System, Color Palette & SVG Wireframes
- **Core Brand Palette (CSS Custom Properties):**
  - `--prussian-blue: #0a122a` (Primary dark navy/obsidian for headers, Admin sidebar, Hero banners, primary headings)
  - `--slate-blue: #7d53de` (Primary interactive accent, M3 primary seed, active states, focus rings)
  - `--golden-glow: #dacc3e` (High-conversion CTAs, Pro/8KHz highlight badges — always paired with `#0a122a` dark text for AAA contrast)
  - `--light-cyan: #d1f5ff` (Technical spec pills, wireless/sensor badges — always paired with `#0a122a` text)
  - `--alice-blue: #eef8ff` (Product image stages, secondary filter boxes, subtle surface highlights)
- **Extended Neutral & Semantic Tokens:**
  - `--surface-pure: #ffffff`, `--surface-canvas: #f6f9fc`, `--neutral-900: #0a122a`, `--neutral-700: #2c3652`, `--neutral-500: #64708d`, `--neutral-200: #dde5f0`, `--neutral-100: #eef3f9`.
  - Semantic status colors: `--status-success` (`#10b981`), `--status-warning` (`#f59e0b`), `--status-info` (`#0ea5e9`), `--status-danger` (`#ef4444`).
- **Architectural SVG Screen Wireframes (`docs/ui-wireframes/`):**
  - Every screen in the application has a canonical SVG wireframe in [`docs/ui-wireframes/`](docs/ui-wireframes/) that must be consulted prior to frontend implementation.

---

## 5. Gitflow & Version Control Rules (Monorepo)

The project operates as a unified **Monorepo** (`origin` -> `https://github.com/rafaelpacinii/ecommerce-mousetrap.git`) containing:

- `api/`: Quarkus 3.15+ backend module
- `web/`: Angular 22+ frontend module
- `.github/agents/`, `.agents/rules/`, `scripts/`: Agent configurations and tooling

### 5.1 Branching Strategy (Gitflow)

- `main`: Production-ready code; each merge receives an annotated semantic version tag (`vX.Y.Z`).
- `develop`: Primary integration branch; base for all new feature and bugfix branches.
- `feature/<name>`: New features, branched from `develop` and merged into `develop`.
- `bugfix/<name>` or `fix/<name>`: Bug fixes, branched from `develop` and merged into `develop`.
- `release/<version>`: Release preparation and stabilization, merged into `main` and `develop`.
- `hotfix/<name>`: Critical emergency fixes directly from `main`, merged into `main` and `develop`.
- `support/<version>`: Long-term maintenance branches from historical release tags.

### 5.2 Conventional Commits

All commit messages must follow the Conventional Commits specification in **English**:

```text
<type>(<scope>): <clear, imperative description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`.

---

## 6. Three-Tier Boundaries

To prevent destructive mistakes and ensure high-velocity delivery, all agents must operate within these boundaries:

### ✅ Always Do

- Write all documentation, commit messages, code comments, and agent definitions in **English**.
- Retain Portuguese domain naming for business entities, tables, and attributes (`Mouse`, `Marca`, `TipoConexao`, `dataCadastro`).
- Keep `application.properties.example` updated with mock configurations while excluding active `application.properties`.
- **Provide the Gitflow branch creation commands (`git checkout develop && git pull --ff-only origin develop && git checkout -b feature/<name>`) before starting any new feature or fix implementation.**
- Separate `git commit` commands from `git push` commands in delivery outputs.
- Target `develop` as the base branch for feature and bugfix Pull Requests.
- Verify that every package generated by the packaging script strictly excludes `.git`, `node_modules`, `target`, `.angular`, and secrets.

### ⚠️ Ask First

- Before altering existing Flyway migrations (`V1__...`, `V2__...`); always create a new incremental migration (`V3__...`).
- Before modifying or removing existing endpoints and breaking frontend contracts.
- Before introducing external state management libraries (e.g., NgRx) or alternative persistence frameworks.

### 🚫 Never Do

- Never commit secrets, database passwords, private keys, or active `application.properties`.
- Never execute `git push`, force pushes (`git push -f`), or `gh pr create` automatically without explicit user authorization.
- Never package `node_modules`, `target`, or `.git` in release submission archives.
- Never allow REST Resources to bypass the Service layer and query Panache Repositories directly.
- Never delete or remove failing tests unless authorized by the user.

---

## 7. Mandatory Delivery Report Structure

Upon completing any implementation or task, provide a structured delivery report containing the following seven sections:

1. **Outcome:** Clear description of delivered behavior, features, and fulfilled criteria.
2. **Changed Files:** Categorized list of edited files (Documentation, Database/Migrations, Backend, Contracts, Frontend, Tests, Scripts).
3. **Database Impact:** Flyway migrations created, schema modifications, data effects, or confirmation of zero impact.
4. **Executed Validations:** Commands run, individual test results, and any checks skipped or deferred.
5. **Risks or Pending Items:** External dependencies, known limitations, or architectural decisions requiring alignment.
6. **Git Status:** Active branch, working tree status (staged/unstaged/untracked), and confirmation of preserved unrelated work.
7. **Suggested Git & GitHub CLI Commands:** Clean, copy-pasteable blocks formatted as follows:

```bash
# 1. Verify branch and status
git branch --show-current
git status --short
```

```bash
# 2. Stage specific task files
git add <file1> <file2>
```

```bash
# 3. Validate staged diff
git diff --cached --check
git diff --cached --stat
git diff --cached
```

```bash
# 4. Commit using Conventional Commits
git commit -m "<type>(<scope>): <concise description>"
git status --short
git log -1 --oneline
```

```bash
# 5. Remote push (isolated command block)
git push -u origin <branch-name>
```

```bash
# 6. Suggested Pull Request via GitHub CLI
gh pr create \
  --base develop \
  --head <branch-name> \
  --title "<type>(<scope>): <concise description>" \
  --body "## 📌 Summary\n...\n\n## 🧪 Validations\n..."
```

---

## 8. Educational Package Generation Standard

Whenever submitting the project for teacher evaluation or grading:

1. Run `python3 scripts/package_release.py`.
2. Ensure the generated ZIP is stored outside `api/` and `web/`.
3. Report the package path, compressed size, uncompressed size, compression ratio, file count, and SHA256 checksum.
4. Verify the exclusion checklist using `unzip -l`.
