# MouseTrap Website Icons

The mark is a top-view gaming mouse using the Prussian Blue, Alice Blue, and
Golden Glow palette from `docs/ui-wireframes/`. The SVGs contain editable paths,
with no fonts, external resources, or embedded raster images.

| Asset | Use |
| --- | --- |
| `../favicon.svg` | Canonical color artwork and scalable browser favicon |
| `../favicon.ico` | Browser fallback containing 16, 32, 48, and 256 px images |
| `icon-16.png`, `icon-32.png`, `icon-48.png` | Small browser and desktop icons |
| `../apple-touch-icon.png` | Opaque 180 px Apple home-screen icon |
| `icon-192.png`, `icon-512.png` | Web app manifest icons |
| `icon-256.png` | Desktop and general-purpose square icon |
| `icon-maskable.svg`, `icon-maskable-512.png` | Full-bleed launcher icon with safe-area padding |
| `../safari-pinned-tab.svg` | Single-color Safari pinned-tab mask |
| `mouse.svg`, `mouse-1024.png` | Transparent mark for headers, footers, and other layouts |
| `../site.webmanifest` | Application name, colors, and launcher icon declarations |

The browser links are configured in `web/src/index.html`. Angular copies the
contents of `web/public/` into the build output. The manifest does not add a
service worker or offline support.

## Regenerate

Edit `web/public/favicon.svg`, then run from the repository root:

```bash
python3 scripts/generate_icons.py
```

The exporter uses Python's standard library and the system shared libraries
**librsvg**, **Cairo**, and **GObject**. It adds no frontend runtime dependency.
It regenerates the other SVG variants, PNG exports, ICO, and manifest.

## Use in a layout

```html
<a href="/" aria-label="MouseTrap — Início">
  <img src="icons/mouse.svg" alt="" width="32" height="32" />
  <span>MouseTrap</span>
</a>
```

The transparent mark has a dark body suited to light surfaces. Use the color
tile (`favicon.svg`) on dark surfaces. Give standalone meaningful images an
accessible name; use an empty `alt` when adjacent text already names the brand.
