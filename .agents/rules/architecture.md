---
description: Architectural standards for Quarkus, Angular, and Keycloak in MouseTrap commercial gaming e-commerce.
globs: "api/**,web/**"
always_on: true
---

# Commercial Architecture & Code Rules — MouseTrap

- **Commercial Gaming Scope:** MouseTrap is a high-performance gaming mouse e-commerce. Features include optical sensors, polling rates up to 8000Hz, optical switches, ultra-light chassis, multi-mode connectivity, and grip ergonomic profiles.
- **Backend (Quarkus 3.15+, Java 17):**
  - **Inheritance:** Business entities inherit `DefaultEntity` (`id`, `dataCadastro`, `dataAlteracao`).
  - **Enums:** Must provide `id` (Integer), `label` (String), and JPA converters in `model.converterjpa`.
  - **Panache Repositories:** `@ApplicationScoped` classes implementing `PanacheRepository<T>`. Never access repositories directly from REST resources.
  - **DTO Separation:** Java Records strictly separated into `<Entity>DTO` (input validation) and `<Entity>ResponseDTO` (output with `valueOf(Entity e)`).
  - **Services:** Separate Interface (`<Entity>Service`) and Implementation (`<Entity>ServiceImpl`), `@Transactional` on mutations, throwing `ValidationException` for business errors.
  - **REST Resources:** JAX-RS endpoints returning standard `Response` (200, 201, 204) with `@Valid`.
  - **Security:** Keycloak OIDC integration via `quarkus-oidc` with `@RolesAllowed("admin")`, `@RolesAllowed("customer")`, `@Authenticated`.
- **Frontend (Angular 22+):**
  - **Standalone Components:** `standalone: true` on all components.
  - **Folder Structure:** Organized by feature under `src/app/components/<feature>/<feature>-list` and `<feature>-form`.
  - **Reactive Forms:** `FormGroup` with explicit validators, supporting both Create and Edit modes.
  - **Resolvers:** Functional route resolvers (`ResolveFn<T>`) preloading data before route activation.
  - **Route Guards:** Keycloak `authGuard` enforcing authentication and RBAC roles.
- **Delivery Report (Mandatory 7 Items):**
  1. Outcome / Result
  2. Changed files
  3. Database impact
  4. Executed validations
  5. Risks or pending items
  6. Git status
  7. Suggested Git & GitHub CLI commands
