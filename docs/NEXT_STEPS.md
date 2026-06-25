# Recommended Next Steps

## Direction

Pause renderer features, navigation work, muxplore, and visual polish until a
resolved theme-loading model replaces the current path and fallback assumptions.

The next work should improve evidence, provenance, and compatibility rather
than add visible surface area.

## Milestone A: Compatibility Fixtures

Create small, committed fixtures representing the five observed families:

- baked UI
- composited grid
- static composition
- scheme-only/partial
- empty/unsupported

Fixtures should preserve paths and representative scheme keys without copying
the ignored reference corpus wholesale. Add snapshot tests for inventory,
family detection, selected roles, and diagnostics.

Exit criteria:

- every current family has a deterministic test
- single-resolution and mixed-scope themes are covered
- no renderer changes are required to validate loading

## Milestone B: Scheme Source Model

Introduce a core model for scheme layers and per-value provenance.

Discover:

- root `scheme/global.ini`
- resolution `scheme/default.ini`
- resolution `scheme/muxlaunch.ini`
- alternate patches

Implement a named provisional merge profile only after tests encode the
observed corpus. Keep unknown keys and report conflicts. Verify the proposed
order against muOS source or a physical device before calling it canonical.

This milestone should directly explain Console Grid's blue focus and radius
without changing renderer CSS.

## Milestone C: Semantic Asset Manifest

Build a framework-agnostic resolver that maps inventory to roles:

- launcher background
- full baked state
- static state
- menu image/glyph
- status glyph
- overlay
- font

Each role should expose selected source, alternatives, confidence, reason, and
fallback. Add image dimensions and alpha metadata in the server layer.

Do not permit arbitrary unused glyph substitution.

## Milestone D: Family Detection

Detect a presentation family per resolution using the resolved roles and image
metadata. Ambiguous themes must remain ambiguous and produce diagnostics.

The family decision belongs in core. React should receive the family and
resolved layers rather than inspecting paths.

## Milestone E: Resolved Preview Model

Define one API model containing:

- logical resolution
- family
- ordered visual layers
- resolved menu items
- merged scheme values with provenance
- external label/locale fixture
- fallback flags and warnings

Migrate existing renderer components to consume this model. Remove path search,
scheme interpretation, and arbitrary asset selection from React.

This is an architectural migration, not a visual redesign.

## Milestone F: Corpus Regression Harness

Run the loader against every local reference theme and produce a machine-
readable compatibility report. Fail tests on crashes, path escapes, stale
cross-theme data, or unexplained role changes.

Track fidelity expectations separately:

- Royal: baked state selected, generated menu/status suppressed
- Console: global blue focus and radius have provenance
- MustardOS: shared global style plus resolution override is represented
- Banana: explicitly partial, no fabricated visual fidelity claim
- Epic Noir: explicitly unsupported for muxlaunch from available files
- Terminal: background/static/status ownership remains separate

### Milestone F audit update

The corpus audit now validates the full pipeline:

```text
Theme -> Inspection -> Theme Family -> Asset Manifest -> PreviewModel
```

Implemented generic rendering pattern:

- **Shared global scheme layer**
  - Applies to themes with a root `scheme/global.ini` plus resolution-local
    muxlaunch schemes.
  - The PreviewModel builder now receives parsed schemes in the order:
    shared global, resolution default, screen-specific muxlaunch.
  - Improved themes: Muos Console Grid and MustardOS across every detected
    resolution.
  - Root cause: the asset manifest already exposed `scheme/global.ini` as an
    alternative, but PreviewModel generation only parsed resolution-local
    default and muxlaunch schemes. Shared focus color and radius values
    therefore fell back to muxpreview defaults.
  - Result: Console Grid and MustardOS resolve the shared blue focus background
    and radius through the PreviewModel rather than renderer fallback styling.

Remaining reusable rendering gaps:

- **Background-optional composited grids**
  - Affected themes: MustardOS, MuxRemix-Grid.
  - These themes provide muxlaunch grid artwork without a launcher wallpaper.
    The current diagnostic still reports missing launcher wallpaper even when
    the family pattern can render a useful grid preview without one.
  - Needed rule: family-aware diagnostics should distinguish optional
    wallpaper from missing visual content.

- **Shared versus resolution-specific launcher assets**
  - Affected themes: MustardOS, MuxRemix-Grid.
  - Mixed root and resolution-scoped grid/glyph assets are currently reported
    as compatibility diagnostics even when the resolver successfully chooses
    resolution-specific assets.
  - Needed rule: diagnostics should classify mixed scopes as provenance
    information when selection is unambiguous.

- **Manifest fuzzy glyph candidates**
  - Affected themes: Console Grid, MustardOS, Terminal - Redacted.
  - Launcher-like filenames under unrelated glyph namespaces, such as
    `glyph/muxkiosk` or `glyph/muxbackup`, can appear as menu glyph
    candidates in the manifest. PreviewModel menu rendering already prefers
    `glyph/muxlaunch` and `image/grid/muxlaunch`, so this is currently a
    manifest explanation gap rather than a renderer bug.
  - Needed rule: semantic manifest roles should rank exact screen namespace
    matches ahead of filename-only aliases.

Unsupported or intentionally partial cases:

- Epic Noir currently has only a muxplore scheme in the inspected resolution;
  PreviewModel generation reports missing muxlaunch scheme, launcher wallpaper,
  launcher content, header glyphs, and fonts.
- muOS - Banana is scheme-only/partial for muxlaunch; it produces a structural
  PreviewModel with diagnostics and no fabricated visual assets.
- Empty or unsupported fixtures without a resolution do not produce a
  PreviewModel; inspection diagnostics must explain the missing resolution.

## Milestone G: Renderer Fidelity

Resume renderer work only after Milestones A-F are stable. Then implement
missing scheme effects in evidence-driven order:

1. focus colors and alpha
2. radius and border geometry
3. image recoloring
4. gradients
5. shadows
6. font metrics

Each effect should have a corpus fixture and provenance in the resolved model.

## Deferred Work

Keep these deferred until compatibility is stable:

- navigation improvements
- muxplore rendering
- new screens
- editing and drag/drop
- hot reload expansion
- visual polish unrelated to verified theme data

## Recommended Immediate Commit Sequence

1. Document the loading contract and audit findings.
2. Add compatibility fixtures and scheme-layer tests.
3. Implement scheme provenance and family detection in core.
4. Implement semantic asset resolution and image metadata.
5. Move renderer path decisions into the resolved preview model.

The first implementation milestone should be the scheme source model because
it explains the observed Console Grid and MustardOS failures with the strongest
available evidence.
