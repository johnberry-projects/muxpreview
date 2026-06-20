import type {
  MuxlaunchRenderModel,
  MuxlaunchVisualLayerModel,
  ThemeAsset,
  ThemeResolution,
} from "../../core/model";
import { MappedMuxlaunchPreview } from "../components/MappedMuxlaunchPreview";
import { ResolutionSelector } from "../components/ResolutionSelector";

interface ThemePreviewModeProps {
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

      {mappingError && (
        <p className="preview-notice">
          {mappingError} Previewing with available assets and fallback values.
        </p>
      )}
    </section>
  );
}
