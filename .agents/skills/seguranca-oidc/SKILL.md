---
name: seguranca-oidc
description: "Implement or review MouseTrap backend Keycloak OIDC validation, identity-subject ownership, local account linkage and role authorization."
---

# Backend OIDC security

1. Read [authentication](../../../docs/others/authentication.md), [policy](../../../AGENTS.md),
   `api/src/main/resources/META-INF/microprofile-config.properties`, the public
   realm definition and affected identity/customer services. Read examples, not secrets.
2. Preserve realm `mousetrap`, API client/audience `mousetrap-api`, JWT-only token
   validation and `realm_access/roles`. Discover issuer URLs from the configured
   topology; do not invent production URLs or loosen issuer/audience verification.
3. Resolve the local customer from verified `SecurityIdentity` subject. Preserve
   explicit account linking, verification and existing active-account rules.
   Neither matching email nor request-supplied customer ID proves ownership.
4. Check service/resource roles and subject scope for profiles, saved addresses,
   orders and wishlists. The project is single-store: tenant isolation examples
   map to customer ownership, not a new tenant or organization mechanism.
5. Test unauthenticated/invalid identity, insufficient role, cross-customer access,
   inactive-account paths where implemented, and legitimate admin operations.
   Distinguish mocked role tests from real token-signature/issuer integration tests.
6. Run API checks and relevant browser PKCE checks. Never log tokens or credentials,
   reset realms/users, widen CORS or silently grant privileges to make a test pass.
   Record evidence and any provider-dependent untested paths in `TASK.md`.
