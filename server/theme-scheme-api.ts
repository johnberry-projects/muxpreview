import type { IncomingMessage, ServerResponse } from "node:http";

import type { ThemeInspectionProvider } from "./theme-inspection-provider";

export const THEME_SCHEME_ENDPOINT = "/api/theme-scheme";

export function createThemeSchemeApi(
  inspectionProvider: ThemeInspectionProvider,
) {
  return async function handleThemeSchemeRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<boolean> {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (requestUrl.pathname !== THEME_SCHEME_ENDPOINT) {
      return false;
    }

    if (request.method !== "GET") {
      response.writeHead(405, { Allow: "GET" });
      response.end();
      return true;
    }

    const relativePath = requestUrl.searchParams.get("path");

    if (!relativePath) {
      sendJson(response, 400, {
        error: "A scheme path query parameter is required.",
      });
      return true;
    }

    if (!inspectionProvider.themePath) {
      sendJson(response, 503, { error: "No theme path is configured." });
      return true;
    }

    const inspection = await inspectionProvider.getInspection();
    const schemeFile = inspection.schemeFiles.find(
      (candidate) => candidate.relativePath === relativePath,
    );

    if (!schemeFile) {
      sendJson(response, 404, {
        error: `Unknown scheme file: ${relativePath}`,
      });
      return true;
    }

    const scheme = await inspectionProvider.getScheme(schemeFile);
    sendJson(response, 200, scheme);
    return true;
  };
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}
