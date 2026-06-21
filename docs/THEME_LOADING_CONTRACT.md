# Theme Loading Contract

## Purpose

This contract defines the boundary between theme discovery, interpretation,
serving, and rendering. It is based on the eight entries currently available
under `references/MUOS/theme/`. It does not claim undocumented muOS behavior.

The requested `references/muOS/themes/` path is absent in this checkout.

## Core Principle

React must receive a resolved theme model, not raw files that components must
interpret. Every selected value or asset must carry its source, confidence,
and fallback status.

The loading pipeline should be:

1. Scan every file without assigning screen meaning.
2. Classify files by physical type and scope.
3. Discover scheme layers and preserve their provenance.
4. Detect a presentation family per resolution.
5. Resolve semantic asset roles with ranked candidates.
6. Validate the resolved model and emit explicit diagnostics.
7. Render only the resolved model.

## Theme Manifest

A resolved manifest should contain:

- theme root and theme name
- available resolutions
- all files with normalized relative paths
- physical type: scheme, image, glyph, font, sound, metadata, unknown
- scope: shared root, resolution-specific, alternate, or unknown
- image metadata: format, width, height, alpha presence when available
- parsed scheme sources and merge provenance
- detected theme family and confidence
- resolved semantic roles and alternative candidates
- missing requirements and applied fallbacks
- unsupported or ambiguous structures

The manifest must distinguish facts from inference. For example,
`image/wall/muxlaunch/explore.png` is a fact; treating it as a complete baked
screen is an inference supported by the current corpus.

## Required Assets

There is no universal set of visual assets required by every theme.

### Inspection

Only a readable theme directory is required. Empty and scheme-only entries are
valid inspection inputs, but not necessarily renderable themes.

### Baked UI Family

Required for a visual muxlaunch preview:

- one resolution
- at least one full-screen muxlaunch state, currently observed at
  `image/wall/muxlaunch/<item>.*`

A muxlaunch scheme, menu glyphs, and runtime status glyphs are optional because
the screen may already contain those elements.

### Static Composition Family

Required:

- one resolution
- a compatible background
- at least one static muxlaunch state, currently observed at
  `image/static/muxlaunch/<item>.*`

Status assets and overlay configuration are optional layers.

### Composited Grid Family

Required:

- one resolution
- menu artwork from `image/grid/muxlaunch/`, `glyph/muxlaunch/`, or another
  resolver-confirmed equivalent
- enough resolved layout data to place that artwork, or an explicitly labeled
  structural fallback

A launcher wallpaper is optional. MustardOS and MuxRemix demonstrate valid
menu artwork without `wall/default.*` or `wall/muxlaunch.*`.

### Scheme-only or Partial Family

No faithful visual preview is promised. Inspection remains supported. The UI
must explain which visual inputs are absent rather than presenting fallback
styling as theme output.

## Optional Assets

- default or screen-specific wallpaper
- header and status glyphs
- image overlay
- theme fonts
- sounds and RGB scripts
- catalogue artwork
- alternate style patches
- localization supplied by the muOS runtime

Catalogue artwork is not a wallpaper fallback. Theme files named
`language.png` are glyphs, not translation sources.

## Scheme Resolution

The corpus contains these possible sources:

- shared `scheme/global.ini`
- resolution-local `scheme/default.ini`
- resolution-local `scheme/muxlaunch.ini`
- `alternate/*.ini` patches

The current provider reads only resolution-local `default.ini` and
`muxlaunch.ini`. This is proven insufficient: Console Grid's blue focus and
radius exist in shared `scheme/global.ini`.

The loader must discover all candidate layers and retain source provenance for
every final key. A provisional preview policy may apply:

1. shared global
2. resolution default
3. screen-specific muxlaunch
4. explicitly selected alternate

This order is a proposed compatibility policy, not verified muOS behavior. It
must remain named, testable, replaceable, and visible in diagnostics.

Key matching should remain case-preserving in source data while normalized
lookup is handled centrally. Unknown keys must survive parsing. Gradients,
image recoloring, shadows, and alternate patches must not be silently treated
as if their effects were absent.

## Asset Resolution Strategy

Assets must be resolved by semantic role rather than one exact path.

Roles include:

- launcher background
- baked launcher state
- static launcher state
- menu image
- menu glyph
- status glyph
- overlay
- font

Candidate ranking should consider:

- selected-resolution scope before shared scope
- exact observed screen paths before fuzzy names
- filename aliases such as `collection` and `favourite`
- image dimensions and alpha where available
- compatibility with the detected family
- explicit rejection of another screen's assets

Resolution-specific precedence is currently a muxpreview convention, not a
verified muOS rule. The resolver must expose alternatives and its selection
reason.

It must not assign an arbitrary unused glyph when a semantic match fails. A
missing icon is more accurate than a wrong icon.

## Wallpaper Strategy

The term wallpaper covers several incompatible roles:

- simple screen background
- background containing header or decorative chrome
- full baked selected state
- unrelated screen background

`default.*` is not universal. `muxlaunch.*` is not universal. Files such as
`muxcharge.*` and `muxplore.*` must not be used for muxlaunch merely because
they are wallpapers.

Background selection must use the resolved role from the manifest. Renderer
components must not independently select `resolution.wallpaper`.

## Family Detection

Milestone B performs theme-level detection from the complete inspection
inventory. It does not use theme names, parse image pixels, or change renderer
behavior.

Rules are evaluated in this order:

| Family | Observable rule | Confidence |
| --- | --- | ---: |
| `baked-ui` | One or more images at `image/wall/muxlaunch/<item>.*` | `0.98` |
| `static-composition` | One or more images at `image/static/muxlaunch/<item>.*` | `0.97` |
| `composited-grid` | Images at `image/grid/muxlaunch/<item>.*` or glyphs at `glyph/muxlaunch/<item>.*` | `0.90`; `0.96` when both are present |
| `scheme-only-partial` | Scheme files exist but no raster images or glyphs exist | `0.90` with a resolution; otherwise `0.75` |
| `empty-unsupported` | No recognized family | `1.00` when structurally empty; `0.50` when assets exist in an unsupported structure |

The inspection model exposes the selected family, confidence, and human-
readable evidence. The API returns the same data because it serializes the
inspection model directly. Inspect Mode displays it without using it to choose
a renderer.

Precedence is intentionally conservative: known full compositions win over
grid structures. This is a fixture-backed compatibility rule, not verified
muOS behavior. Detection is currently theme-level; per-resolution family
variation and ambiguity reporting remain future loading-contract work.

## Fallback Strategy

Fallbacks are product states, not hidden substitutions.

- Missing background: use a neutral canvas and label it as generated.
- Missing icon: use a neutral placeholder; never substitute an unrelated icon.
- Missing colors or radius: use documented structural defaults and mark them
  as fallback values.
- Missing scheme: baked assets may still render; composited themes remain
  structural previews.
- Missing localization: use fixture text supplied by preview configuration,
  not text inferred from asset filenames.
- Unsupported family: show inventory and diagnostics without pretending the
  fallback is faithful.

Warnings must identify the missing role, candidates considered, selected
fallback, and affected renderer behavior.

## Responsibilities

### Core

- normalize scanner output
- parse schemes without losing unknown data
- model source layers and merge provenance
- detect families
- resolve semantic asset roles
- validate compatibility
- produce a framework-agnostic resolved manifest

Core must not access the filesystem or contain React.

### Server

- perform filesystem traversal and safe file reads
- decode image/font metadata needed by core
- provide configured theme and alternate selection
- cache inspection and resolved manifests
- serve only assets present in the manifest
- expose diagnostics and provenance through JSON APIs

The server must not choose CSS values or duplicate core resolution rules.

### Renderer

- render logical coordinates from the resolved model
- render the selected family using explicit layers
- display fallback and unsupported states honestly
- maintain preview-only interaction state

The renderer must not search paths, merge schemes, infer asset roles, choose
arbitrary glyphs, or treat hardcoded colors as theme values.

## Localization Contract

No translation or locale data was found inside the eight theme entries.
`language.png` files are menu glyphs. Localized titles therefore appear to be
runtime data outside the available theme corpus.

The resolved model should accept a preview locale fixture separately from the
theme. Until a verified runtime translation source exists, title and menu text
must be marked as fixture content.

## Acceptance Criteria

A loader conforms to this contract when:

- every rendered asset and scheme value has provenance
- family detection is explicit and testable
- missing assets do not cause unrelated substitutions
- shared, resolution, screen, and alternate scheme sources remain visible
- switching themes cannot retain stale data from another theme
- unsupported themes explain why fidelity is limited
- React receives no raw path-selection responsibility
