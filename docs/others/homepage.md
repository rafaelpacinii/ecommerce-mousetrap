# MouseTrap homepage

The root route presents four campaign chapters, a brand marquee, a discovery
panel for each catalog shelf and a guide to mouse grips. The chapter images are
static Blender renders of the supplied Logitech G PRO X SUPERLIGHT model.
Credits are available at the bottom of the page.

## Scroll behavior

Native CSS view timelines link text and card reveals to their position in the
viewport. Chapter headings reveal successive words, the DPI shelf enters from
alternating sides, the ultralight shelf uses a shallow scale change, and the grip
cards converge from small offsets. Chapter and shelf lines fill during the
scroll. The images in the chapter and discovery artwork stay fixed relative to
their sections. Keyboard focus settles interactive cards immediately, and
reduced-motion settings show the complete static layout. Browsers without
CSS view timeline support retain the settled layout.

The brand section uses the public `GET /catalogo/filtros` response. One list
contains the brand links. Presentation copies cover the available width and
repeat in a linear loop from left to right. A mask fades tiles at both edges.
Hover holds the current frame on pointer devices. Keyboard focus and
reduced-motion settings show the original list in a horizontally browsable row.
Each tile shows the logo and links to the corresponding brand filter. Its
accessible name identifies the brand. Brands with missing or broken images are
omitted. Empty and failed requests have their own states.

## Catalog paths

| Section | Destination |
| --- | --- |
| Velocidade | `pollingRateMin=4000&tipoSwitch=1` |
| Novidades | `ordenar=recentes`, optional name search |
| Precisão | `ordenar=maior-dpi` |
| Ultraleves | `pesoMax=59.99&ordenar=menor-peso` |
| Pegadas | Palm, Claw or Fingertip filter |
| Deslizamento | Complete catalog |

Each shelf requests up to four products and manages its loading, empty and
error state independently. The storefront keeps the existing catalog routes,
product links and cart controls.

## Assets and verification

The production build and source archive include the static images under
`web/public/images/home-scenes`. The retired frames remain available in the
authoring workspace. See [asset history](homepage-product-render/README.md),
[storyboard](../ui-wireframes/01-storefront-home.svg) and
[ADR 0006](../adr/0006-native-home-scroll.md).

Run `python3 scripts/ai_checks.py verify --scope web` from the repository root
and `npm run build` from `web` for the production bundle. The browser suite runs against
a local preview with `HOME_BASE_URL=http://localhost:4200 npm run e2e -- e2e/carousel.spec.ts`
from `web`. It uses catalog fixtures, tests both directions of scroll, checks the
brand loop seam and includes keyboard, mobile, reduced-motion and Axe checks.
