---
name: ui-frontend
description: "Design or review MouseTrap Angular Material screen layouts, responsive states, accessibility and SEO within existing wireframes and brand tokens."
---

# Frontend UI and accessibility

1. Read [visual conventions](../../../docs/CONVENTIONS.md),
   [wireframe index](../../../docs/ui-wireframes/README.md), the matching SVG and
   existing component/theme styles. Preserve approved hero/banner composition.
2. Reuse `--prussian-blue`, `--slate-blue`, `--golden-glow`, `--light-cyan`,
   `--alice-blue` and existing surface/status tokens in `styles.css`/`material-theme.scss`.
   Yellow/cyan surfaces require dark text. Avoid one-off competing visual systems.
3. Build Material tables/forms/dialogs with accessible names, useful validation,
   keyboard navigation, visible focus, clear confirmations and recovery paths.
   Reserve image dimensions, use descriptive alternatives and reduced motion.
4. Check containment at 1440, 1024, 768, 375 and 320 px. Include loading, empty,
   error, unavailable inventory and pending-submit states. Keep implementation
   jargon out of product screens; maintain public/private metadata boundaries.
5. Do not change prices, payment rules, authorization or HTTP contracts to simplify
   a layout. Record a needed domain change separately and retain existing behavior.
6. Run web typecheck/unit/build as appropriate and inspect affected screens with
   Playwright/Axe or the disposable release runner. Record fixture-vs-live scope;
   automated scans are not complete WCAG certification. Do not claim visual checks
   from a compile-only run. Update `TASK.md` with actual viewport/audit evidence.
