# muxpreview: muOS Theme System Research

## 1. Purpose

This document records what can be learned about the muOS theme ecosystem from
the files currently available in this repository. It is intended to guide a
future open-source `muxpreview` implementation: a local development server and
browser-based live preview for muOS themes.

No implementation is proposed here. The emphasis is on verified file formats,
directory conventions, presentation primitives, edge cases, and unresolved
questions.

## 2. Evidence and confidence

The repository contains:

- `README.md`, with only the project name and one-sentence goal.
- An empty `app/` directory.
- An ignored `references/` directory.
- `references/MUOS/`, which resembles the user/data partition of a muOS
  installation rather than a complete operating-system source tree.
- Seven named theme directories plus an empty `theme/active/` directory.
- `references/MUOS/info/theme_data.json`, a catalogue of 421 downloadable
  `.muxthm` themes.

This document uses three confidence levels:

- **Observed**: directly present in the reference files.
- **Inferred**: strongly suggested by repeated naming, file layering, and
  rendered previews, but not proven by renderer source.
- **Unknown**: not recoverable from the current references.

The reference tree does **not** contain the muOS frontend source, a documented
theme schema, or an identifiable renderer executable/configuration that proves
load order and enum meanings. Exact runtime behavior must therefore remain
separate from structural inference.

## 3. Repository assessment

The tracked repository is intentionally minimal:

```text
muxpreview/
|-- .gitignore        # ignores references/
|-- README.md
|-- app/              # empty
`-- references/       # local, ignored research corpus
```

There is no existing application architecture, dependency choice, test suite,
or code convention to preserve. The future project can be designed from first
principles, but should treat the reference corpus as test data rather than
shipping it automatically: it is large, ignored, and contains third-party
theme assets.

## 4. Reference corpus

### 4.1 MUOS tree

`references/MUOS/` contains user-facing data such as:

- applications
- BIOS and emulator support files
- catalogue metadata and artwork
- collections and history
- network and save data
- packages
- screenshots and music
- themes

It does not resemble a complete root filesystem. In particular, scripts refer
to paths such as `/opt/muos/...` that are not present under the reference tree.
The corpus is therefore useful for data formats, but insufficient to reproduce
the actual frontend runtime.

### 4.2 Local themes

| Theme | Local resolutions | Character |
|---|---|---|
| `Epic Noir` | `640x480` | One `muxplore.ini` override only |
| `muOS - Banana` | `640x480` | Three scheme files only |
| `Muos Console Grid` | `640x480` | Full single-resolution theme |
| `MustardOS` | Six resolutions | Full multi-resolution theme |
| `MuxRemix-Grid` | Six resolutions | Full multi-resolution grid theme |
| `Royal Dark MU` | `640x480` | Small partial/full theme |
| `Terminal - Redacted` | Six resolutions | Full multi-resolution theme with packed alternates |

The six resolutions present locally are:

- `640x480` (4:3)
- `720x480` (3:2)
- `720x576` (5:4)
- `720x720` (1:1)
- `1024x768` (4:3)
- `1280x720` (16:9)

### 4.3 Theme registry

`references/MUOS/info/theme_data.json` contains 421 entries. Every URL ends in
`.muxthm`.

Observed capability counts:

| Registry field | Themes marked true |
|---|---:|
| `resolution640x480` | 416 |
| `resolution720x480` | 101 |
| `resolution720x720` | 94 |
| `resolution1024x768` | 42 |
| `resolution1280x720` | 57 |
| `grid` | 46 |
| `hdmi` | 57 |
| `language` | 112 |

Five themes do not support `640x480`; each advertises at least one other
resolution.

Important inconsistency: the registry has no `resolution720x576` field, while
three complete local themes contain `720x576` assets. The registry is therefore
not a complete resolution schema.

## 5. Theme identity and metadata

Observed root metadata files include:

- `active.txt`
- `name.txt`
- `theme_name.txt` (used instead of `name.txt` by one theme)
- `version.txt`
- `credits.txt`
- `collect.html`

The metadata is not consistent across all themes. Partial themes omit most or
all root metadata. A loader must not assume that `name.txt` exists or that the
directory name equals the display name.

Observed examples:

| Directory | Display name file | Version | `active.txt` |
|---|---|---|---|
| `MustardOS` | `MustardOS` | `2601.0` | `muOS` |
| `MuxRemix-Grid` | `MuxRemix-Grid` | `2601.0` | `ClassicDark` |
| `Terminal - Redacted` | `Terminal-Redacted` via `theme_name.txt` | `2508` | `Redacted` |
| `Muos Console Grid` | `Muos Console Art Grid` | `2508.0` | `Console Art` |

**Inference:** `active.txt` selects an alternate whose basename matches its
content. This relationship is consistent in every theme that has both files,
but the activation code is absent.

`collect.html` is a generic HTML template containing placeholders such as
`{{TITLE}}` and `{{SECTIONS}}`. It appears to support a generated collection
report and is not evidence that the device UI itself is HTML.

## 6. Canonical theme folder structure

A superset assembled from the complete themes is:

```text
<theme>/
|-- active.txt
|-- name.txt or theme_name.txt
|-- version.txt
|-- credits.txt
|-- collect.html
|
|-- alternate/
|   |-- <variant>.ini
|   |-- <variant>_bootlogo.json
|   |-- <variant>.muxalt
|   `-- rgb/<variant>/rgbconf.sh
|
|-- catalogue/
|   `-- <category>/grid/<resolution>/<item>.png
|
|-- font/
|   |-- default.bin
|   |-- header/default.bin
|   |-- footer/default.bin
|   `-- panel/grid/<screen>.bin
|
|-- glyph/
|   |-- header/*.png
|   |-- footer/*.png
|   |-- bar/*.png
|   `-- <screen-id>/*.png
|
|-- image/
|   |-- wall/*.png
|   |-- grid/<screen-id>/*.png
|   |-- static/<screen-id>/*.png
|   |-- bootlogo.bmp or bootlogo.png
|   |-- overlay.png
|   |-- reboot.png
|   |-- shutdown.png
|   |-- screensaver.png
|   `-- kiosk.png
|
|-- overlay/
|   |-- battery/battery_0.png ... battery_9.png
|   |-- bright/bright_0.png ... bright_9.png
|   `-- volume/volume_0.png ... volume_9.png
|
|-- rgb/rgbconf.sh
|-- scheme/global.ini
|-- sound/*.wav
|
`-- <width>x<height>/
    |-- preview.png, preview.0.png, preview.1.png
    |-- font/...
    |-- glyph/...
    |-- image/...
    |-- overlay/...
    `-- scheme/
        |-- default.ini
        `-- <screen-id>.ini
```

No theme contains every path. Sparse themes demonstrate that omission is
accepted at least as an on-disk state.

### 6.1 Shared and resolution-specific assets

Complete themes place common assets at the theme root and selected overrides
inside resolution directories.

Examples:

- `MustardOS/font/default.bin` coexists with larger-resolution font files.
- `MustardOS/image/grid/muxlaunch/apps.png` is `128x128`, while the
  `1024x768` override is `192x192`.
- `Terminal - Redacted` puts most screen glyphs under each resolution.
- `MuxRemix-Grid` mixes root glyphs with resolution-specific glyphs.

**Inference:** lookup is resolution-first with root fallback, or themes are
materialized into an active directory using equivalent overlay behavior.
The exact mechanism and precedence are unknown.

## 7. Scheme files

### 7.1 Format

Scheme files are conventional INI-like text:

```ini
[section]
KEY = value
```

Observed conventions:

- Section names are lowercase.
- Keys are uppercase snake case.
- RGB colours are six hexadecimal digits without `#`.
- Alpha values are decimal, normally `0` through `255`.
- Dimensions, padding, offsets, counts, radii, and timing values are decimal
  integers; some offsets and line spacing values are negative.
- Boolean-like values are represented by `0` or `1`.
- Enum-like values are integers, but their complete meanings are not defined.
- Colour casing is inconsistent and should be treated case-insensitively.
- Separator values can contain text and surrounding spaces, for example
  `of ` and `/ `.

All inspected theme scheme files were structurally parseable as sections and
key/value assignments. Unknown keys should be retained rather than rejected.

### 7.2 Observed scheme filenames

- `global.ini`
- `default.ini`
- `muxapp.ini`
- `muxcollect.ini`
- `muxdevice.ini`
- `muxhistory.ini`
- `muxinstall.ini`
- `muxlaunch.ini`
- `muxpicker.ini`
- `muxplore.ini`
- `muxstart.ini`
- `muxtester.ini`
- `muxthemedown.ini`

Not every filename appears in every theme or resolution.

### 7.3 Layering model

Observed evidence:

- `MustardOS/scheme/global.ini` is a broad, nearly complete configuration.
- Its `640x480/scheme/muxlaunch.ini` is only a two-key grid override.
- Larger MustardOS resolutions also provide `default.ini`.
- `Terminal - Redacted` has full `default.ini` files inside each resolution
  and no root `scheme/` directory.
- `muOS - Banana` has a full `640x480/scheme/default.ini` plus screen files.
- Alternate `.ini` files contain partial colour and style overrides.

The most plausible effective order is:

1. Renderer built-in defaults.
2. Theme root `scheme/global.ini`, if present.
3. Resolution `scheme/default.ini`, if present.
4. Resolution `scheme/<screen-id>.ini`, if present.
5. Active alternate overrides.

This order is **inferred, not verified**. A future compatibility harness should
validate it on a device or against muOS source before claiming pixel parity.

### 7.4 Scheme sections and responsibilities

| Section | Observed responsibility |
|---|---|
| `animation` | Animation delay |
| `background` | Solid/gradient background, alpha, dither, blur |
| `font` | Padding for header, footer, message, list, and icons |
| `status` | Status alignment and horizontal padding |
| `battery` | Normal, active, and low colours/alphas |
| `network` | Normal and active colours/alphas |
| `bluetooth` | Normal and active colours/alphas |
| `date` | Date/time colour, alpha, alignment, padding |
| `footer` | Footer height, background, and text |
| `header` | Header height, background, text, alignment, padding |
| `help` | Help dialog background, border, title/content, radius |
| `navigation` | Footer control glyph/text colours, alphas, alignment |
| `grid` | Grid geometry, cells, focus/default styles, item label |
| `list` | List default/focus/disabled styles and glyph treatment |
| `image_list` | List/preview image alpha, radius, recolour, padding |
| `charging` | Charger screen background, text, vertical position |
| `verbose` | Verbose boot background, text, vertical position |
| `keyboard` | On-screen keyboard container and key states |
| `notification` | Message box background, border, text, radius |
| `bar` | Brightness/volume bar geometry and progress styles |
| `roll` | Roller/select control states |
| `counter` | Counter placement, styling, separator, fade behavior |
| `meta` | `META_CUT`, whose exact semantic is unknown |
| `misc` | Content geometry, background mode, overlay, navigation type |
| `terminal` | Terminal foreground/background and font size |

### 7.5 Complete observed key vocabulary

The following is the union across local scheme files, grouped compactly.

- `background`: `BACKGROUND`, `BACKGROUND_ALPHA`,
  `BACKGROUND_GRADIENT_COLOR`, `BACKGROUND_GRADIENT_START`,
  `BACKGROUND_GRADIENT_STOP`, `BACKGROUND_GRADIENT_DIRECTION`,
  `BACKGROUND_GRADIENT_DITHER`, `BACKGROUND_GRADIENT_BLUR`
- `font`: `FONT_HEADER_PAD_TOP`, `FONT_HEADER_PAD_BOTTOM`,
  `FONT_HEADER_ICON_PAD_TOP`, `FONT_HEADER_ICON_PAD_BOTTOM`,
  `FONT_FOOTER_PAD_TOP`, `FONT_FOOTER_PAD_BOTTOM`,
  `FONT_FOOTER_ICON_PAD_TOP`, `FONT_FOOTER_ICON_PAD_BOTTOM`,
  `FONT_MESSAGE_PAD_TOP`, `FONT_MESSAGE_PAD_BOTTOM`,
  `FONT_MESSAGE_ICON_PAD_TOP`, `FONT_MESSAGE_ICON_PAD_BOTTOM`,
  `FONT_LIST_PAD_TOP`, `FONT_LIST_PAD_BOTTOM`, `FONT_LIST_PAD_LEFT`,
  `FONT_LIST_PAD_RIGHT`, `FONT_LIST_ICON_PAD_TOP`,
  `FONT_LIST_ICON_PAD_BOTTOM`
- `grid`: `NAVIGATION_TYPE`, `BACKGROUND`, `BACKGROUND_ALPHA`,
  `LOCATION_X`, `LOCATION_Y`, `COLUMN_COUNT`, `COLUMN_WIDTH`, `ROW_COUNT`,
  `ROW_HEIGHT`, `CELL_COLUMN_ALIGN`, `CELL_ROW_ALIGN`, `CELL_WIDTH`,
  `CELL_HEIGHT`, `CELL_RADIUS`, `CELL_BORDER_WIDTH`, `CELL_SHADOW`,
  `CELL_SHADOW_WIDTH`, `CELL_SHADOW_X_OFFSET`, `CELL_SHADOW_Y_OFFSET`,
  `CELL_IMAGE_PADDING_TOP`, `CELL_TEXT_PADDING_BOTTOM`,
  `CELL_TEXT_PADDING_SIDE`, `CELL_TEXT_LINE_SPACING`, all
  `CELL_DEFAULT_*` and `CELL_FOCUS_*` colour/alpha/gradient/image/text keys,
  and all `CURRENT_ITEM_LABEL_*` geometry/style/text/shadow keys
- `list`: default/focus background, alpha, gradient, indicator, text, glyph,
  border, radius, long-label mode, plus disabled text/alpha
- `image_list`: list and preview alpha, radius, recolour, recolour alpha,
  and list padding on all four sides
- `misc`: `STATIC_ALIGNMENT`, `CONTENT_ITEM_COUNT`,
  `CONTENT_SIZE_TO_CONTENT`, `CONTENT_ALIGNMENT`, `CONTENT_PADDING_LEFT`,
  `CONTENT_PADDING_TOP`, `CONTENT_WIDTH`, `CONTENT_HEIGHT`,
  `CONTENT_ITEM_HEIGHT`, `ANIMATED_BACKGROUND`, `RANDOM_BACKGROUND`,
  `IMAGE_OVERLAY`, `NAVIGATION_TYPE`
- `bar`: container background/border/radius/geometry, progress
  background/active background/radius/geometry, and icon colour/alpha
- `counter`: enabled state, alignment, padding, border, radius, background,
  text, fade time, and separator

The remaining sections use the fields described in section 7.4 and are much
smaller.

### 7.6 Opaque enums

Observed enum-like values include:

- `grid.NAVIGATION_TYPE`: `2`, `4`
- `misc.NAVIGATION_TYPE`: `0`, `1`, `2`, `5`
- `grid.COLUMN_COUNT`: `0` through `4`
- `grid.ROW_COUNT`: `0` through `3`
- `CURRENT_ITEM_LABEL_ALIGNMENT`: `2`, `5`
- `DATETIME_ALIGN`: `1`, `2`
- `BACKGROUND_GRADIENT_DIRECTION`: `0`, `1`
- long-label modes: `1` and `3`

Their names suggest layout behavior, but integer-to-behavior mappings cannot be
proved from static files alone. Rendered previews provide examples, not a
complete truth table.

## 8. Fonts

Observed theme fonts use `.bin`; no `.ttf`, `.otf`, or web-font sources are
present.

Common paths:

- `font/default.bin`
- `font/header/default.bin`
- `font/footer/default.bin`
- `font/panel/grid/muxlaunch.bin`
- `font/panel/grid/muxinstall.bin`
- resolution-prefixed versions of the same paths

The files begin with bytes such as:

```text
30 00 00 00 68 65 61 64 ...
```

They are not standard TrueType/OpenType files. The repeated binary structure
and size changes across resolution variants indicate precompiled renderer font
assets. It is plausible that they are generated for the UI toolkit used by
muOS, but that toolkit and binary specification are not proven by this corpus.

Consequences for muxpreview:

- A browser cannot load these files directly with normal `@font-face`.
- Exact typeface, glyph coverage, kerning, and metrics cannot currently be
  reproduced from the references alone.
- Preview screenshots can be used to compare approximate metrics.
- Pixel-faithful text rendering requires either a verified decoder, original
  font sources, or a documented conversion workflow.
- The preview must clearly distinguish exact asset rendering from approximate
  font rendering until this is solved.

## 9. Glyphs

The local themes contain 5,379 PNG files under glyph paths.

### 9.1 Structural glyph sets

`glyph/header/`:

- `bluetooth.png`
- `network_active.png`, `network_normal.png`
- `capacity_0.png` through `capacity_100.png` in increments of ten
- `capacity_charging_0.png` through `capacity_charging_100.png`

`glyph/footer/`:

- `a.png`, `b.png`, `c.png`
- `x.png`, `y.png`, `z.png`
- `menu.png`, `lr.png`, `ud.png`

`glyph/bar/`:

- `bright_0.png` through `bright_3.png`
- `volume_0.png` through `volume_3.png`

Scheme keys separately control glyph alpha and recolouring. A preview must
therefore preserve source transparency and apply optional tinting.

### 9.2 Screen glyph namespaces

Observed glyph directory IDs:

```text
muxactivity, muxapp, muxappcon, muxarchive, muxassign, muxbackup,
muxcoladjust, muxcolfilter, muxcollect, muxconfig, muxconnect, muxcontrol,
muxcustom, muxdanger, muxdevice, muxdownload, muxgov, muxhdmi, muxhistory,
muxinfo, muxinstall, muxkiosk, muxlanguage, muxlaunch, muxnetadv, muxnetinfo,
muxnetprofile, muxnetscan, muxnetwork, muxnews, muxoption, muxoverlay,
muxpicker, muxplore, muxpower, muxraopt, muxrtc, muxsearch, muxshot, muxsort,
muxspace, muxstorage, muxsysinfo, muxtag, muxtask, muxtester, muxtheme,
muxthemedown, muxthemefilter, muxtimezone, muxtweakadv, muxtweakgen,
muxvisual, muxwebserv
```

These directories reveal a broader screen set than the available scheme
filenames. Most screens apparently use a default scheme while selecting their
own glyph namespace.

Common glyph dimensions cluster around `21x21` to `62x49`. Larger menu/content
glyphs include `128x128`, `192x192`, and `256x256` assets.

## 10. Images

Theme file totals include:

- 7,055 PNG files
- 14 BMP files
- 1 GIF file

Of these, 247 are under `image/`, 1,201 under theme `catalogue/`, 5,379 under
`glyph/`, and 210 under `overlay/`.

### 10.1 Wallpaper and full-screen images

Observed paths include:

- `image/wall/default.png`
- `image/wall/<screen-id>.png`
- `image/reboot.png`
- `image/shutdown.png`
- `image/screensaver.png`
- `image/kiosk.png`
- `image/overlay.png`
- `image/bootlogo.bmp`
- `<resolution>/image/bootlogo.png`

Wallpaper names include `muxcharge`, `muxmessage`, `muxtester`, `muxlaunch`,
`muxplore`, `muxcollect`, `muxhistory`, and menu-item names. One theme contains
the typo `muxmessege.png`; compatibility tooling should report, not silently
correct, such names.

Full-screen files generally match their resolution. Transparent overlays also
match the full canvas. Examples:

- `640x480/image/wall/default.png`: `640x480`
- `640x480/image/overlay.png`: `640x480`, with alpha
- `1024x768/preview.png`: `1024x768`

Some images are shorter than the full canvas, such as `720x556` or `1016x598`.
These likely target content areas excluding headers/footers, but exact
placement must come from schemes and runtime behavior.

### 10.2 Grid and static menu art

Observed patterns:

```text
image/grid/muxlaunch/<item>.png
image/grid/muxinstall/<item>.png
image/static/muxlaunch/<item>.png
```

`muxlaunch` item names include:

- `apps`
- `collection`
- `config`
- `explore`
- `history`
- `info`
- `reboot`
- `shutdown`

`muxinstall` includes `clock`, `install`, `language`, and `shutdown`.

The same logical item can have different pixel sizes by resolution. Grid images
are individual cells/icons; static images appear intended for a fixed
composition controlled by `STATIC_ALIGNMENT` and navigation mode.

### 10.3 Preview images

Themes can include:

- `preview.png`
- `preview.0.png`
- `preview.1.png`

Observed previews show:

- a grid main menu
- a list with focus styling and right-aligned values
- a content list with box art, cartridge art, and a region badge
- wallpaper-only theme imagery

Preview files are useful visual references but are not a declarative screen
specification. Their sample data and state are baked into pixels.

## 11. Catalogue assets

There are two related but distinct catalogue systems in the references.

### 11.1 Theme-local catalogue

Observed complete themes contain:

```text
catalogue/Application/grid/<resolution>/<application>.png
catalogue/Folder/grid/<resolution>/<folder>.png
```

These provide theme-specific grid art for applications and folders.

### 11.2 MUOS information catalogue

`references/MUOS/info/catalogue/` contains many platform/category directories,
including applications, arcade, collections, folders, tasks, themes, and game
systems.

Category subdirectories can contain:

- `box/`
- `grid/`
- `overlay/`
- `preview/`
- `splash/`
- `text/`

Overlay subdirectories include `base`, `battery`, `bright`, and `volume`.

This broader catalogue is content metadata/artwork, not simply part of one
theme. A realistic explorer preview needs synthetic sample content or selected
catalogue data in addition to the theme itself.

## 12. Alternate themes

Three alternate mechanisms are observed.

### 12.1 INI alternates

Files such as `alternate/Black.ini` and `alternate/muOS.ini` are partial scheme
overrides, mostly colours and related style values.

### 12.2 Boot-logo recolour metadata

Files such as `alternate/muOS_bootlogo.json` contain:

```json
{
  "background_colour": "444444",
  "background_gradient_colour": "000000",
  "png_recolour": "ffffff",
  "png_recolour_alpha": 0
}
```

The exact consumer is unknown, but the names indicate boot-logo generation or
recolouring.

### 12.3 Packed `.muxalt` alternates

The three `Terminal - Redacted` `.muxalt` files begin with ZIP signature
`50 4B 03 04` and can be listed as ZIP-compatible archives.

Each contains all six resolution roots and roughly:

- 1,700 archive entries
- 1,522 glyph-path entries
- 110 image-path entries
- 45 scheme-path entries

These are not small runtime colour overlays; they are replacement asset packs.
Whether muOS extracts them permanently or mounts/applies them dynamically is
unknown.

## 13. Other themed resources

### 13.1 Overlays

`overlay/` contains ten PNG levels each for:

- battery
- brightness
- volume

The same structure can exist at root or per resolution. These are distinct from
header battery glyphs and the four-level `glyph/bar` brightness/volume icons.

### 13.2 Sounds

Observed WAV names include:

- `navigate.wav`
- `confirm.wav`
- `back.wav`
- `option.wav`
- `error.wav`
- `info_open.wav`
- `info_close.wav`
- `startup.wav`
- `shutdown.wav`
- `reboot.wav`
- `keypress.wav`
- `muos.wav`

Themes omit sounds freely. Playback timing, mixing, and fallback behavior are
not documented in the references.

### 13.3 Device RGB scripts

`rgb/rgbconf.sh` and alternate-specific RGB scripts call:

```text
/opt/muos/script/device/rgb.sh
```

with numeric arguments. These affect physical device lighting and are outside
browser visual parity, though muxpreview could inspect and report their
presence.

## 14. Screen identifiers and likely roles

The following roles are interpretations based on directory IDs and glyph
filenames. They are useful labels, not verified official names.

| ID | Likely role |
|---|---|
| `muxlaunch` | Main launcher |
| `muxplore` | Content explorer |
| `muxcollect` | Collections |
| `muxhistory` | History/recent content |
| `muxapp` | Applications |
| `muxinstall` | Installation/first-run menu |
| `muxpicker` | Generic picker |
| `muxactivity` | Activity/play statistics |
| `muxconfig` | Configuration hub |
| `muxcustom` | Interface/theme customization |
| `muxdevice` | Device settings |
| `muxconnect`, `muxnetwork`, `muxnet*` | Connectivity and network screens |
| `muxcontrol` | Control layout/settings |
| `muxhdmi` | HDMI settings |
| `muxlanguage`, `muxtimezone`, `muxrtc` | Locale, timezone, clock |
| `muxpower` | Power options |
| `muxtheme`, `muxthemedown`, `muxthemefilter` | Theme selection/download/filter |
| `muxtester` | Input tester |
| `muxinfo`, `muxsysinfo`, `muxspace` | Information screens |
| `muxstorage`, `muxbackup`, `muxarchive` | Storage and maintenance |
| `muxshot` | Screenshots |
| `muxsearch`, `muxsort`, `muxtag` | Content organisation |
| `muxvisual`, `muxoverlay`, `muxcol*` | Visual/colour/overlay settings |
| `muxtweakgen`, `muxtweakadv`, `muxdanger` | General/advanced system tweaks |
| `muxwebserv` | Web services |

The remaining IDs can be surfaced verbatim until official labels are found.

## 15. Screen types

Screen type is not determined solely by the `mux*` identifier. The same screen
can be restyled through scheme navigation modes and available assets.

The references support at least these presentation families:

### 15.1 Standard list

Features:

- header/status row
- vertically repeated list items
- optional leading glyph
- focused/default/disabled states
- optional right-aligned value
- footer navigation hints

This appears to be the common fallback for settings and utility screens.

### 15.2 List with image or metadata preview

Features:

- content list on one side
- box art, preview, cartridge/disc, badge, or metadata region
- `image_list` geometry and recolour settings
- screen overrides such as `muxplore`, `muxcollect`, and `muxhistory`

### 15.3 Grid

Features:

- explicit rows, columns, cell dimensions, gaps, and origin
- default/focus cell styling
- per-cell image and optional text
- current-item label panel
- `image/grid` or catalogue grid assets

Grid is observed for launch, install, applications, folders, and content.

### 15.4 Static-art selection

Features:

- fixed menu item art in `image/static/<screen>/`
- list text and glyphs can be fully transparent
- navigation remains interactive
- placement influenced by static alignment/navigation settings

### 15.5 Full-screen state screens

Examples:

- charging
- reboot/shutdown
- screensaver
- verbose boot
- messages
- input tester

These combine wallpaper/full-screen imagery with small amounts of positioned
text or controls.

### 15.6 Modal and transient UI

The scheme defines reusable:

- help dialogs
- notifications
- on-screen keyboard
- rollers/selectors
- counters
- brightness/volume bars
- battery/brightness/volume overlays

A useful preview cannot stop at one static screen; it needs controllable UI
states for focus, disabled items, modal overlays, status values, and transient
controls.

## 16. Probable rendering model

The files suggest a component-based native UI:

1. Select a resolution.
2. Resolve shared and resolution-specific assets.
3. Load a base scheme and apply screen-specific overrides.
4. Select wallpaper/background mode.
5. Build common header, content, and footer regions.
6. Populate a list, grid, static composition, or special-purpose screen.
7. Apply focus/default states, alphas, recolouring, gradients, and geometry.
8. Overlay status glyphs, navigation hints, dialogs, or transient controls.

This model is consistent with the schemes and preview images. It is not proof
of the renderer's internal implementation.

## 17. Important edge cases

- Themes may be partial and contain only one screen override.
- Metadata files are optional and inconsistently named.
- Root and resolution assets are mixed.
- `global.ini` and `default.ini` are not universally present.
- A screen-specific file can be a tiny override or a nearly complete scheme.
- `720x576` exists locally but is absent from registry capability fields.
- Colours use inconsistent hex casing.
- Values can contain negative integers or meaningful text spacing.
- Alpha can deliberately hide text/glyphs while preserving navigation.
- Grid row/column counts can be `0`, suggesting automatic sizing.
- Asset filenames can contain typos.
- Themes contain hidden macOS `._*` files that should not be treated as theme
  assets.
- Font binaries are not directly browser-compatible.
- `.muxalt` is ZIP-compatible, but `.muxthm` format is unverified locally.
- The empty `theme/active/` directory is not a symlink in this copy. Its normal
  device behavior is unknown.
- Theme versions span at least `2508` and `2601`, so the corpus may mix schema
  generations.

## 18. Implications for muxpreview

These are research-derived requirements, not an implementation plan.

### 18.1 Preserve uncertainty

The tool should expose whether a behavior is:

- directly represented by files
- inferred by the preview engine
- unsupported or unknown

It should avoid presenting approximate browser output as device-perfect.

### 18.2 Use layered, inspectable resolution

The preview needs a resource resolver that can explain which file supplied each
effective value or image. This is essential for root/resolution/screen/alternate
fallback debugging.

### 18.3 Parse schemes permissively

A useful parser should:

- preserve unknown sections and keys
- preserve original values for diagnostics
- support partial files
- merge without requiring a complete schema
- validate known colours, alpha ranges, and numeric fields separately
- warn on suspicious names or missing files without refusing to preview

### 18.4 Model primitives before individual screens

Most of the UI can be described using reusable primitives:

- canvas/background
- header/status
- footer/navigation
- list
- grid
- current-item label
- image/metadata preview
- modal
- keyboard
- roller
- counter
- progress bar
- transient overlay

Screen IDs should select data and defaults, while schemes select geometry and
style. Hardcoding one bespoke renderer for every observed `mux*` directory
would overstate what is known and make new muOS screens difficult to support.

### 18.5 Provide deterministic sample states

Themes alone do not contain the runtime text and content needed for a preview.
The project will need documented sample fixtures for:

- menu labels
- long and short list text
- right-side values
- disabled items
- box art and metadata
- date/time
- battery, network, and Bluetooth states
- footer button labels
- modal, keyboard, bar, and overlay states

Fixtures should be clearly separated from theme assets.

### 18.6 Treat font fidelity as a first-class limitation

Until the `.bin` format is verified, text layout should have an explicit
approximation mode. Scheme geometry can still be faithfully represented, but
line wrapping and exact baselines may differ from the device.

### 18.7 Validate across all six observed resolutions

The local corpus proves six resolution directories, regardless of the five
fields in the theme registry. A theme may support an arbitrary subset.

### 18.8 Separate authoring diagnostics from rendering

Useful diagnostics include:

- missing base scheme
- missing selected resolution
- missing glyph/image with fallback candidate
- full-screen image dimension mismatch
- invalid colour or alpha
- unknown enum value
- duplicate or shadowed key
- unrecognized screen ID
- stale `active.txt` alternate
- non-browser-compatible font
- macOS metadata files

## 19. Unknowns requiring external verification

The following cannot be answered from the repository:

1. Exact scheme merge order.
2. Whether root asset fallback happens at runtime or during theme activation.
3. Built-in defaults when no `global.ini` or `default.ini` exists.
4. Official meanings for alignment, navigation, gradient, and long-label
   integer enums.
5. Exact screen-to-scheme selection rules.
6. Exact wallpaper selection and fallback rules.
7. Exact image scaling, clipping, interpolation, and anchor behavior.
8. Font binary format, source font mapping, and text shaping behavior.
9. Whether `.muxthm` is ZIP-compatible and its required archive root.
10. How `.muxalt` is installed or activated.
11. Normal purpose and representation of `theme/active`.
12. Whether filenames are case-sensitive on the target filesystem.
13. Theme schema differences between muOS releases.
14. Behavior of animated/random backgrounds; all local observed values are
    disabled.
15. Meaning of `META_CUT`.
16. Complete semantics of `grid.NAVIGATION_TYPE` versus
    `misc.NAVIGATION_TYPE`.
17. How device language support changes theme asset lookup.
18. Whether `hdmi` capability means only `1280x720` support or additional
    behavior.

These should become explicit compatibility tests against a physical device,
official documentation, or muOS source when available.

## 20. Research conclusion

The reference corpus is sufficient to design a credible theme inspector and a
high-value browser preview, but not sufficient to promise exact emulation.

The strongest verified model is:

- themes are layered collections of INI schemes and raster/binary assets
- assets can be shared or resolution-specific
- screen IDs namespace glyphs, wallpapers, and scheme overrides
- presentation is composed from common list/grid/header/footer/modal
  primitives
- alternates range from small colour overrides to full ZIP-packed asset sets
- exact text rendering and fallback semantics remain the largest fidelity
  risks

The first implementation phase should use these findings as a compatibility
contract, while keeping every unverified behavior visible and replaceable when
authoritative muOS runtime information becomes available.
