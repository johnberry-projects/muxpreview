import { readFile, stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export function createStaticAppHandler(staticRoot: string) {
  const resolvedRoot = path.resolve(staticRoot);

  return async function handleStaticAppRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }

    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const relativePath =
      requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname.slice(1);
    const requestedFile = path.resolve(resolvedRoot, relativePath);
    const rootPrefix = `${resolvedRoot}${path.sep}`;

    if (requestedFile !== resolvedRoot && !requestedFile.startsWith(rootPrefix)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const filePath = await selectFile(requestedFile, resolvedRoot);

    if (!filePath) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type":
        CONTENT_TYPES[path.extname(filePath).toLowerCase()] ??
        "application/octet-stream",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  };
}

async function selectFile(
  requestedFile: string,
  staticRoot: string,
): Promise<string | undefined> {
  if (await isFile(requestedFile)) {
    return requestedFile;
  }

  if (path.extname(requestedFile)) {
    return undefined;
  }

  const appEntry = path.join(staticRoot, "index.html");
  return (await isFile(appEntry)) ? appEntry : undefined;
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}
