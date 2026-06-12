# Server

The local Node server binds to `127.0.0.1` and exposes:

- `GET /api/theme-inspection`, backed by the existing
  `ThemeInspectionService` and `NodeThemeScanner`
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
