import type {
  ThemeResolution,
} from "../../core/model";
import type { MuxlaunchPreviewModel } from "../../core/preview";
import { MappedMuxlaunchPreview } from "../components/MappedMuxlaunchPreview";
import { ResolutionSelector } from "../components/ResolutionSelector";

interface ThemePreviewModeProps {
  loading: boolean;
  mappingError?: string;
  previewModel?: MuxlaunchPreviewModel;
  resolution?: ThemeResolution;
  resolutions: ThemeResolution[];
  onResolutionChange: (resolution: string) => void;
}

export function ThemePreviewMode({
  loading,
  mappingError,
  previewModel,
  resolution,
  resolutions,
  onResolutionChange,
}: ThemePreviewModeProps) {
  const visibleWarnings = (previewModel?.diagnostics ?? []).filter(
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
          model={previewModel}
          showCaption={false}
        />
        {loading && (
          <p className="preview-status">Loading preview model...</p>
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
