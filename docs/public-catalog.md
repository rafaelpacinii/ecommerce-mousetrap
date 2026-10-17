# Public Catalog, Product Images and Gaming Specifications

This second implementation slice adds public browsing and product detail screens
without replacing existing administrative routes or removing their HTTP fields.
Visual references: wireframes 02, 03, 10 and 11 in [the wireframe index](ui-wireframes/README.md).

## Delivered behavior

- `/catalogo`: responsive product grid, mobile filter panel, name search,
  combined technical/price filters, supported sorting and server pagination.
- `/catalogo/:id`: functional resolver, ordered gallery with selectable
  thumbnails, specifications, current price and stock status, accessible image
  fallbacks, missing/unavailable states, network retry and product metadata.
- Homepage product previews now read the public API and link to the full catalog
  and product details. Header/footer catalog links follow the new route.
- Existing `/mouses`, `/mouses/novo`, `/mouses/editar/:id`, brand and customer
  routes remain available under the administrative layout.
- Administrative product forms manage gaming specifications and up to twelve
  images, including accessible descriptions, previews, cover selection by
  reordering, and removal. The brand selector loads all pages.
- Administrative lists display product thumbnails and specifications.
- Loading progress is exposed during route resolution. Pagination labels use
  Brazilian Portuguese. Material Icons and the custom brand mark are preserved.

## Public API

All resources use the service/repository layers. Public reads include only
products whose own `ativo` flag **and** their brand's flag are true. The same
visibility rule applies to detail lookup and facet data. Inactive, deleted and
unknown product IDs return RFC 7807 404 responses from the public detail route.
Active products without stock remain visible with an unavailable status unless
the visitor enables the stock filter.

| Method | Path | Result |
| --- | --- | --- |
| GET | `/catalogo/mouses` | Paged public product projections |
| GET | `/catalogo/mouses/{id}` | Public product detail, including images/specifications |
| GET | `/catalogo/filtros` | Active catalog brands, sensor names, available polling rates and domain choices |

The public projection omits administrative product `ativo` and `versao` fields.
The existing `/mouses/**` endpoints keep their original behavior and add the
new optional specification/gallery fields to responses.

### Query parameters

| Parameter | Meaning |
| --- | --- |
| `nome` | Case-insensitive literal substring in product name; up to 150 characters |
| `marca` | Repeated positive brand IDs, e.g. `marca=1&marca=2` |
| `sensor` | Case-insensitive exact sensor name |
| `conexao` | Repeated connection IDs: 1 USB, 2 Bluetooth, 3 receiver |
| `pegada` | Repeated grip IDs: 1 Palm, 2 Claw, 3 Fingertip |
| `pollingRateMin` | Minimum reporting rate, between 125 and 8000 Hz |
| `tipoSwitch` | 1 optical or 2 mechanical |
| `pesoMax` | Positive maximum weight in grams |
| `precoMin`, `precoMax` | Nonnegative price boundaries; maximum cannot be below minimum |
| `emEstoque` | Boolean; default `false` |
| `ordenar` | `nome` (default), `menor-preco`, `maior-preco`, `menor-peso`, `maior-dpi`, `recentes` |
| `page`, `pageSize` | Zero-based page; size 1–100, default 12 |

Groups combine with AND; multiple choices inside a group combine with OR.
Collection filters use subqueries so a multi-mode/multi-grip mouse appears only
once and totals remain correct. Sort expressions come from a whitelist and have
an ID tie-breaker. Invalid filter ranges, enum IDs, page sizes and sort keys return
400 Problem Details. Queries use parameters rather than user-supplied HQL.
Best-selling order is not offered because sales data does not exist yet.

The browser URL retains filters, sort, page and page size. Applying filters or
changing sort resets the page. Clear removes the query. Browser navigation and
direct links restore the form; an out-of-range page returns to the first page.
Requests are canceled when a newer URL/search supersedes them, and retry works
without requiring a URL change.

## Administrative write contract and compatibility

Existing required mouse fields and version checks remain unchanged. Two optional
fields extend `MouseDTO`:

```json
{
  "especificacoes": {
    "sensor": "PAW3395",
    "pollingRate": 8000,
    "tipoSwitch": 1,
    "modeloSwitch": "Optical Gen 3",
    "pegadas": [2, 3]
  },
  "imagens": [
    {
      "url": "https://example.com/products/mouse-top.webp",
      "textoAlternativo": "Black mouse viewed from above",
      "ordem": 0
    },
    {
      "url": "/images/mouse-side.webp",
      "textoAlternativo": "Left side showing the thumb buttons",
      "ordem": 1
    }
  ]
}
```

This fragment must be combined with the existing mouse payload; it is not a
standalone create request. `tipoSwitch` and grip values are numeric on input
and `{id, label}` objects on output. Specifications permit missing information
instead of manufacturing facts for existing products. Stored reporting rates
are restricted to 125, 250, 500, 1000, 2000, 4000 or 8000 Hz.

On update, omitted/null `especificacoes` or `imagens` preserve those existing
values for older clients. Providing `especificacoes` replaces the whole
specification group and permits clearing its optional values. Providing
`imagens` replaces the gallery; `[]` removes it. The request still requires the
last read mouse version, including gallery-only edits. Replacement is atomic and
releases old unique order values before inserting new rows. Image IDs can change
when a gallery is replaced.

## Image handling

This slice implements **URL management**, not binary upload or external storage
integration. Images must use HTTP(S) URLs with a valid host or root-relative
paths. The API validates lengths, required alternative text and nonnegative,
unique order values, but never downloads remote images. Maximum gallery size is
twelve. The lowest order is the cover; the UI provides move buttons to choose it.

The browser uses the supplied alternative text, reserves image space, loads card
images lazily and gives the main detail image priority. Missing images and load
failures show a labeled Material icon. Selecting another thumbnail recovers from
a failed image. No example images or QA products are inserted into the user's
development database. Remote image availability remains the content owner's
responsibility; application asset paths must exist in the hosted frontend.

## Database migration

`V3__catalogo_publico_imagens_especificacoes.sql` adds nullable specification
columns to `mouse`, the `mouse_pegada` element-collection table, the
`imagem_mouse` entity table and indexes for active price/weight queries.
It does not modify V1/V2, delete catalog data, invent technical values or seed
products. Existing products remain readable with empty galleries/specifications.

`ImagemMouse` inherits `DefaultEntity`. Grip/switch enums have stable IDs,
Portuguese labels, JPA converters and matching database constraints. Images
belong to their product and are removed with it. Other business relationships
and the existing optimistic-locking contract remain unchanged.

Flyway applies V3 on the next configured API startup. During implementation it
was applied and validated only against a disposable PostgreSQL 16 test database
on port 55439; the development database was not targeted by agent commands.

## Validation

- Backend: existing and new HTTP tests cover combined filters, deterministic
  pagination, enum conversions, public visibility/facets, legacy payloads,
  image validation/replacement/removal and stale versions.
- Frontend: URL filter restoration/reset, stale request cancellation, retry,
  invalid ranges, page recovery, image fallback, public resolver errors, ordered
  galleries, structured data cleanup and administrative gallery/spec payloads.
- Chromium integration used a temporary Quarkus instance on port 18080 connected
  exclusively to the disposable database. A local forwarding layer connected
  browser requests to that instance; domain responses were generated by the real
  API, not static mocks. It checked public filters/sort/paging, gallery and
  unavailable states, network recovery, and administrative create/edit flows.
- Responsive checks covered 1440, 1024, 768, 375 and 320 px with no horizontal
  overflow or browser JavaScript exceptions.

The first integrated run created QA records only in the disposable database;
the database is removed after validation. Final results: **18 backend tests passed**, **31 frontend tests passed across 11
files**, and the production frontend build passed within all configured budgets.
`./mvnw clean verify` also built the JVM application; Failsafe tests remain skipped
by the repository's existing `skipITs=true` setting, while HTTP tests ran through
Surefire. The final Chromium run also checked the packaged JVM application and
Portuguese pagination labels. Standard verification commands:

```sh
cd api
./mvnw test
```

```sh
cd web
npm test -- --watch=false
npm run build
```

Use an isolated database as described in the API README when running backend
tests. Authentication remains the next implementation slice. Cart, checkout,
freight quotes and payments are subsequent work; this slice does not expose
nonfunctional purchase controls or promise delivery/payment terms.

## Authentication slice update

Public catalog and CEP reads remain anonymous. Administrative reads/writes now
require `admin`; old frontend CRUD URLs redirect to `/admin/**`. This supersedes
any descriptions above of authentication being planned. See
[authentication and ownership](authentication.md) for the complete access matrix.
