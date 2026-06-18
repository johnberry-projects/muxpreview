import type { IncomingMessage, ServerResponse } from "node:http";

import type { ThemeInspectionProvider } from "./theme-inspection-provider";

export const THEME_COMPOSITION_ENDPOINT = "/api/theme-composition";

export function createThemeCompositionApi(
  inspectionProvider: ThemeInspectionProvider,
) {
  return async function handleThemeCompositionRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<boolean> {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (requestUrl.pathname !== THEME_COMPOSITION_ENDPOINT) {
      return false;
    }

    if (request.method !== "GET") {
      response.setHeader("Allow", "GET");
      sendJson(response, 405, { error: "Method not allowed." });
      return true;
    }

    if (!inspectionProvider.themePath) {
      sendJson(response, 503, {
        error:
          "No theme path is configured. Pass one when starting the server or set MUXPREVIEW_THEME_PATH.",
      });
      return true;
    }

    sendJson(response, 200, await inspectionProvider.getThemeCompositionReport());
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
