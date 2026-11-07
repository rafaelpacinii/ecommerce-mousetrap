# External dependency inventory

Source review: 2026-11-07. No private deployment configuration was inspected.

| Dependency | Runtime impact | Current resilience / remaining work |
| --- | --- | --- |
| ViaCEP | Optional address autofill; legacy API writes omitting `codigoIbge` | New forms validate via local municipalities. Connection/request timeouts remain 5/8 seconds. Freight no longer calls ViaCEP. Legacy callers must adopt the additive field to gain independence. |
| IBGE localities | Reference data preparation only | Reviewed snapshot is included in V10; no live lookup during registration, build or startup. Updates require a new reviewed migration. |
| Cloudflare R2 / catalog image hosts | Image upload and image delivery | Bounded upload timeouts; product image component has an accessible unavailable state. No secondary storage provider configured. |
| Keycloak | Login, account registration, recovery and token refresh | Deployed as owned infrastructure in Compose. Public catalog requests avoid token refresh; protected access remains closed on authentication failure. Availability/backup operations remain necessary. |
| SMTP | Confirmation and recovery email | Local Mailpit captures development/test mail. Real deployment requires configured delivery; no production provider inferred. |
| PostgreSQL | Catalog, profile, orders and local location data | Owned infrastructure, transactional authority; not an optional enrichment service. Backups and availability remain operational responsibilities. |
| npm / Maven / container registries | Dependency installation and builds | Not required for each runtime address request. Local caches do not guarantee a fresh offline build. |
| GitHub Actions / GHCR | CI and deployment artifact publication | Delivery dependencies, not customer request dependencies. |

Payments are local demonstrations; external gateways, carrier APIs and webhooks
remain planned. Material icons are local. No current Google Fonts request was
identified in application assets; old documentation mentioning build-time fonts
was stale. QR generation runs locally through the bundled library.

The current change addresses the approved address/freight scope. It does not
introduce secondary identity/storage/payment providers or change their policies.
