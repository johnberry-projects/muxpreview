# Server

The local Node server binds to `127.0.0.1` and exposes:

- `GET /api/muxlaunch-render-model?resolution=640x480`, mapping the exact
  resolution-specific `muxlaunch.ini`
- `GET /api/theme-inspection`, backed by the existing
  `ThemeInspectionService` and `NodeThemeScanner`
- `GET /api/theme-glyph?path=glyph%2Fheader%2Fnetwork_active.png`, serving an
  inspected glyph asset
- `GET /api/theme-scheme?path=640x480%2Fscheme%2Fmuxlaunch.ini`, returning a
  parsed read-only scheme document
- `GET /api/theme-wallpaper?resolution=640x480`, serving the selected
  resolution wallpaper
- the built React application from `dist-app/`

Pass the unpacked theme directory when starting the server:

```sh
pnpm start -- ./path/to/theme
```

`MUXPREVIEW_THEME_PATH` is used when no command argument is supplied.
`MUXPREVIEW_PORT` optionally overrides the default port `4174`.

The server does not watch theme files or render muOS screens. In Vite
development, start it with `pnpm run dev:server -- ./path/to/theme`; the Vite
configuration proxies `/api` to it.

Wallpaper responses are restricted to files classified during inspection under
`<resolution>/image/wall/`. The server prefers `default.*`; when it is absent,
the first candidate in relative-path order is used. That fallback is a
muxpreview convention, not a verified muOS selection rule.

Scheme responses are restricted to files already classified as scheme files by
the inspection service. Parsing extracts section names, keys, text values, and
line numbers. It does not interpret types, apply defaults, merge files, or
resolve effective values.

Glyph responses are restricted to files already classified as glyphs by the
inspection service. The endpoint does not accept arbitrary theme files or
filesystem paths.

The muxlaunch render model reuses the existing scheme parser. It does not merge
`global.ini`, `default.ini`, alternates, or built-in defaults. Missing values
and unmapped assignments remain explicit in the response.
