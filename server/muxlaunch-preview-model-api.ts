import type { IncomingMessage, ServerResponse } from "node:http";

import type { ThemeInspectionProvider } from "./theme-inspection-provider";

export const MUXLAUNCH_PREVIEW_MODEL_ENDPOINT =
  "/api/muxlaunch-preview-model";

export function createMuxlaunchPreviewModelApi(
  inspectionProvider: ThemeInspectionProvider,
) {
  return async function handleMuxlaunchPreviewModelRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<boolean> {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (requestUrl.pathname !== MUXLAUNCH_PREVIEW_MODEL_ENDPOINT) {
      return false;
    }

    if (request.method !== "GET") {
      response.writeHead(405, { Allow: "GET" });
      response.end();
      return true;
    }

    const resolution = requestUrl.searchParams.get("resolution");

    if (!resolution) {
      sendJson(response, 400, {
        error: "A resolution query parameter is required.",
      });
      return true;
    }

    if (!inspectionProvider.themePath) {
      sendJson(response, 503, { error: "No theme path is configured." });
      return true;
    }

    const model = await inspectionProvider.getMuxlaunchPreviewModel(resolution);

    if (!model) {
      sendJson(response, 404, {
        error: `Unknown resolution: ${resolution}`,
      });
      return true;
    }

    sendJson(response, 200, model);
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
