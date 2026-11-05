---
name: armazenamento-s3
description: "Implement or review MouseTrap's S3-compatible Cloudflare R2 catalog uploads, validation, object keys and storage failure handling."
---

# S3-compatible catalog storage

1. Read [R2 setup](../../../docs/others/cloudflare-r2.md), [policy](../../../AGENTS.md),
   `ImagemResource`, `ImagemStorageServiceImpl`, `R2Config` and existing tests.
   Credentials stay in backend private configuration; never print SDK exceptions.
2. Preserve the approved adapter: AWS SDK S3 to Cloudflare R2, admin-only uploads,
   UUID keys under `mouses/` or `marcas/`, public immutable catalog image URLs.
   The teaching PDF's private-URL/tenant assumptions do not describe this project.
3. Keep the 5 MiB file/6 MiB HTTP limits, MIME-plus-signature checks for PNG/JPEG/
   WebP, HTTPS endpoint/public-base validation, safe paths and bounded SDK timeouts.
   Reject empty/mismatched/oversized data; never trust filenames or MIME alone.
4. Trace upload, response URL and later catalog association separately. Identify
   partial failure/orphan behavior; do not claim atomicity across PostgreSQL and
   object storage or add deletion/retention policy without a domain decision.
5. Test validation and SDK failure mapping using safe fixtures/fakes. Do not
   provision a bucket, change ACL/provider/retention or upload real objects merely
   to validate instructions. A live test needs authorization for its remote effects.
6. Run relevant API/web checks and record whether actual upload/public retrieval
   was exercised or mocked. Future processing/cleanup must limit decompression,
   preserve existing assets and delete only objects owned by that operation.
