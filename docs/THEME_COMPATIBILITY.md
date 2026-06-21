# Theme Compatibility Audit

## Scope and Method

The requested `references/muOS/themes/` directory does not exist in this
checkout. This audit recursively inspected every direct entry under the
available `references/MUOS/theme/` corpus on 2026-06-21.

Evidence includes scanner output, all scheme paths, parsed `default.ini`,
`global.ini`, and `muxlaunch.ini` values, asset paths and sizes, and visual
inspection of representative wallpaper/grid/baked assets. Image dimensions
and pixels were not analyzed programmatically, so undocumented composition and
sprite behavior remain uncertain.

## Corpus Inventory

| Theme | Resolutions | Schemes | Wallpapers | Glyphs | Fonts | Localization | Family |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| `active` | none | 0 | 0 | 0 | 0 | none | empty entry |
| `Epic Noir` | `640x480` | 1 | 0 | 0 | 0 | none | partial scheme-only |
| `muOS - Banana` | `640x480` | 3 | 0 | 0 | 0 | none | scheme-only |
| `Muos Console Grid` | `640x480` | 9 | 8 | 427 | 3 | none | composited grid |
| `MustardOS` | six | 55 | 2 | 1635 | 18 | none | composited grid without launcher wallpaper |
| `MuxRemix-Grid` | six | 18 | 6 | 1632 | 6 | none | composited grid without launcher wallpaper |
| `Royal Dark MU` | `640x480` | 3 | 12 | 0 | 1 | none | baked full-screen states |
| `Terminal - Redacted` | six | 40 | 14 | 1685 | 10 | none | wallpaper plus static composition |

The six multi-resolution sizes are `640x480`, `720x480`, `720x576`,
`720x720`, `1024x768`, and `1280x720`.

No theme-local translation catalog, locale file, PO/MO file, or label database
was found. Files named `language.png` are glyph assets. Localized labels are
therefore runtime data or come from a reference source absent from this corpus.

## Theme Families

### Baked UI

Royal Dark MU stores complete launcher states at
`image/wall/muxlaunch/<item>.png`. Artwork includes title, instructions,
selection, icons, and decorative layout. It works because current exact path
and filename assumptions happen to match this theme, while most generated
layers are suppressed.

### Composited Grid

Console Grid, MustardOS, and MuxRemix provide separate menu artwork under
`image/grid/muxlaunch/`, `glyph/muxlaunch/`, or both. Their appearance depends
on scheme inheritance, radius, focus colors, gradients, recoloring, shadows,
and geometry. These are the themes most damaged by incomplete scheme loading.

### Static Composition

Terminal combines a default wallpaper with
`image/static/muxlaunch/<item>.png`, overlays, and runtime status assets. The
static state is not equivalent to either a menu glyph or a complete baked
wallpaper.

### Scheme-only and Partial

Banana has default/muxlaunch/muxplore schemes but no visual assets or fonts.
Epic Noir contains only `muxplore.ini`. They are useful parser fixtures, but
the available directories cannot produce faithful muxlaunch previews.

### Empty

`active` contains no files and is not a renderable theme.

## Compatibility Matrix

| Theme | What works | What fails | Root cause and responsible assumption |
| --- | --- | --- | --- |
| Royal Dark MU | Full-screen states are recognizable; aliases mostly match; duplicated generated layers are suppressed | Hotspots/navigation are approximate; state aliases can still diverge | Exact baked path happens to match. Interaction geometry is hardcoded rather than derived from state metadata |
| MustardOS | Separate launcher images/glyphs are discovered; row/column count loads | Missing/wrong background, card shape, radius, colors, gradients, recoloring, and some resolution-specific geometry | Shared `scheme/global.ini` is ignored; sparse muxlaunch files are treated as complete; unrelated wall files are not launcher backgrounds |
| muOS - Banana | Schemes parse and some header/list values map | No wallpaper, glyphs, menu images, or fonts; grid falls back to generic content | Corpus entry is scheme-only. Code assumes a muxlaunch scheme implies enough data for a visual screen |
| Epic Noir | Resolution and `muxplore.ini` are inspectable | No muxlaunch model or visual assets; almost everything falls back | Entry is a partial muxplore fixture, not a complete muxlaunch theme. Code lacks an explicit partial/unsupported state |
| Muos Console Grid | Real grid art, glyphs, and muxlaunch wallpaper are found; layout count is correct | Focus is yellow instead of blue; corners and styling are wrong | Blue `CELL_FOCUS_BACKGROUND = 05A3E6` and `CELL_RADIUS = 16` are in root `scheme/global.ini`, which the provider never merges. Renderer uses yellow and zero-radius defaults |
| MuxRemix-Grid | Resolution-specific menu assets and schemes are found | Fidelity varies by resolution; wallpaper and inherited styling can be incomplete | Mixed root/resolution scope and sparse overrides conflict with exact lookup and incomplete source layering |
| Terminal - Redacted | Default walls, static states, overlays, and header glyphs match known paths | Runtime/static layer boundaries and interaction regions remain inferred | Static state composition is recognized, but renderer hotspots and status ownership are hardcoded |
| active | Directory can be scanned | No preview is possible | Empty corpus entry; no explicit renderability contract existed |

## Specific Investigations

### Glyph Discovery

Current discovery requires raster files below a directory literally named
`glyph`. Launcher selection then requires `glyph/muxlaunch/` or
`image/grid/muxlaunch/` and a small fixed alias list. When no alias matches,
the renderer assigns the next unused asset, which can display the wrong icon.

Royal contains no glyphs because icons are baked. Terminal has many glyphs but
uses static launcher images. Banana and Epic have no glyphs in the available
files. Missing glyphs are therefore not one universal error condition.

### Wallpapers

The inspector marks every image below both `image` and `wall` as a wallpaper,
then prefers a file named `default`. The visual-layer service accepts only
`image/wall/default.*` or `image/wall/muxlaunch.*`.

MustardOS and MuxRemix contain other screen walls but no verified launcher
wall. Reusing `muxcharge.*` or `muxplore.*` would be incorrect. Royal's nested
wall states are complete screens, not ordinary backgrounds.

### Focus Color

The mapper supports `grid.CELL_FOCUS_BACKGROUND`, but the provider does not
load shared `scheme/global.ini`. Console Grid's verified blue focus
`05A3E6` is therefore absent from the render model. The renderer substitutes
hardcoded `#F3BD3D`, explaining the observed yellow focus.

Alternates can also patch focus colors. They are discovered as auxiliary files
but never parsed into the active model.

### Rounded Corners

The mapper supports `grid.CELL_RADIUS`, and the renderer applies it directly.
The failure is primarily upstream:

- Console Grid defines `CELL_RADIUS = 16` in ignored root `global.ini`.
- MustardOS defines a shared radius of 16 and resolution overrides of 26 for
  `1024x768` and `1280x720`.
- Resolutions without a local `default.ini` lose the shared radius entirely.

When radius is absent, the renderer passes no border radius, producing square
cards. Gradient, shadow, and current-label radius keys are also unmapped.

### Localization

The title and menu labels are hardcoded English fixture strings, including
`Main Menu`, `Explore`, and `Favourites`. No theme-local translation source was
found. Localized output such as `MENU PRINCIPAL` cannot be derived from these
theme files and should be modeled as external preview fixture data.

### muxlaunch Scheme Loading

Current loading merges only resolution-local `default.ini` followed by
resolution-local `muxlaunch.ini`. It ignores:

- root `scheme/global.ini`
- root/shared screen schemes
- alternate INI patches
- provenance of overwritten values
- potentially version-specific layering rules

Sparse muxlaunch files containing only `COLUMN_COUNT` and `ROW_COUNT` are
therefore mistaken for nearly complete style sources.

## Top 10 Assumptions Ranked by Risk

Confidence below means confidence that the assumption exists and affects the
observed result, not confidence that the assumption matches muOS.

| Rank | Assumption | Confidence | Risk | Impact if incorrect |
| ---: | --- | --- | --- | --- |
| 1 | Resolution `default.ini` plus `muxlaunch.ini` is the complete scheme stack | High | Critical | Drops global focus, radius, colors, geometry, and status values; proven for Console and Mustard |
| 2 | Exact known folders are sufficient to identify every semantic asset role | High | High | Valid assets are missed; unfamiliar themes immediately fall back |
| 3 | A discovered muxlaunch scheme implies a renderable muxlaunch theme | High | High | Scheme-only Banana is presented as a poor theme render instead of a partial fixture |
| 4 | Missing focus/radius values can safely use yellow and square-card defaults | High | High | Fallback styling is mistaken for theme styling; explains Console mismatch |
| 5 | Menu identity can be inferred from eight fixed English aliases | High | High | Icons are missing or assigned to the wrong item; localized/custom entries cannot map |
| 6 | An unmatched item may use any unused launcher asset | High | High | Produces plausible but semantically incorrect previews |
| 7 | Baked, static, grid, and wallpaper assets can be classified solely by path | High | High | Wrong layer ownership causes duplicated or missing artwork |
| 8 | Resolution-specific assets always override shared-root assets | High | Medium-high | Mixed-scope themes may select the wrong version; actual muOS precedence is unverified |
| 9 | Supported scheme keys are enough; gradients, recoloring, shadows, and alternates can be ignored | High | High | Composited themes lose their defining shape and color behavior |
| 10 | Labels and title belong to the theme and can use hardcoded English fixtures | High | Medium | Localized preview is misleading and cannot match device output |

## Supported Structures

Supported with reasonable confidence:

- resolution directory detection
- recursive file inventory
- INI sections, keys, and values without interpretation
- exact default/muxlaunch wall paths
- exact muxlaunch grid/glyph paths
- Royal-style nested baked states
- Terminal-style static states
- root-shared and resolution-specific asset inclusion in selected renderer paths

Support is structural, not pixel-perfect.

## Unsupported or Unreliable Structures

- verified global/default/screen/alternate scheme precedence
- arbitrary asset naming and semantic role resolution
- sprite sheets and slicing metadata
- image-dimension-based full-screen detection
- gradient, shadow, recolor, and several radius variants
- custom menu models or runtime-provided item order
- localized labels and titles
- complete font decoding and metrics
- automatic detection of baked artwork outside known paths
- verified root-versus-resolution precedence

## Risk Areas

The highest-risk boundary is between scanning and rendering. Raw assets and a
partial scheme model reach React, where components repeat path selection,
aliases, and fallback policy. This disperses compatibility behavior and makes
one successful theme look like proof of a general model.

The next architecture should produce a resolved manifest with family,
semantic roles, source provenance, confidence, and diagnostics before the
renderer runs. See `THEME_LOADING_CONTRACT.md`.
