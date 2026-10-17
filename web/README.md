# MouseTrap — Web

Angular frontend for the MouseTrap gaming mouse store. The homepage includes a
responsive hero, grip guide and searchable preview of real catalog products.
Separate administrative screens manage brands, mice, images, specifications and customers.
The full public catalog is at `/catalogo`; product detail is at `/catalogo/:id`.

## Features

- Storefront at `/`, with SVG branding, responsive navigation and footer.
- Brand colors mapped to Angular Material M3 and shared interface styles.
- Optimized responsive WebP hero with the “Precisão absoluta…” heading.
- Expandable grip guides and up to three active products per name search.
- Catalog preview loading, empty, error and retry states.
- Administrative CRUD with validated reactive forms, edit resolvers, deletion
  confirmation, success notifications and API error handling.
- Server-side pagination/name search for administrative brand and mouse lists.
- Mouse brand, multiple connection types, stock, price and version handling.
- Customer registration/address editing with ViaCEP lookup and validation.
- BRL formatting, semantic navigation and keyboard focus styles.

Public catalog facets, product galleries and gaming specifications are implemented.
Authentication, owned profiles and role-based administration are implemented.
Cart, checkout and order tracking remain planned. Missing or
failed product images use an accessible fallback. Administrative routes require an authorized account.

See [Homepage implementation](../docs/homepage.md) and the
[implementation backlog](../docs/implementation-backlog.md), and
[public catalog contracts and behavior](../docs/public-catalog.md).

## Development

Use a Node.js version compatible with the Angular version in `package.json`,
npm, and the API running at `http://localhost:8080`. From `web`:

```sh
npm ci
npm start
```

Open `http://localhost:4200`. The homepage works without catalog data and shows
an empty/error state as appropriate. Create a brand before the first mouse in
administration after signing in with an admin account. Public runtime settings
are defined in `public/config.json`; no credentials belong in this file.
Start the local [identity stack](../docs/authentication.md) before signing in.

| Page | Route |
| --- | --- |
| Homepage | `/` |
| Catalog preview/search | `/#catalogo`, `/#busca` |
| Public catalog and product detail | `/catalogo`, `/catalogo/:id` |
| Grip guide | `/#pegadas` |
| Brand list/create/edit | `/admin/marcas`, `/admin/marcas/novo`, `/admin/marcas/editar/:id` |
| Mouse list/create/edit | `/admin/mouses`, `/admin/mouses/novo`, `/admin/mouses/editar/:id` |
| Customer list/create/edit | `/admin/clientes`, `/admin/clientes/novo`, `/admin/clientes/editar/:id` |

Administration links appear for authorized operators. Legacy CRUD paths redirect
to `/admin/**`. Login and registration are at `/login` and `/cadastro`; the owned
profile/address form is at `/minha-conta`. Credentials and recovery are handled by
the branded identity provider forms.

## Structure

```text
src/app/
├── components/
│   ├── storefront/  Homepage, catalog, detail, product cards and image fallback
│   ├── marcas/      Brand list and form
│   ├── mouses/      Mouse list and form
│   └── clientes/    Customer list and form
├── layouts/         Storefront and legacy administration layouts
├── models/          Typed contracts
├── services/        HTTP communication and error mapping
├── resolvers/       Edit data loading
├── app.routes.ts
└── app.config.ts
```

Components are standalone and use Angular Material, Reactive Forms and HttpClient;
the homepage's simple search uses FormsModule. Versions and package manager are
defined in `package.json`, with resolved dependencies in `package-lock.json`.

## Validation and deployment

```sh
npm test -- --watch=false
npm run build
```

Tests use Vitest. The production output is in `dist/web/browser`. Font inlining
is disabled, so builds do not require Google Fonts access. Material interface icons use a local font and do not require Google Fonts
at runtime; see [Material Icons](../docs/material-icons.md). Configure hosting
to serve `index.html` for SPA routes, and align the API URL and CORS with the
hosting environment. See [authentication and deployment requirements](../docs/authentication.md).

## Customer addresses

The customer form accepts CEP with or without punctuation. A successful lookup
fills city/state and permits completing street, neighborhood, number and optional
complement. Changing the CEP cancels the previous lookup and invalidates its
address result. Backend validation determines municipality/state from ViaCEP;
create/edit operations depend on that service's availability.

## Related documentation

- [API execution and tests](../api/README.md).
- [Catalog contracts and rules](../api/docs/catalogo.md).
- [Customer and CEP contracts](../api/docs/clientes-cep.md).
- [Domain planning](../api/docs/modelagem/README.md).
- [Website icon assets](public/icons/README.md).
