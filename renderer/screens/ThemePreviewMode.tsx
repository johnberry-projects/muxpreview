import type {
  MuxlaunchRenderModel,
  MuxlaunchVisualLayerModel,
  ThemeCompositionRisk,
  ThemeAsset,
  ThemeResolution,
} from "../../core/model";
import { MappedMuxlaunchPreview } from "../components/MappedMuxlaunchPreview";
import { ResolutionSelector } from "../components/ResolutionSelector";

interface ThemePreviewModeProps {
  compatibilityWarnings: ThemeCompositionRisk[];
  glyphs: ThemeAsset[];
  images: ThemeAsset[];
  loading: boolean;
  mappingError?: string;
  renderModel?: MuxlaunchRenderModel;
  resolution?: ThemeResolution;
  resolutions: ThemeResolution[];
  visualLayers?: MuxlaunchVisualLayerModel;
  onResolutionChange: (resolution: string) => void;
}

export function ThemePreviewMode({
  compatibilityWarnings,
  glyphs,
  images,
  loading,
  mappingError,
  renderModel,
  resolution,
  resolutions,
  visualLayers,
  onResolutionChange,
}: ThemePreviewModeProps) {
  const visibleWarnings = compatibilityWarnings.filter(
    (warning) => warning.severity !== "low",
  );

  if (!resolution) {
    return (
      <section className="preview-workspace">
        <p className="empty-state">
          No resolution folders are available for preview.
        </p>
      </section>
    );
  }

  return (
    <section className="preview-workspace" aria-label="Theme preview">
      <div className="preview-toolbar">
        <div>
          <p className="eyebrow">muxlaunch</p>
          <h2>Mapped theme preview</h2>
        </div>
        <ResolutionSelector
          resolutions={resolutions}
          selectedResolution={resolution.name}
          onChange={onResolutionChange}
        />
      </div>

      <div className="preview-stage">
        <MappedMuxlaunchPreview
          glyphs={glyphs}
          images={images}
          renderModel={renderModel}
          resolution={resolution}
          showCaption={false}
          visualLayers={visualLayers}
        />
        {loading && (
          <p className="preview-status">Loading muxlaunch layers...</p>
        )}
      </div>

      <p className="preview-interaction-hint">
        Use arrow keys or click items to preview selection state.
      </p>

      {visibleWarnings.length > 0 && (
        <section className="preview-compatibility-warning">
          <strong>Limited preview</strong>
          <ul>
            {visibleWarnings.map((warning) => (
              <li key={warning.id}>{warning.message}</li>
            ))}
          </ul>
        </section>
      )}

      {mappingError && visibleWarnings.length === 0 && (
        <p className="preview-notice">
          {mappingError} Previewing with available assets and fallback values.
        </p>
      )}
    </section>
  );
}
