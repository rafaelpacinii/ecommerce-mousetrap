# Material Icons

MouseTrap uses Angular Material's `MatIconModule` and the classic **Material
Icons** font for interface icons. The package was already installed; no second
icon package or remote JavaScript was added.

## References

- [Requested AngularJS Wiki icon catalog](https://www.angularjswiki.com/angular/angular-material-icons-list-mat-icon-list/).
- [Angular Material icon documentation](https://material.angular.dev/components/icon/overview).
- [Official Google Material Icons guide](https://developers.google.com/fonts/docs/material_icons).

The catalog is a name/reference list, not a separate npm library. Add the name
of an icon as a ligature inside `mat-icon` and import `MatIconModule` in the
standalone component that renders it.

```ts
import { MatIconModule } from '@angular/material/icon';

// Include MatIconModule in the standalone component's imports array.
```

```html
<button type="submit">
  <mat-icon aria-hidden="true">search</mat-icon>
  Buscar
</button>
```

Keep meaningful text alongside decorative icons. Icon-only controls must have
an accessible name such as `aria-label`; hiding the icon from assistive
technology prevents its internal ligature name from becoming the control label.

## Coverage

| Interface element | Icons |
| --- | --- |
| Navigation | `home`, `mouse`, `pan_tool`, `settings`, `storefront`, `loyalty`, `people` |
| Mobile menu | `menu`, `close` |
| Search, retry and clear | `search`, `refresh`, `clear` |
| Hero and grip guides | `flash_on`, `arrow_forward`, `touch_app`, `pan_tool`, `gesture`, `add` |
| Product placeholder and specs | `mouse`, `fitness_center`, `track_changes`, `chevron_right` |
| Loading, errors and empty states | `hourglass_empty`, `error_outline`, `inbox`, `search_off`, `people_outline` |
| Availability and active flags | `check_circle`, `check_circle_outline`, `remove_circle_outline` |
| CRUD actions | `add`, `edit`, `delete`, `save`, `close` |
| Form fields | `person`, `mail`, `location_on`, `home`, `location_city`, `format_list_numbered`, `info_outline`, `label`, `loyalty`, `palette`, `description`, `attach_money`, `inventory`, `track_changes`, `touch_app`, `fitness_center`, `usb` |

The custom SVG mouse **brand mark** in headers, the footer and browser/application
icons remains unchanged. The decorative hero photograph also remains unchanged.
The generic product illustration uses the library's mouse glyph and retains its
illustration label until real product images are available.

## Local font and license

The font is stored at
`web/src/assets/fonts/MaterialIcons-Regular.woff2` (128,352 bytes). Global
`@font-face` and `.material-icons` styles are defined in `web/src/styles.css`.
Angular resolves the font URL and emits a hashed file under `media/` during the
build. The external Google Fonts stylesheet and preconnections were removed;
rendering interface icons does not require a third-party request.

Source: [Google-hosted Material Icons v145 WOFF2](https://fonts.gstatic.com/s/materialicons/v145/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2).

SHA256:

```text
8265f64786397d6b832d1ca0aafdf149ad84e72759fffa9f7272e91a0fb015d1
```

The official Apache 2.0 license is retained in
[`web/public/licenses/material-icons-LICENSE.txt`](../web/public/licenses/material-icons-LICENSE.txt).
Source license: [Google Material Design Icons LICENSE](https://github.com/google/material-design-icons/blob/master/LICENSE).

## Validation

```sh
cd web
npm test -- --watch=false
npm run build
```

Font rendering must also be checked in a browser, because unit tests do not load
or shape webfonts. Responsive checks should include navigation, search buttons,
form suffix icons and product/status badges.

Validation completed: 21 frontend tests passed across 7 files; the production
build passed within its budgets. Chromium rendered all 44 icon names used in
the application with external HTTPS requests blocked and no external requests
observed. Layout checks passed at 1440, 1024, 820, 768, 701, 375 and 320 px,
including all three administrative forms at 320 px, with intercepted API fixtures
and no browser JavaScript exceptions. The brand SVGs were preserved.
