# muxpreview

Local development server and live preview tool for muOS themes. Build, test,
and iterate on themes without a console.

The first build iteration provides a TypeScript theme scanner and CLI.

```sh
pnpm install
pnpm run build
pnpm run inspect -- ./path/to/theme
```

After a build, the package executable can be invoked as:

```sh
node dist/cli/index.js inspect ./path/to/theme
```

Browser rendering and live reload are intentionally deferred.
