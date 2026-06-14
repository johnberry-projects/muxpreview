import type { IncomingMessage, ServerResponse } from "node:http";

import type { ThemeInspectionProvider } from "./theme-inspection-provider";

export const MUXLAUNCH_RENDER_MODEL_ENDPOINT =
  "/api/muxlaunch-render-model";

export function createMuxlaunchRenderModelApi(
  inspectionProvider: ThemeInspectionProvider,
) {
  return async function handleMuxlaunchRenderModelRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<boolean> {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (requestUrl.pathname !== MUXLAUNCH_RENDER_MODEL_ENDPOINT) {
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

    const inspection = await inspectionProvider.getInspection();
    const schemeFile = inspection.schemeFiles.find(
      (candidate) =>
        candidate.resolution === resolution &&
        candidate.screenId?.toLowerCase() === "muxlaunch",
    );

    if (!schemeFile) {
      sendJson(response, 404, {
        error: `No muxlaunch scheme was detected for resolution ${resolution}.`,
      });
      return true;
    }

    const model = await inspectionProvider.getMuxlaunchRenderModel(schemeFile);
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
