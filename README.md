# muxpreview

muxpreview is a local browser preview and inspection tool for muOS themes. It
helps theme authors inspect assets, browse scheme files, and preview
`muxlaunch`-style screens without copying every change to a physical device.

The project is intentionally local-first. It runs against an unpacked theme
folder on your machine and serves a browser UI from a loopback development
server.

## What Works Today

- TypeScript theme scanner for unpacked muOS theme folders
- CLI inspection command
- local browser inspection dashboard
- Preview and Inspect workspace modes
- resolution selector for detected theme resolutions
- resolution-aware wallpaper preview
- read-only Scheme Explorer
- Virtual Display Canvas with logical resolution scaling
- Glyph Explorer with selectable real theme assets
- mapped `muxlaunch` preview using real wallpapers, glyphs, static images, and
  scheme values where supported
- status/header preview with theme glyphs and mapped colours where available
- Theme Composition analysis for baked artwork, glyph usage, overlays, and
  duplication risks

The renderer is useful for theme iteration, but it is not yet a pixel-perfect
muOS implementation.

## Screenshots

Screenshots will be added once stable reference captures are available.

Suggested future captures:

- Preview Mode with mapped `muxlaunch`
- Inspect Mode with Scheme Explorer
- Glyph Explorer
- Theme Composition report

## Requirements

- Node.js 20 or newer
- pnpm

## Install

```sh
pnpm install
```

## CLI Inspection

Inspect a theme folder from the terminal:

```sh
pnpm run inspect -- ./path/to/theme
```

The CLI prints detected resolutions, scheme files, fonts, glyphs, images, and
warnings for missing expected folders.

## Browser Preview

Build the project and start the local server:

```sh
pnpm run build
pnpm start -- ./path/to/theme
```

Then open:

```text
http://127.0.0.1:4174
```

On PowerShell, quote paths containing spaces:

```powershell
pnpm start -- "C:\path to\theme"
```

You can also configure the theme path with an environment variable:

```powershell
$env:MUXPREVIEW_THEME_PATH = "C:\path\to\theme"
pnpm start
```

## Development

Run the API server and Vite app in separate terminals:

```sh
pnpm run dev:server -- ./path/to/theme
```

```sh
pnpm run dev
```

Vite proxies `/api` requests to the local muxpreview server.

## Current Limits

- no hot reload yet
- no theme editing
- no `.muxthm` package loading
- no muxplore renderer
- no full scheme coverage
- no verified pixel-perfect device output
- no browser-based file writes

Some theme behavior is still inferred from available reference files. When
muxpreview cannot verify behavior, the UI should present it as approximate,
heuristic, or unknown.

## Planned Work

Near-term work focuses on:

- better effective scheme layering and provenance
- broader muxlaunch layout coverage
- focused validation rules
- live reload for theme edits
- CLI improvements
- eventual public showroom support

See [docs/ROADMAP.md](docs/ROADMAP.md) for the detailed roadmap.
