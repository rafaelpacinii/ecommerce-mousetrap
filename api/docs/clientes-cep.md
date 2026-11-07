# Customers, addresses and optional postcode autofill

## Current contract

All existing customer/profile/address routes remain available. Administrative
`ClienteDTO`, self-service `PerfilClienteDTO` and `EnderecoDTO` accept an additional
optional `codigoIbge` (exactly seven digits). New web forms always send it.

```json
{
  "apelido": "Casa",
  "destinatario": "Cliente MouseTrap",
  "cep": "01001000",
  "codigoIbge": "3550308",
  "logradouro": "Praça da Sé",
  "bairro": "Sé",
  "numero": "10",
  "complemento": "Apto 1",
  "principal": true
}
```

With `codigoIbge`, the backend validates the municipality against PostgreSQL and
derives its UF locally. Unknown/malformed codes return `400` with field errors.
No external request is made. CEP is normalized to eight digits, and the existing
required text/length rules, subject ownership and principal-address rules remain.
This path does not certify that the CEP exists or corresponds to the selected city.

Older requests without the field retain ViaCEP resolution/upsert. A deployment
must update the web client to remove that legacy runtime dependency. Existing
response structures (`municipio` with nested `estado`) remain unchanged.

## Local reference data

- `GET /localidades/estados`: 27 local Brazilian UFs.
- `GET /localidades/estados/{uf}/municipios`: local municipalities for a valid
  uppercase UF, sorted by name/code. Invalid UFs return `400`.
- Both are public read-only routes through Resource → Service → Repository.
- V10 seeds 5,571 official municipalities from
  [IBGE Localities](https://servicodados.ibge.gov.br/api/docs/localidades), retrieved
  on 2026-11-07. Source URL and SHA256 are recorded in the migration header.
- Existing municipality IDs, names, state links and foreign references are retained
  with `ON CONFLICT (codigo_ibge) DO NOTHING`. No schema change, deletions or live
  data download occurs. Use a new reviewed migration for future reference updates.

## Optional lookup and freight

`GET /ceps/{cep}` still validates eight digits and calls ViaCEP with 5-second
connection and 8-second request limits. Malformed/not-found CEPs return `400`;
invalid responses and outages return `503` as `application/problem+json`.
The UI keeps manual entry available, retains typed data and cancels stale requests.

`GET /ceps/{cep}/frete` now validates format and computes the configured local
estimate without an external lookup. Its existing fields/units are retained;
`localidade` and `uf` are empty strings when only the CEP is known, and the UI
shows the CEP. A well-formed but unverified CEP can receive an estimate.
Checkout uses the owned saved municipality and server configuration to calculate
freight, preserving drift detection, snapshots, stock locks and idempotency.

## Rollout and recovery

Back up the target database before deployment. Deploy API/V10 before the new web
client. The insert-only migration preserves compatibility with the previous API;
application rollback can retain the new rows. Never delete referenced data or edit
an applied migration. V10 occupies the next available version; planned category and
later migrations move to V11–V16 as recorded in
[ADR 0003](../../docs/adr/0003-independent-address-registration.md).

Verification evidence is in [TASK.md](../../TASK.md). Tests must use isolated
PostgreSQL; production and private developer configuration must remain untouched.
