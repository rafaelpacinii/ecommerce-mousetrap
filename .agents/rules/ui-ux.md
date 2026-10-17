---
description: MouseTrap UI/UX Design System, Color Palette, Angular Material M3 theming, and Technical SEO rules.
globs: "web/**,docs/ui-wireframes/**"
always_on: true
---

# UI/UX, Design System & SEO Rules — MouseTrap

- **Core Brand Palette (Mandatory CSS Custom Properties):**
  - `--prussian-blue: #0a122a` (Deep navy/obsidian for headers, Admin sidebar, Hero banners, primary headings)
  - `--slate-blue: #7d53de` (Primary interactive accent, M3 primary seed, active states, focus rings)
  - `--golden-glow: #dacc3e` (High-conversion CTAs, 8000Hz/Pro badges, active indicator bars — **always use `#0a122a` dark text on `#dacc3e` for AAA contrast**)
  - `--light-cyan: #d1f5ff` (Technical spec pills, wireless/sensor badges, subtle highlights — **always use `#0a122a` text**)
  - `--alice-blue: #eef8ff` (Product card image stage, secondary containers, filter blocks)
- **Extended Neutral & Semantic Tokens:**
  - `--surface-pure: #ffffff`, `--surface-canvas: #f6f9fc`, `--neutral-900: #0a122a`, `--neutral-700: #2c3652`, `--neutral-500: #64708d`, `--neutral-200: #dde5f0`, `--neutral-100: #eef3f9`.
  - Status tokens: `--status-success` (`#10b981`), `--status-warning` (`#f59e0b`), `--status-info` (`#0ea5e9`), `--status-danger` (`#ef4444`).
- **Visual Minimalism, Containment & Zero Architecture Jargon:**
  - Prioritize generous whitespace (`60%+` neutral canvas/white surfaces), clean hierarchy, and low information density.
  - Ensure all text, badges, and child elements stay strictly inside their container boundaries (`overflow: hidden`, proper padding, concise labels).
  - Never expose technical/backend jargon (`Keycloak`, `OIDC`, `JWT`, `Roles`, `@Version`, `IBGE`, API endpoints, or Angular component names) in user-facing or admin-facing UI screens.
  - Use a **single unified Login screen (`/login`)** for all users; after authentication, redirect transparently according to the user's role (`ADMIN` -> `/admin`, `CLIENTE` -> Storefront).
- **Screen Wireframes Reference (`docs/ui-wireframes/`):**
  - `00-design-system-tokens.svg` (Design System & Material Tokens)
  - `01-storefront-home.svg` (Clean Esports Landing Page)
  - `02-storefront-catalog.svg` (Faceted Gaming Mouse Catalog)
  - `03-storefront-product-detail.svg` (Split Product Gallery + Essential Buy-Box)
  - `04-storefront-cart.svg` (2-Column Shopping Cart + CEP Shipping)
  - `05-storefront-checkout.svg` (Clean Checkout — Address & Payment)
  - `06-storefront-customer-portal.svg` (Customer Portal — My Orders & Tracking)
  - `07-auth-login.svg` (Unified Single Login Screen with Role-Based Redirect)
  - `08-auth-register.svg` (Customer Registration with Automatic CEP Lookup)
  - `09-admin-dashboard-orders.svg` (Admin Dashboard & Orders Management)
  - `10-admin-catalog-list.svg` (Admin Catalog — Products Table View)
  - `11-admin-catalog-form.svg` (Admin Catalog — Product Create/Edit Form View)
- **Angular Material M3 & Technical SEO:**
  - Customize Angular Material via `--mat-sys-*` tokens in `web/src/material-theme.scss` and `web/src/styles.css`.
  - Use `font-variant-numeric: tabular-nums` on all prices, DPIs, weights, and order numbers.
  - Set descriptive route titles, `<meta name="description">`, semantic HTML5 landmarks, and `alt` attributes on all product images.

