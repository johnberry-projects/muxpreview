import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

import type { ThemeInspectionProvider } from "./theme-inspection-provider";

export const THEME_IMAGE_ENDPOINT = "/api/theme-image";

const CONTENT_TYPES: Record<string, string> = {
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

export function createThemeImageApi(
  inspectionProvider: ThemeInspectionProvider,
) {
  return async function handleThemeImageRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<boolean> {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (requestUrl.pathname !== THEME_IMAGE_ENDPOINT) {
      return false;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return true;
    }

    const relativePath = requestUrl.searchParams.get("path");

    if (!relativePath) {
      sendError(response, 400, "An image path query parameter is required.");
      return true;
    }

    if (!inspectionProvider.themePath) {
      sendError(response, 503, "No theme path is configured.");
      return true;
    }

    const inspection = await inspectionProvider.getInspection();
    const image = inspection.assets.images.find(
      (candidate) => candidate.relativePath === relativePath,
    );

    if (!image) {
      sendError(response, 404, `Unknown image asset: ${relativePath}`);
      return true;
    }

    const imagePath = resolveThemeFile(inspection.themePath, image.relativePath);
    const body = await readFile(imagePath);

    response.writeHead(200, {
      "Content-Type": CONTENT_TYPES[image.extension] ?? "application/octet-stream",
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
    throw new Error("Image path escaped the configured theme root.");
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
