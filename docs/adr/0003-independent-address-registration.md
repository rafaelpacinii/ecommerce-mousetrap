# ADR 0003 — Independent address registration and freight

- Status: accepted
- Date: 2026-11-07
- Scope: user-approved BR-CLI-04 replacement and removal of ViaCEP from freight

## Context

Both address writes and checkout freight required ViaCEP, so an external outage
prevented registration and purchases even with saved addresses. The user explicitly
approved manual entry validated against a local municipality catalog.

## Decision

- Add optional `codigoIbge` to administrative customer, self-service profile and
  address inputs. Resolve the municipality and its UF locally when supplied;
  reject unknown codes. Do not trust browser-supplied names/UFs as authoritative.
- Preserve the legacy CEP-only request path for backward compatibility. New web
  forms always send the selected code. Optional autofill retains existing errors.
- Seed 5,571 official IBGE municipalities with the next available migration, V10.
  Include data in SQL, never fetch during startup or customer requests. Preserve
  all existing codes, IDs, names, state links and address/order references.
- Allocate future planned E2–E7 migrations V11–V16; their feature/release scope
  remains unchanged. Historical ADR 0002 retains the original numbering.
- Expose public read-only localities endpoints, with municipalities filtered by UF.
  The largest state list is a finite reference catalog; no unbounded text search.
- Keep the current configured freight value/deadline on the server in a dedicated
  service. Public postcode estimates contain empty city/UF strings; checkout
  supplies the owned address's municipality. No provider or new pricing is added.
- Preserve entered fields on failures or CEP edits; cancel pending autofill when
  manual input starts, another address is opened, or the component is destroyed.

## Tradeoffs and operations

Manual entry validates postcode syntax and municipality existence, not postal
existence or the correspondence between CEP and municipality. The UI asks users
to review their address. Municipality data updates are reviewed deployments.

A second lookup provider or cache would still leave uncached addresses dependent
on network availability. Neither is required for the approved solution.

V10 is an insert-only data migration with no schema changes. Old readers/writers
remain compatible. A backup before rollout is still required. Roll back application
code while retaining seed rows; never remove referenced municipalities or edit V10.
Any correction uses a new forward migration after reviewing affected references.

## Verification

API tests cover local reference data, manual admin/profile/address writes during
an upstream 503, invalid codes/CEPs, ownership and checkout replay/stock behavior.
Web tests cover cancellation, local selection/retry and old-address editing.
Disposable browser tests combine manual entry during outage, optional autofill,
editing, checkout, responsiveness and Axe. Actual execution is recorded in TASK.md.
