# Cloudflare R2 catalog images

MouseTrap uploads product photos and brand logos through the authenticated API.
The browser never receives R2 credentials. Images are public catalog assets;
customer documents and other private content must not use this bucket.

## Create the Cloudflare resources

1. Open **R2 Object Storage → Create bucket** in the Cloudflare dashboard.
   A suggested name is `mousetrap-images`. Use Standard storage for catalog assets.
2. In the bucket's **Settings**, enable **Public Development URL** for local
   testing and copy its exact `https://pub-….r2.dev` address. For production,
   connect a **Custom Domain**, for example `https://images.example.com`.
   The `r2.dev` address is rate limited and intended for development.
3. Open **Manage R2 API Tokens**, create an account or user API token with
   **Object Read & Write** permissions scoped to this bucket only, and save
   the **Access Key ID** and **Secret Access Key** privately. These are S3
   credentials, not the Cloudflare management bearer token.
4. Copy the bucket's **S3 API endpoint**, typically
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`. Use the exact endpoint shown
   in the dashboard for jurisdiction-specific buckets. Do not append the bucket
   name to this endpoint.

The S3 endpoint and the public image address serve different purposes: the API
authenticates writes against the former and stores permanent image URLs using
the latter. Public access permits reading, not anonymous writes. No browser PUT
or bucket CORS policy is needed for this implementation: uploads go to Quarkus,
and normal image elements load the public URLs directly.

## Local API configuration

The recommended setup uses the ignored `.env` at the repository root. Copy the
R2 section from `.env.example`, fill its values privately, and change
`R2_ENABLED=false` to `R2_ENABLED=true`.

Quarkus reads `.env` from its working directory. When starting it from `api`,
create a local link to reuse the root file (from the repository root, in fish):

```fish
# Only create this link when api/.env does not already exist.
ln -s ../.env api/.env
```

Both paths are ignored by Git. The link is local configuration and must be
recreated on another computer after restoring the private root `.env`. Do not
replace an existing `api/.env` without reviewing its contents first.

For environments that cannot use links, set the six R2 variables directly in
the API process, or use the following properties in the existing ignored
`api/src/main/resources/application.properties` instead:

```properties
storage.r2.enabled=true
storage.r2.endpoint=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
storage.r2.bucket=mousetrap-images
storage.r2.access-key-id=YOUR_R2_ACCESS_KEY_ID
storage.r2.secret-access-key=YOUR_R2_SECRET_ACCESS_KEY
storage.r2.public-url=https://pub-YOUR_PUBLIC_ID.r2.dev
quarkus.http.limits.max-body-size=6M
```

Older local `application.properties` files can still override the shared HTTP
limit with `1M`; change that line to `6M`. Do not duplicate storage settings
across the local properties and `.env` unless you intend those overrides.

The public URL must be HTTPS and must not contain a query string or credentials.
Restart the API after changing storage settings. The shared configuration and
example file also support these environment variables:

| Environment variable | Purpose |
| --- | --- |
| `R2_ENABLED` | Enable upload (`false` by default) |
| `R2_ENDPOINT` | HTTPS S3 API endpoint |
| `R2_BUCKET` | Existing bucket name |
| `R2_ACCESS_KEY_ID` | S3 access key, secret configuration |
| `R2_SECRET_ACCESS_KEY` | S3 secret key, secret configuration |
| `R2_PUBLIC_URL` | Public bucket root or custom domain |

For Docker Compose, add these variables to the private Compose environment
file used by your stack. `docker-compose.yml` passes them only to the API;
release builds exclude the local `application.properties`. Do not replace the
existing environment file or lose its database/identity settings. An `.env`
file at the repository root is not automatically exported to a manually started
Quarkus process in `api`; use the local link above, local properties or exported variables.

In fish, start the API from the repository root with:

```fish
cd api
./mvnw quarkus:dev
```

Check the ignore rule before committing:

```fish
git check-ignore .env api/.env api/src/main/resources/application.properties
```

## Administration workflow

- **Mouses:** open `/admin/mouses/novo` or edit a mouse. Select or drag photos
  into **Enviar fotos do produto**. Multiple selection uploads sequentially,
  up to 12 gallery entries in total, including existing URLs. The first image
  is the cover; use the existing ordering controls and describe each view.
- **Brands:** open `/admin/marcas/novo` or edit a brand. **Enviar logomarca**
  accepts one file. A subsequent upload replaces the form's logo; **Remover
  logomarca** clears it. Save the brand to persist either change. Logos appear
  in the administrative list and on the product detail page.
- PNG, JPEG and WebP are accepted, with a maximum of **5 MiB per file**.
  The API checks actual size and file signatures against the declared media
  type. SVG and other formats are rejected. This is signature validation, not
  image transcoding or a full decoder check.
- Saving is blocked while uploads run. Failed batches retain already uploaded
  entries; retry only the remaining files. Existing URL-based mouse galleries
  remain supported.

## API and persistence

`POST /imagens/{destino}` requires the `admin` role, accepts
`multipart/form-data` with one `arquivo` file, and returns `201 {"url":"…"}`.
The only destinations are `mouses` and `marcas`. Resources call the storage
service; credentials and the S3 SDK remain server-side. Files receive random
UUID keys under their destination prefix, with detected extensions, explicit
image Content-Type and immutable cache headers. Request timeouts bound failures.

Missing/invalid files return a 400 Problem Details response. Disabled,
unconfigured or unavailable storage returns a 503 image-specific response.
The HTTP envelope limit is 6 MiB to accommodate multipart overhead; each file
is still limited to 5 MiB. Any upstream proxy must allow at least that envelope.

`V8__adicionar_logomarca.sql` adds nullable `marca.logomarca_url` (2048 characters).
`MarcaDTO` and `MarcaResponseDTO` add optional `logomarcaUrl`. Old requests that
omit it (or send null) preserve a saved logo; an empty string explicitly removes
it. Existing brands start without a logo. Mouse images continue using the
existing ordered `imagem_mouse` collection and contracts.

Uploads and entity saves are separate operations: saving creates the database
reference, not the R2 object. Cancelled drafts, replacements and removed photos
can leave unreferenced objects in R2. This version deliberately does not delete
objects automatically, because URLs may still be used by another record or an
order snapshot. Clean up only after checking all references and backups; do not
apply blanket lifecycle expiration to these permanent catalog prefixes.
Changing the public domain later requires updating existing database URLs;
changing `R2_PUBLIC_URL` alone affects only new uploads.

## Verification and release scope

Tests use the isolated catalog database and a fake S3 client; no Cloudflare
account is contacted. They cover authorization, multipart validation, upload
failure handling, object metadata/bytes, unique keys, brand logo persistence,
old-client compatibility, client upload limits and save blocking.

After configuring a new account, upload a photo and logo as an administrator,
save both records, reopen them, and verify that public image URLs load in a
private browser window. Confirm replacement and removal affect only the
intended brand.

Implementation validation on 2026-10-17:

- 19 selected backend tests passed against the isolated PostgreSQL database,
  including migration V8, catalog compatibility, authorization and upload checks.
- 127 frontend tests passed across 26 files; two existing routing expectations
  were updated to identify the homepage independently of carousel copy.
- Browser checks with mocked API/auth passed for brand upload/save/removal and
  mouse batch upload/reordering/save, four desktop/mobile screens and four Axe
  accessibility audits.
- A separate live check used the production storage service with the private
  local configuration: authenticated R2 upload succeeded, public GET returned
  HTTP 200 with identical bytes, and the temporary object was deleted.
  No catalog records or existing R2 objects were changed by that check.
- Local setup enabled R2 and linked `api/.env` to the root `.env`; both remain
  excluded from version control. Restart the API to load the configuration.

This is compatible new functionality and requires a **MINOR** release (target
`v1.1.0` from the `v1.0.0` baseline, together with other unreleased features).
Application version manifests are updated only during release preparation.

Official references:

- [Public buckets and custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [R2 API credentials and permissions](https://developers.cloudflare.com/r2/api/tokens/)
- [AWS SDK for Java configuration](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-java/)
- [Quarkus multipart uploads](https://quarkus.io/guides/rest/#handling-multipart-form-data)

- [Quarkus configuration and local .env files](https://quarkus.io/guides/config-reference/)
