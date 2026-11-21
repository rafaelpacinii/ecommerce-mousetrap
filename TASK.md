# Active task — Static homepage artwork and native scroll effects (2026-11-21)

- [x] Replace mouse playback with static artwork and native scrolling effects.
- [x] Verify the rightward brand marquee with edge fades and logo-only tiles.
- [x] Verify storefront interactions, artwork containment, and responsive motion.
- [x] Update homepage documentation and regenerate the submission archive.

Keep existing catalog queries, links, business rules and unrelated workspace changes.
Use native CSS view timelines for the editorial content and preserve static layouts
for reduced motion and unsupported browsers. Keep previous raw renders offline.
The final production build, 137 Angular tests, and six Chromium cases passed.
Browser checks covered five widths, scroll reversal, fixed artwork, the brand
loop seam, keyboard access, image-only tiles, and Axe. The local storefront
loaded its one registered logo from the real catalog. Governance, four packaging
tests, and diff checks passed. The regenerated `dist/mousetrap_submission.zip`
passed integrity checks with 539 files, 68,556,073 compressed bytes, and SHA-256
`a9ebd7b2eaa833e56343d417c36ebbbbe8f1414d23b8be9e3d02a7323c151eff`.

# Completed task — S3 image download and orphan cleanup (2026-11-21)

- [x] Deliver an attachment download for the selected public product image.
- [x] Deliver paginated admin inspection and deletion of R2 orphans with `BR-CAT-13` protection.
- [x] Verify the HTTP, concurrency, migration and Angular behavior with isolated fixtures.
- [x] Refresh storage guidance and regenerate the verified submission archive.

The scope covers image download and cleanup in the existing Cloudflare R2 adapter,
public gallery and catalog administration. Use a short PostgreSQL reservation
transaction before deleting from R2. Retain
reservations across ambiguous provider failures so a retry cannot break a new link.
Verification uses isolated test data and simulated storage.

Quarkus clean verify passed 65 tests on disposable PostgreSQL 18.6, including
fresh Flyway V1–V11, HTTP attachments, authorization, reference checks, grace
period, a concurrent save during deletion, retry, and S3 request construction.
Failsafe remains skipped by the repository configuration. Angular full-suite
failures in homepage and routing were reproduced from the earlier audit.

The Flyway upgrade from V10 to V11 preserved an existing brand logo URL and
enforced the new key constraint on a separate disposable database. Angular
production build and 11 focused tests passed. Governance and diff checks passed.
Chromium verified the cross-origin attachment bytes and admin confirmation and
deletion with simulated identity, catalog and storage at 1440, 1024, 768, 375,
and 320 px. Axe passed on both affected sections at all five widths.
The regenerated `dist/mousetrap_submission.zip` passed archive checks with
1,029 files, 75,576,686 compressed bytes, and SHA-256
`b70079bbbc53e8c6980f9f810146090b3deabfbc94e802f76dda4fe60af481af`.

# Superseded task — Automatic hero, animated content and catalog brands (2026-11-17)

## Objective and scope

The user requests an automatically animated mouse confined to the first section,
more varied component entrances AND exits below, and a brand showcase inspired by
https://www.serko.ai/. Keep category shelves, existing renders, shopping and identity
contracts. Use public catalog facets for real brands/logos, with no invented partners.
No API/schema/BR-* or dependency change. Preserve the dirty feature/home-scroll-redesign
branch and unrelated work; no staging, commit, push or publication.

- [ ] Inspect Serko, public brand contracts and existing motion/player behavior.
- [ ] Replace full-page scroll sequence with a bounded automatic hero and pause control.
- [ ] Add real brand showcase with loading/empty/error/logo-fallback and catalog links.
- [ ] Add distinct reversible exits without disrupting reading or keyboard interaction.
- [ ] Verify web, browser/Axe, responsive lifecycle and archive; update delivery docs.

Skills: angular-frontend, ui-frontend, testes-frontend, new-feature-workflow (already read).
Files: home hero/player, brands component, motion/styles, tests, home/ADR/state/wireframe docs.
Next: inspect Serko screenshots and implement hero lifecycle plus public brand showcase.

---

# Previous task — Refine homepage scroll choreography

## Objective and scope

The user approved the Blender frames and identified scrolling as the remaining issue.
Preserve all 240 desktop/mobile renders and fallback artwork. Diagnose and refine
scroll response, stage trajectory and frame delivery within existing GSAP/Canvas.
Keep native scrolling, reduced motion, responsive layout, shopping and footer limits.
No API/schema/business-rule/dependency change; no staging/commit/publication.
Preserve the dirty feature/home-scroll-redesign branch and unrelated auth/source work.

- [x] Reproduce scroll timing/trajectory issues with public browser fixtures.
- [x] Synchronize scene progress and correct evidenced frame-delivery discontinuities.
- [x] Review responsive forward/reverse motion, rapid seeks and layout refreshes.
- [x] Run web typecheck/unit/build and browser/Axe regression checks.
- [ ] Update behavior/delivery documentation and verified source archive.

User clarification: visible stutter/jumps are the priority. Browser samples reproduced
instant stage movement while rotation lagged; a new unit regression failed because
fast seeks waited behind three obsolete requests. Fixed a shared 160 ms scrub clock,
obsolete request cancellation, directional prefetch, async decoding, monotonic pose
selection and one canvas paint per RAF. Eight focused frame-delivery tests now pass.
Final typecheck, 142 tests / 28 files, production build and 11 browser/Axe cases
passed (49.3 s). Native-frame/footer checks cover 1440/1024/768/375/320 px. All 480
approved frame hashes and the unrelated auth edit remain unchanged. Initial bundle
347.83 kB; home lazy chunk 42.41 kB; no budget warnings.
Continuous-scroll review caught over-aggressive cancellation (74 distinct poses).
Preserving nearby decodes restored progress (178 poses in eight seconds, 204 RAF
callbacks, p95 50.1 ms). The final regression now checks that nearby decoding survives
continuous movement while large seeks still bypass obsolete requests. No 60 FPS claim.
Next: finish final checks, docs/governance and archive verification.
Applicable skills: angular-frontend, ui-frontend, testes-frontend, new-feature-workflow.

---

# Previous delivery — Real-3D Logitech homepage animation

## Objective and authorization (2026-11-14)

The user explicitly requests completing implementation using the supplied Logitech
G PRO X SUPERLIGHT GLB and installed Blender. Render the full coherent sequence,
replace the rejected AI/optical-flow assets, integrate matching fallbacks, inspect
motion and responsive layout, verify and package. No publication/staging/commits.
Preserve the dirty `feature/home-scroll-redesign` branch and unrelated auth/source work.

- [x] Benchmark and render all 240 continuous native-resolution transparent frames.
- [x] Encode/verify alpha WebP, source/frame hashes, manifest and matching fallbacks.
- [x] Integrate smaller mobile URLs, coherent Superlight fallback names, public CC BY 4.0
      attribution and calibrated stage scale/glass opacity. Final visual acceptance pending.
- [x] Inspect actual sequence/contact sheets and desktop/mobile page composition.
- [x] Run web typecheck/unit/build and public browser/Axe acceptance checks.
- [x] Update behavior/state/ADR/delivery, governance/diff and release archive evidence.

Files: offline Blender/render/export tools, sequence/fallback assets, home player,
scoped styles/tests, public media attribution and existing home documentation.
No API/schema/DTO/payment/price/BR-* change or application dependency is needed.

Source: `computer-mouse/source/SF Mouse.glb`, SHA256
`c03ccc8f0d762800cc58938c5e4cb433ab5c8237312790c5eff19c555dc9c7bc`.
13 meshes, 48,638 triangles, 10 materials, 12 embedded 4K images. Blender 4.5.16 LTS
is installed at `~/.local/bin/blender`; four Cycles proofs and a packed scene are
in `docs/others/homepage-product-render/`. The rejected AI sequence is replaced by 240 verified real-3D frames, version
`9bf895c9db23`: desktop 5,889,266 bytes; mobile 1,957,820 bytes. No image interpolation.

Complete: final assets installed, code/browser/visual checks passed, archive verified.
No pending implementation; physical-device smoothness is the remaining validation limit.
Final web typecheck and 136 unit tests / 28 files passed. Production build passed
without budget warnings (347.83 kB initial, 41.79 kB home lazy chunk). All nine public
Playwright/Axe cases passed in 43.7 s, including final-frame/opaque-product alignment
and mobile-only assets/credits. Preview playback/seeks/reduced-motion passed. Governance (38 entrypoints,
13 skills, eight Python checks) and diff checks passed. Native render completed 240/240 frames with STUDIO_COMPLETE. All 480 WebPs passed
alpha equality/dimension checks; 240 unique render/pixel/frame hashes.
Opening composition reviewed at all five widths using completed real frames.
Fixed desktop artwork alignment and clamped sticky-endpoint vertical compensation.
The browser suite now checks the actual opaque product against the finale art area.
GPU compute enumeration confirmed CPU-only across CUDA/OptiX/HIP/oneAPI backends.
Decisions: one coherent 3D asset/material set for every frame, alpha compositing over
home navy, existing lazy GSAP/canvas architecture and responsive/motion fallbacks.

## Previous iterations

- [Real-model studio proof](docs/others/homepage-product-render/README.md).
- [Homepage history and delivery](docs/others/homepage-scroll-delivery.md).
- Rejected [AI pose generation](docs/others/homepage-generated-poses/README.md) and
  [earlier Flow keyframes](docs/others/homepage-keyframes/README.md) are historical.
- Unrelated address work: [delivery](docs/others/manual-address-delivery.md).

Local headless motion diagnostics: controlled warm eight-second sweep yielded 222
RAF callbacks, 200 distinct frames, p95 50 ms. Removing the mask did not reproduce
an improvement; retained validated glass/footer styling. No 60 FPS claim; target
physical-device performance remains unverified. One temporary diagnostic harness
rejected empty CSS, fixed before completing the comparison.

## Previous archive and Git state

`dist/mousetrap_submission.zip`: 75,534,526 compressed bytes / 87,163,089
uncompressed bytes; 13.34% reduction; 1,001 files. SHA256:
`5a1062b3654efa43f258a535ebededada97611f71144ef1cab1926a8ea946685`.
Packaging integrity/exclusions, `unzip -l`, 240 desktop + 240 mobile entries and
packed scene/preview presence verified. Metrics: `dist/homepage-release-metrics.json`.
Branch `feature/home-scroll-redesign`: zero staged entries, 22 unstaged entries,
27 untracked entries (directories are collapsed). Nothing committed/pushed/published.
Selective Git/PR commands and categorized files: homepage-scroll-delivery.md.
