import { useEffect, useState } from "react";

import type {
  MuxlaunchRenderModel,
  ThemeInspectionResult,
} from "../../core/model";
import { GlyphExplorer } from "../components/GlyphExplorer";
import { InspectionStat } from "../components/InspectionStat";
import { MuxlaunchMappingPanel } from "../components/MuxlaunchMappingPanel";
import { ResolutionSelector } from "../components/ResolutionSelector";
import { SchemeExplorer } from "../components/SchemeExplorer";
import { StaticMuxlaunchPreview } from "../components/StaticMuxlaunchPreview";
import { WallpaperPreview } from "../components/WallpaperPreview";
import { WarningList } from "../components/WarningList";

interface ThemeInspectionScreenProps {
  inspection: ThemeInspectionResult;
}

export function ThemeInspectionScreen({
  inspection,
}: ThemeInspectionScreenProps) {
  const [previewMode, setPreviewMode] = useState<"wallpaper" | "muxlaunch">(
    "wallpaper",
  );
  const [selectedResolutionName, setSelectedResolutionName] = useState(
    inspection.resolutions[0]?.name ?? "",
  );
  const [muxlaunchModel, setMuxlaunchModel] =
    useState<MuxlaunchRenderModel>();
  const [muxlaunchError, setMuxlaunchError] = useState<string>();
  const [muxlaunchLoading, setMuxlaunchLoading] = useState(false);
  const selectedResolution =
    inspection.resolutions.find(
      (resolution) => resolution.name === selectedResolutionName,
    ) ?? inspection.resolutions[0];

  useEffect(() => {
    if (!selectedResolution) {
      return;
    }

    const controller = new AbortController();
    setMuxlaunchModel(undefined);
    setMuxlaunchError(undefined);
    setMuxlaunchLoading(true);

    async function loadMuxlaunchModel() {
      try {
        const response = await fetch(
          `/api/muxlaunch-render-model?resolution=${encodeURIComponent(
            selectedResolution.name,
          )}`,
          { signal: controller.signal },
        );
        const contentType = response.headers.get("content-type") ?? "";

        if (!contentType.toLowerCase().includes("json")) {
          throw new Error(
            response.ok
              ? "The muxlaunch mapping endpoint returned an unexpected response."
              : `The muxlaunch mapping request failed with status ${response.status}.`,
          );
        }

        const body: unknown = await response.json();

        if (!response.ok) {
          throw new Error(readApiError(body));
        }

        if (!isMuxlaunchRenderModel(body)) {
          throw new Error(
            "The muxlaunch mapping endpoint returned invalid JSON data.",
          );
        }

        setMuxlaunchModel(body);
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
    <main className="inspection-shell">
      <header className="inspection-header">
        <p className="eyebrow">muxpreview inspection</p>
        <h1>{inspection.themeName}</h1>
        <p className="theme-path">{inspection.themePath}</p>
      </header>

      <section className="inspection-stats" aria-label="Asset counts">
        <InspectionStat label="Images" value={inspection.assets.images.length} />
        <InspectionStat label="Glyphs" value={inspection.assets.glyphs.length} />
        <InspectionStat label="Fonts" value={inspection.assets.fonts.length} />
      </section>

      {selectedResolution && (
        <section className="inspection-controls" aria-label="Preview context">
          <ResolutionSelector
            resolutions={inspection.resolutions}
            selectedResolution={selectedResolution.name}
            onChange={setSelectedResolutionName}
          />
        </section>
      )}

      <section className="inspection-section wallpaper-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Virtual display</p>
            <h2>
              {previewMode === "wallpaper"
                ? "Wallpaper preview"
                : "Static muxlaunch preview"}
            </h2>
          </div>
          <label className="preview-mode-selector">
            <span>Preview mode</span>
            <select
              value={previewMode}
              onChange={(event) =>
                setPreviewMode(
                  event.target.value as "wallpaper" | "muxlaunch",
                )
              }
            >
              <option value="wallpaper">Wallpaper</option>
              <option value="muxlaunch">Static muxlaunch</option>
            </select>
          </label>
        </div>

        {selectedResolution ? (
          previewMode === "wallpaper" ? (
            <WallpaperPreview resolution={selectedResolution} />
          ) : (
            <StaticMuxlaunchPreview
              resolution={selectedResolution}
              glyphs={inspection.assets.glyphs}
              renderModel={muxlaunchModel}
            />
          )
        ) : (
          <p className="empty-state">
            No resolution folders are available for preview.
          </p>
        )}
      </section>

      {selectedResolution && (
        <MuxlaunchMappingPanel
          model={muxlaunchModel}
          loading={muxlaunchLoading}
          error={muxlaunchError}
        />
      )}

      {selectedResolution && (
        <SchemeExplorer
          resolution={selectedResolution}
          schemeFiles={inspection.schemeFiles}
        />
      )}

      {selectedResolution && (
        <GlyphExplorer
          resolution={selectedResolution}
          glyphs={inspection.assets.glyphs}
        />
      )}

      <section className="inspection-section">
        <h2>Resolutions</h2>
        {inspection.resolutions.length === 0 ? (
          <p className="empty-state">No resolution folders detected.</p>
        ) : (
          <ul className="tag-list">
            {inspection.resolutions.map((resolution) => (
              <li key={resolution.relativePath}>{resolution.name}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="inspection-section">
        <h2>Schemes ({inspection.schemeFiles.length})</h2>
        {inspection.schemeFiles.length === 0 ? (
          <p className="empty-state">No scheme files detected.</p>
        ) : (
          <ul className="file-list">
            {inspection.schemeFiles.map((scheme) => (
              <li key={scheme.relativePath}>{scheme.relativePath}</li>
            ))}
          </ul>
        )}
      </section>

      <WarningList warnings={inspection.warnings} />
    </main>
  );
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
