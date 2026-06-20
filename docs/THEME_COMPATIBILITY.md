# Theme Compatibility Audit

## Scope

The requested `references/themes/` directory is not present in this
repository. This audit covers every direct directory under
`references/MUOS/theme/` as of 2026-06-20.

The results come from the existing TypeScript scanner, path-level asset
analysis, scheme inventory, and representative visual inspection. They do not
claim complete muOS runtime behavior.

## Themes Analyzed

| Theme | Resolutions | Composition style | Important differences |
| --- | --- | --- | --- |
| `active` | none | empty entry | No assets, schemes, fonts, or resolution folders. |
| `Epic Noir` | `640x480` | partial scheme fixture | Contains only `muxplore.ini`; no muxlaunch scheme or theme assets. |
| `muOS - Banana` | `640x480` | scheme-only fixture | Contains default, muxlaunch, and muxplore schemes but no images, glyphs, or fonts. |
| `Muos Console Grid` | `640x480` | composited grid | Root-shared grid images and glyphs, screen wallpapers, muxlaunch scheme, no `default.ini`. |
| `MustardOS` | six supported resolutions | composited grid | Mixes root-shared assets with `1024x768` and `1280x720` overrides; no launcher/default wallpaper; `640x480` has no `default.ini`. |
| `MuxRemix-Grid` | six supported resolutions | composited grid | Resolution-specific grid images, mixed root/resolution glyphs, no launcher/default wallpaper. |
| `Royal Dark MU` | `640x480` | baked full-screen states | Uses `image/wall/muxlaunch/<item>.png`, has no glyphs, and includes `favourite.png` alongside `collection.png`. |
| `Terminal - Redacted` | six supported resolutions | static content composition | Uses per-resolution `image/static/muxlaunch/<item>.png`, default wallpapers, overlays, and header glyphs; no muxlaunch item glyphs. |

The six observed full-theme resolutions are:

- `640x480`
- `720x480`
- `720x576`
- `720x720`
- `1024x768`
- `1280x720`

## Structural Differences

### Wallpapers

- `wall/default.png` is not universal.
- `wall/muxlaunch.png` appears in some composited themes but is absent from
  others.
- MustardOS and MuxRemix-Grid contain unrelated wall assets such as
  `muxcharge.png`; these must not be reused as launcher backgrounds.
- Royal Dark MU stores complete selected launcher states below
  `image/wall/muxlaunch/`.
- Terminal wallpapers provide background/header chrome while launcher content
  is supplied separately by static images.

### Launcher Content

Three incompatible composition patterns are present:

1. Runtime grid composition from `image/grid/muxlaunch/` and/or
   `glyph/muxlaunch/`.
2. Static content states from `image/static/muxlaunch/` rendered over a
   separate wallpaper and runtime status layer.
3. Full-screen baked states from `image/wall/muxlaunch/<item>.png`, where
   generated menu and status layers can duplicate artwork.

Partial fixtures contain no launcher artwork and require a label-only
structural preview rather than failing or displaying broken asset markers.

### Asset Scope

- Assets may be shared at theme root.
- Assets may be resolution-specific.
- Some themes contain both. muxpreview currently prefers resolution-specific
  assets and falls back to root assets. This is a preview convention, not a
  verified muOS precedence rule.

### Schemes

- `muxlaunch.ini` is absent from Epic Noir and the empty `active` entry.
- `default.ini` is absent from Muos Console Grid and MustardOS `640x480`.
- A theme can contain valid schemes without any visual assets.
- muxpreview currently combines a selected resolution's `default.ini` and
  `muxlaunch.ini` when both exist. Complete global/alternate layering remains
  unverified.

### Glyphs and Fonts

- Royal Dark MU has no glyph assets because launcher visuals are baked.
- Terminal supplies header glyphs but no muxlaunch item glyphs.
- Grid themes may contain both image-grid assets and matching glyphs.
- Fonts can be root-shared, resolution-specific, or absent.
- Observed image formats include PNG, BMP, and GIF.

### Naming

Observed muxlaunch basenames are:

`apps`, `collection`, `config`, `explore`, `favourite`, `history`, `info`,
`reboot`, and `shutdown`.

`collection` and singular `favourite` both represent the Favourites item in
available references. Display labels and localized titles are runtime data and
must not be inferred solely from filenames.

## Unsafe Assumptions

The following assumptions are unsafe:

- every theme has a resolution folder
- every resolution has `default.ini` and `muxlaunch.ini`
- every launcher has `wall/default.png` or `wall/muxlaunch.png`
- launcher icons are always separate glyphs
- launcher item filenames are completely consistent
- root assets are absent when resolution assets exist
- wallpaper images contain only backgrounds
- all static muxlaunch images include the same visual layers
- header glyphs always exist
- theme fonts always exist
- unrelated screen wallpapers are valid launcher fallbacks

## Current Fallback Behavior

- Missing resolution: the browser shows an unavailable preview state.
- Missing muxlaunch scheme: mapped values fail independently and renderer
  defaults remain available.
- Missing launcher wallpaper: the virtual canvas uses its neutral background.
- Missing launcher content: label-only items remain visible without fabricated
  icon artwork.
- Missing header glyphs: CSS status indicators are used unless a baked
  full-screen state suppresses runtime status.
- Root-only assets: shared assets remain eligible for every resolution.
- Mixed root/resolution assets: resolution-specific candidates are preferred.
- Baked wall states: generated launcher and status layers are suppressed.
- Static content states: the wallpaper and runtime status remain separate.

Inspect Mode reports these fallbacks as compatibility warnings for the
selected resolution.

## Remaining Uncertainties

- Exact muOS root-versus-resolution lookup precedence
- Complete scheme merge order and built-in defaults
- Whether every nested muxlaunch wall directory represents a full-screen state
- Runtime localization source and title selection
- Font decoding and exact text metrics
- Device compositor behavior for overlays and alpha values
