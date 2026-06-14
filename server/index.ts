import { createServer, type Server } from "node:http";
import path from "node:path";

import { createMuxlaunchRenderModelApi } from "./muxlaunch-render-model-api";
import { createMuxlaunchVisualLayersApi } from "./muxlaunch-visual-layers-api";
import { createStaticAppHandler } from "./static-app";
import { createThemeGlyphApi } from "./theme-glyph-api";
import { createThemeImageApi } from "./theme-image-api";
import { createThemeInspectionApi } from "./theme-inspection-api";
import { ThemeInspectionProvider } from "./theme-inspection-provider";
import { createThemeSchemeApi } from "./theme-scheme-api";
import { createThemeWallpaperApi } from "./theme-wallpaper-api";

export interface MuxpreviewServerOptions {
  staticRoot?: string;
  themePath?: string;
}

export function createMuxpreviewServer(
  options: MuxpreviewServerOptions = {},
): Server {
  const inspectionProvider = new ThemeInspectionProvider(
    options.themePath ?? process.env.MUXPREVIEW_THEME_PATH,
  );
  const handleMuxlaunchRenderModel =
    createMuxlaunchRenderModelApi(inspectionProvider);
  const handleMuxlaunchVisualLayers =
    createMuxlaunchVisualLayersApi(inspectionProvider);
  const handleThemeGlyph = createThemeGlyphApi(inspectionProvider);
  const handleThemeImage = createThemeImageApi(inspectionProvider);
  const handleThemeInspection = createThemeInspectionApi(inspectionProvider);
  const handleThemeScheme = createThemeSchemeApi(inspectionProvider);
  const handleThemeWallpaper = createThemeWallpaperApi(inspectionProvider);
  const handleStaticApp = createStaticAppHandler(
    options.staticRoot ?? path.resolve(process.cwd(), "dist-app"),
  );

  return createServer(async (request, response) => {
    try {
      if (await handleMuxlaunchRenderModel(request, response)) {
        return;
      }

      if (await handleMuxlaunchVisualLayers(request, response)) {
        return;
      }

      if (await handleThemeGlyph(request, response)) {
        return;
      }

      if (await handleThemeImage(request, response)) {
        return;
      }

      if (await handleThemeInspection(request, response)) {
        return;
      }

      if (await handleThemeScheme(request, response)) {
        return;
      }

      if (await handleThemeWallpaper(request, response)) {
        return;
      }

      if (isApiRequest(request.url)) {
        const pathname = new URL(
          request.url ?? "/",
          "http://localhost",
        ).pathname;
        response.writeHead(404, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        response.end(
          JSON.stringify({ error: `API endpoint not found: ${pathname}` }),
        );
        return;
      }

      await handleStaticApp(request, response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error.";

      response.writeHead(500, {
        "Content-Type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify({ error: message }));
    }
  });
}

if (require.main === module) {
  const port = readPort(process.env.MUXPREVIEW_PORT);
  const themePath = process.argv[2] ?? process.env.MUXPREVIEW_THEME_PATH;
  const server = createMuxpreviewServer({ themePath });

  server.listen(port, "127.0.0.1", () => {
    console.log(`muxpreview is available at http://127.0.0.1:${port}`);

    if (themePath) {
      console.log(`Inspecting theme: ${path.resolve(themePath)}`);
    } else {
      console.warn(
        "No theme configured. Pass a theme path or set MUXPREVIEW_THEME_PATH.",
      );
    }
  });
}

function readPort(value: string | undefined): number {
  const port = Number(value ?? "4174");

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("MUXPREVIEW_PORT must be an integer between 1 and 65535.");
  }

  return port;
}

function isApiRequest(requestUrl: string | undefined): boolean {
  return new URL(requestUrl ?? "/", "http://localhost").pathname.startsWith(
    "/api/",
  );
}
