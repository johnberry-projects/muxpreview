# muxpreview

Local development server and live preview tool for muOS themes. Build, test,
and iterate on themes without a console.

The current build provides a TypeScript theme scanner, CLI, local browser
inspection dashboard, and resolution-aware wallpaper preview.

```sh
pnpm install
pnpm run build
pnpm run inspect -- ./path/to/theme
```

To inspect a theme in the built browser dashboard:

```sh
pnpm run build
pnpm start -- ./path/to/theme
```

On PowerShell, quote paths containing spaces:

```powershell
pnpm start -- "C:\path to\theme"
```

The environment variable form is also supported:

```powershell
$env:MUXPREVIEW_THEME_PATH = "C:\path\to\theme"
pnpm start
```

Open `http://127.0.0.1:4174`.

For muxpreview application development, run the API and Vite processes in
separate terminals:

```sh
pnpm run dev:server -- ./path/to/theme
```

```sh
pnpm run dev
```

Vite proxies `/api` requests to the local server. After a build, the package
executable can also be invoked as:

```sh
node dist/cli/index.js inspect ./path/to/theme
```

The dashboard can switch among detected resolutions and display real
`image/wall/` assets. Full muOS screen rendering and theme-file live reload
remain intentionally deferred.
