import type { IncomingMessage, ServerResponse } from "node:http";

import { ThemeInspectionService } from "../core";
import { NodeThemeScanner } from "./node-theme-scanner";

export const THEME_INSPECTION_ENDPOINT = "/api/theme-inspection";

export interface ThemeInspectionApiOptions {
  themePath?: string;
}

export function createThemeInspectionApi(
  options: ThemeInspectionApiOptions = {},
) {
  const inspectionService = new ThemeInspectionService(new NodeThemeScanner());
  const themePath = options.themePath ?? process.env.MUXPREVIEW_THEME_PATH;

  return async function handleThemeInspectionRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<boolean> {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (requestUrl.pathname !== THEME_INSPECTION_ENDPOINT) {
      return false;
    }

    if (request.method !== "GET") {
      response.setHeader("Allow", "GET");
      sendJson(response, 405, { error: "Method not allowed." });
      return true;
    }

    if (!themePath) {
      sendJson(response, 503, {
        error:
          "No theme path is configured. Pass one when starting the server or set MUXPREVIEW_THEME_PATH.",
      });
      return true;
    }

    try {
      const inspection = await inspectionService.inspect(themePath);
      sendJson(response, 200, inspection);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Theme inspection failed.";

      sendJson(response, 500, { error: message });
    }

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
