import { useEffect, useState } from "react";

import type {
  MuxlaunchRenderModel,
  MuxlaunchVisualLayerModel,
  ThemeCompositionReport,
  ThemeInspectionResult,
} from "../../core/model";
import { ThemeInspectMode } from "./ThemeInspectMode";
import { ThemePreviewMode } from "./ThemePreviewMode";

interface ThemeInspectionScreenProps {
  inspection: ThemeInspectionResult;
}

export function ThemeInspectionScreen({
  inspection,
}: ThemeInspectionScreenProps) {
  const [workspaceMode, setWorkspaceMode] = useState<"preview" | "inspect">(
    "preview",
  );
  const [selectedResolutionName, setSelectedResolutionName] = useState(
    inspection.resolutions[0]?.name ?? "",
  );
  const [muxlaunchModel, setMuxlaunchModel] =
    useState<MuxlaunchRenderModel>();
  const [muxlaunchError, setMuxlaunchError] = useState<string>();
  const [visualLayers, setVisualLayers] =
    useState<MuxlaunchVisualLayerModel>();
  const [visualLayerError, setVisualLayerError] = useState<string>();
  const [compositionReport, setCompositionReport] =
    useState<ThemeCompositionReport>();
  const [compositionError, setCompositionError] = useState<string>();
  const [muxlaunchLoading, setMuxlaunchLoading] = useState(false);
  const selectedResolution =
    inspection.resolutions.find(
      (resolution) => resolution.name === selectedResolutionName,
    ) ?? inspection.resolutions[0];
  const compatibilityWarnings = selectedResolution
    ? compositionReport?.resolutions.find(
        (report) => report.resolution === selectedResolution.name,
      )?.compatibilityWarnings ?? []
    : [];

  useEffect(() => {
    const resolutionStillExists = inspection.resolutions.some(
      (resolution) => resolution.name === selectedResolutionName,
    );

    if (!resolutionStillExists) {
      setSelectedResolutionName(inspection.resolutions[0]?.name ?? "");
    }
  }, [inspection, selectedResolutionName]);

  useEffect(() => {
    if (!selectedResolution) {
      return;
    }

    const controller = new AbortController();
    setMuxlaunchModel(undefined);
    setMuxlaunchError(undefined);
    setVisualLayers(undefined);
    setVisualLayerError(undefined);
    setCompositionReport(undefined);
    setCompositionError(undefined);
    setMuxlaunchLoading(true);

    async function loadMuxlaunchModel() {
      try {
        const resolution = encodeURIComponent(selectedResolution.name);
        const [renderModelResult, visualLayersResult, compositionResult] =
          await Promise.allSettled([
            fetchJson(
              `/api/muxlaunch-render-model?resolution=${resolution}`,
              controller.signal,
            ),
            fetchJson(
              `/api/muxlaunch-visual-layers?resolution=${resolution}`,
              controller.signal,
            ),
            fetchJson("/api/theme-composition", controller.signal),
          ]);

        if (renderModelResult.status === "fulfilled") {
          if (!isMuxlaunchRenderModel(renderModelResult.value)) {
            throw new Error(
              "The muxlaunch mapping endpoint returned invalid JSON data.",
            );
          }

          setMuxlaunchModel(renderModelResult.value);
        } else {
          setMuxlaunchError(errorMessage(renderModelResult.reason));
        }

        if (visualLayersResult.status === "fulfilled") {
          if (!isMuxlaunchVisualLayerModel(visualLayersResult.value)) {
            throw new Error(
              "The visual layers endpoint returned invalid JSON data.",
            );
          }

          setVisualLayers(visualLayersResult.value);
        } else {
          setVisualLayerError(errorMessage(visualLayersResult.reason));
        }

        if (compositionResult.status === "fulfilled") {
          if (!isThemeCompositionReport(compositionResult.value)) {
            throw new Error(
              "The theme composition endpoint returned invalid JSON data.",
            );
          }

          setCompositionReport(compositionResult.value);
        } else {
          setCompositionError(errorMessage(compositionResult.reason));
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setMuxlaunchError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to map muxlaunch scheme.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setMuxlaunchLoading(false);
        }
      }
    }

    void loadMuxlaunchModel();
    return () => controller.abort();
  }, [selectedResolution]);

  return (
    <main className={`inspection-shell is-${workspaceMode}`}>
      <header className="workspace-header">
        <div>
          <p className="eyebrow">muxpreview</p>
          <h1>{inspection.themeName}</h1>
        </div>
        <nav className="workspace-mode-switch" aria-label="Workspace mode">
          <button
            type="button"
            className={workspaceMode === "preview" ? "is-active" : undefined}
            aria-pressed={workspaceMode === "preview"}
            onClick={() => setWorkspaceMode("preview")}
          >
            Preview
          </button>
          <button
            type="button"
            className={workspaceMode === "inspect" ? "is-active" : undefined}
            aria-pressed={workspaceMode === "inspect"}
            onClick={() => setWorkspaceMode("inspect")}
          >
            Inspect
          </button>
        </nav>
      </header>

      {workspaceMode === "preview" ? (
        <ThemePreviewMode
          compatibilityWarnings={compatibilityWarnings}
          glyphs={inspection.assets.glyphs}
          images={inspection.assets.images}
          loading={muxlaunchLoading}
          mappingError={muxlaunchError ?? visualLayerError}
          renderModel={muxlaunchModel}
          resolution={selectedResolution}
          resolutions={inspection.resolutions}
          visualLayers={visualLayers}
          onResolutionChange={setSelectedResolutionName}
        />
      ) : (
        <ThemeInspectMode
          compositionError={compositionError}
          compositionReport={compositionReport}
          inspection={inspection}
          layerError={visualLayerError}
          loading={muxlaunchLoading}
          mappingError={muxlaunchError}
          renderModel={muxlaunchModel}
          resolution={selectedResolution}
          visualLayers={visualLayers}
          onResolutionChange={setSelectedResolutionName}
        />
      )}
    </main>
  );
}

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  const contentType = response.headers.get("content-type") ?? "";
  const endpoint = new URL(url, window.location.origin).pathname;

  if (!contentType.toLowerCase().includes("json")) {
    throw new Error(
      response.ok
        ? `${endpoint} returned a non-JSON response.`
        : `${endpoint} failed with status ${response.status} and returned a non-JSON response.`,
    );
  }

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      `${endpoint} failed with status ${response.status}: ${readApiError(body)}`,
    );
  }

  return body;
}

function isMuxlaunchRenderModel(body: unknown): body is MuxlaunchRenderModel {
  return (
    typeof body === "object" &&
    body !== null &&
    "sourceSchemePath" in body &&
    "mappedValues" in body &&
    "unmappedValues" in body
  );
}

function isMuxlaunchVisualLayerModel(
  body: unknown,
): body is MuxlaunchVisualLayerModel {
  return (
    typeof body === "object" &&
    body !== null &&
    "resolution" in body &&
    "layers" in body &&
    Array.isArray(body.layers)
  );
}

function isThemeCompositionReport(
  body: unknown,
): body is ThemeCompositionReport {
  return (
    typeof body === "object" &&
    body !== null &&
    "generatedFrom" in body &&
    "resolutions" in body &&
    Array.isArray(body.resolutions)
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load preview data.";
}

function readApiError(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error;
  }

  return "Unable to map muxlaunch scheme.";
}
