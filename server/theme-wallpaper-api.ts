import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

import type { ThemeInspectionProvider } from "./theme-inspection-provider";

export const THEME_WALLPAPER_ENDPOINT = "/api/theme-wallpaper";

const CONTENT_TYPES: Record<string, string> = {
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

export function createThemeWallpaperApi(
  inspectionProvider: ThemeInspectionProvider,
) {
  return async function handleThemeWallpaperRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<boolean> {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (requestUrl.pathname !== THEME_WALLPAPER_ENDPOINT) {
      return false;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return true;
    }

    const resolutionName = requestUrl.searchParams.get("resolution");

    if (!resolutionName) {
      sendError(response, 400, "A resolution query parameter is required.");
      return true;
    }

    if (!inspectionProvider.themePath) {
      sendError(response, 503, "No theme path is configured.");
      return true;
    }

    const inspection = await inspectionProvider.getInspection();
    const resolution = inspection.resolutions.find(
      (candidate) => candidate.name === resolutionName,
    );

    if (!resolution) {
      sendError(response, 404, `Unknown resolution: ${resolutionName}`);
      return true;
    }

    if (!resolution.wallpaper) {
      sendError(
        response,
        404,
        `No wallpaper was detected for resolution ${resolutionName}.`,
      );
      return true;
    }

    const wallpaperPath = resolveThemeFile(
      inspection.themePath,
      resolution.wallpaper.relativePath,
    );
    const body = await readFile(wallpaperPath);

    response.writeHead(200, {
      "Content-Type":
        CONTENT_TYPES[resolution.wallpaper.extension] ??
        "application/octet-stream",
      "Content-Length": body.byteLength,
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : body);
    return true;
  };
}

function resolveThemeFile(themePath: string, relativePath: string): string {
  const resolvedRoot = path.resolve(themePath);
  const resolvedFile = path.resolve(
    resolvedRoot,
    ...relativePath.split("/"),
  );
  const rootPrefix = `${resolvedRoot}${path.sep}`;

  if (!resolvedFile.startsWith(rootPrefix)) {
    throw new Error("Wallpaper path escaped the configured theme root.");
  }

  return resolvedFile;
}

function sendError(
  response: ServerResponse,
  statusCode: number,
  message: string,
): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify({ error: message }));
}
