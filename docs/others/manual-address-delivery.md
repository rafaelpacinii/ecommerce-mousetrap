# Independent address registration — delivery

## Outcome

Manual address entry now works without ViaCEP in administrative customer forms,
self-service onboarding and saved-address editing. Optional autofill is cancellable
and never clears entered fields on failure. Local states/municipalities come from
PostgreSQL. Public freight estimates and checkout no longer call ViaCEP.

## Files by category

- API contracts and behavior: customer/profile/address DTOs, ClienteServiceImpl,
  localities Resource/Service/Repository chain, FreteService and Cep/Pedido delegation.
- Database: V10__popular_municipios_ibge.sql (official snapshot and source checksum).
- Web: shared LocalidadeSelectComponent, localities service, customer/address forms,
  models, public-localities interceptor handling and postcode-based freight labels.
- Verification: API locality/manual/ownership/checkout regressions, Angular form,
  selector/route/interceptor tests, disposable ViaCEP fixture and Playwright purchase.
- Documentation: BR-CLI-04, freight clarification, ADR 0003, dependency inventory,
  API/web guides, system state, roadmap, sync script, PlantUML sources and PNGs.

## Database and rollout

V10 inserts missing rows for 5,571 official municipalities using existing tables;
existing IDs, names, state associations and FKs are unchanged. There are no drops,
new columns, altered applied migrations or live IBGE downloads. Existing clients
continue to work. Deploy API/V10 before the new frontend. Take a backup before
rollout; application rollback can keep the additive reference rows. Use a forward
migration for future data corrections. No development/production DB was changed.

V10 now belongs to this seed. Planned E2–E7 migration numbers move to V11–V16,
with their domain policies and release targets unchanged. No GitHub sync ran.

## Actual validation

- API preset: 60 tests passed, zero failures/errors/skips.
- Full API `./mvnw -B -Prelease clean verify`: passed; same 60 tests. Failsafe
  integration tests remain skipped by the existing `skipITs=true` configuration.
- PostgreSQL 16: fresh Flyway V1–V10 + Hibernate validation passed; separate V1–V9
  upgrade retained an existing municipality/customer FK and seeded 5,571 rows.
  Reapplying the insert did not duplicate rows or change the existing record.
- Web preset: typecheck and 135 tests across 27 files passed. Production build passed.
- Governance preset: passed. Python suite: 15 passed; roadmap tests (3) rerun after
  migration-number alignment passed. PlantUML syntax and both PNG renders passed.
- Browser: `sh scripts/verify_release.sh` passed all 5 tests, including real PKCE,
  manual first-address entry with upstream 503, optional autofill, secondary-address
  edit, checkout, ownership/fulfillment, 1440/1024/768/375/320 px and Axe.
  The runner removed only its disposable containers and volumes.
- Initial failures: inherited JAVA_HOME and sandbox Maven-cache permissions were
  resolved using the installed JDK 17 and approved test access. The first web run
  had an outdated route fixture (missing code/locality requests); corrected and
  rerun successfully. Build was also initially invoked from the repository root,
  then rerun successfully from web/. No dependency or test was removed.

## Limits

Manual entry verifies format and local municipality existence, not actual postal
existence or CEP/city correspondence. The UI requests address review. Legacy API
callers omitting `codigoIbge` still use ViaCEP; the new web sends it consistently.
Public freight estimates return empty city/UF strings and display the CEP; checkout
uses the saved municipality. Authentication, SMTP, storage and database operational
availability remain outside this change. No real payment/carrier provider was added.

## Git status and delivery commands

Branch: `feature/manual-address-resilience`. Changes are unstaged, new files are
untracked, nothing is staged. No commit, push, PR or deployment was executed.
The pre-existing `feature/manual-address-fallback` branch was preserved.

Review and selectively stage only this delivery (recheck status before executing):

```bash
git status --short --branch
git diff --check
git diff --stat
git add -- \
  TASK.md \
  api/README.md \
  api/docs/clientes-cep.md \
  api/src/main/java/br/unitins/tp2/dto/ClienteDTO.java \
  api/src/main/java/br/unitins/tp2/dto/EnderecoDTO.java \
  api/src/main/java/br/unitins/tp2/dto/PerfilClienteDTO.java \
  api/src/main/java/br/unitins/tp2/repository/MunicipioRepository.java \
  api/src/main/java/br/unitins/tp2/resource/LocalidadeResource.java \
  api/src/main/java/br/unitins/tp2/service/CepServiceImpl.java \
  api/src/main/java/br/unitins/tp2/service/ClienteServiceImpl.java \
  api/src/main/java/br/unitins/tp2/service/FreteService.java \
  api/src/main/java/br/unitins/tp2/service/FreteServiceImpl.java \
  api/src/main/java/br/unitins/tp2/service/LocalidadeService.java \
  api/src/main/java/br/unitins/tp2/service/LocalidadeServiceImpl.java \
  api/src/main/java/br/unitins/tp2/service/PedidoServiceImpl.java \
  api/src/main/resources/db/migration/V10__popular_municipios_ibge.sql \
  api/src/test/java/br/unitins/tp2/resource/AutorizacaoResourceTest.java \
  api/src/test/java/br/unitins/tp2/resource/ClienteResourceTest.java \
  api/src/test/java/br/unitins/tp2/resource/LocalidadeResourceTest.java \
  api/src/test/java/br/unitins/tp2/resource/PedidoResourceTest.java \
  docs/BUSINESS_RULES.md \
  docs/ROADMAP.md \
  docs/SYSTEM_STATE.md \
  docs/adr/0003-independent-address-registration.md \
  docs/modelagem/README.md \
  docs/modelagem/banco-de-dados.png \
  docs/modelagem/banco-de-dados.puml \
  docs/modelagem/diagrama-de-classes.png \
  docs/modelagem/diagrama-de-classes.puml \
  docs/others/external-dependencies.md \
  docs/others/manual-address-delivery.md \
  infra/testing/viacep.py \
  scripts/sync_roadmap.py \
  web/README.md \
  web/e2e/purchase.spec.ts \
  web/src/app/app.spec.ts \
  web/src/app/components/clientes/cliente-form/cliente-form.html \
  web/src/app/components/clientes/cliente-form/cliente-form.spec.ts \
  web/src/app/components/clientes/cliente-form/cliente-form.ts \
  web/src/app/components/shared/localidade-select/localidade-select.spec.ts \
  web/src/app/components/shared/localidade-select/localidade-select.ts \
  web/src/app/components/storefront/cart/cart.html \
  web/src/app/components/storefront/product-detail/product-detail.html \
  web/src/app/interceptors/auth.interceptor.spec.ts \
  web/src/app/interceptors/auth.interceptor.ts \
  web/src/app/models/cliente.model.ts \
  web/src/app/services/localidade.service.ts
git diff --cached --stat
git diff --cached
git commit -m "feat(addresses): support manual registration without ViaCEP"
```

Push separately, only when publication is authorized:

```bash
git push -u origin feature/manual-address-resilience
```

PR targets develop, also requiring publication authorization. A prepared body is
available at `/tmp/mousetrap-address-pr.md` for this session:

```bash
gh pr create --base develop --head feature/manual-address-resilience \
  --title "feat(addresses): support manual registration without ViaCEP" \
  --body-file /tmp/mousetrap-address-pr.md
```

## Source package

Generate with `python3 scripts/package_release.py`, inspect using
`unzip -l dist/mousetrap_submission.zip`. The final chat delivery reports the exact
archive size, uncompressed size, reduction, entry count and SHA256. Private
configuration, .git, node_modules, target and .angular are excluded.
