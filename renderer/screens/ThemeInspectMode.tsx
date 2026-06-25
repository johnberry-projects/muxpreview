import type {
  MuxlaunchRenderModel,
  MuxlaunchVisualLayerModel,
  ThemeCompositionReport,
  ThemeInspectionResult,
  ThemeResolution,
} from "../../core/model";
import { AssetManifestPanel } from "../components/AssetManifestPanel";
import { GlyphExplorer } from "../components/GlyphExplorer";
import { InspectionStat } from "../components/InspectionStat";
import { MappedMuxlaunchPreview } from "../components/MappedMuxlaunchPreview";
import { MuxlaunchMappingPanel } from "../components/MuxlaunchMappingPanel";
import { ResolutionSelector } from "../components/ResolutionSelector";
import { SchemeExplorer } from "../components/SchemeExplorer";
import { StaticMuxlaunchPreview } from "../components/StaticMuxlaunchPreview";
import { ThemeCompositionPanel } from "../components/ThemeCompositionPanel";
import { ThemeFamilySummary } from "../components/ThemeFamilySummary";
import { VisualLayersPanel } from "../components/VisualLayersPanel";
import { WarningList } from "../components/WarningList";

interface ThemeInspectModeProps {
  compositionError?: string;
  compositionReport?: ThemeCompositionReport;
  inspection: ThemeInspectionResult;
  layerError?: string;
  loading: boolean;
  mappingError?: string;
  renderModel?: MuxlaunchRenderModel;
  resolution?: ThemeResolution;
  visualLayers?: MuxlaunchVisualLayerModel;
  onResolutionChange: (resolution: string) => void;
}

export function ThemeInspectMode({
  compositionError,
  compositionReport,
  inspection,
  layerError,
  loading,
  mappingError,
  renderModel,
  resolution,
  visualLayers,
  onResolutionChange,
}: ThemeInspectModeProps) {
  return (
    <div className="inspect-workspace">
      <section className="inspect-overview">
        <div>
          <p className="eyebrow">Theme source</p>
          <p className="theme-path">{inspection.themePath}</p>
        </div>
        {resolution && (
          <ResolutionSelector
            resolutions={inspection.resolutions}
            selectedResolution={resolution.name}
            onChange={onResolutionChange}
          />
        )}
      </section>

      <section className="inspection-stats" aria-label="Asset counts">
        <InspectionStat label="Images" value={inspection.assets.images.length} />
        <InspectionStat label="Glyphs" value={inspection.assets.glyphs.length} />
        <InspectionStat label="Fonts" value={inspection.assets.fonts.length} />
      </section>

      <ThemeFamilySummary detection={inspection.themeFamily} />

      {resolution && (
        <section className="inspection-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Renderer validation</p>
              <h2>Static vs mapped</h2>
            </div>
          </div>
          <div className="muxlaunch-comparison">
            <div>
              <h3>Static Preview</h3>
              <StaticMuxlaunchPreview
                resolution={resolution}
                glyphs={inspection.assets.glyphs}
              />
            </div>
            <div>
              <h3>Mapped Preview</h3>
              <MappedMuxlaunchPreview
                resolution={resolution}
                glyphs={inspection.assets.glyphs}
                images={inspection.assets.images}
                renderModel={renderModel}
                showMetricsOverlay
                visualLayers={visualLayers}
              />
            </div>
          </div>
        </section>
      )}

      <VisualLayersPanel
        model={visualLayers}
        loading={loading}
        error={layerError}
      />

      <AssetManifestPanel inspection={inspection} resolution={resolution} />

      <ThemeCompositionPanel
        error={compositionError}
        loading={loading}
        report={compositionReport}
        resolution={resolution}
      />

      {resolution && (
        <MuxlaunchMappingPanel
          model={renderModel}
          loading={loading}
          error={mappingError}
        />
      )}

      {resolution && (
        <SchemeExplorer
          resolution={resolution}
          schemeFiles={inspection.schemeFiles}
        />
      )}

      {resolution && (
        <GlyphExplorer
          resolution={resolution}
          glyphs={inspection.assets.glyphs}
        />
      )}

      <section className="inspection-section">
        <h2>Resolutions</h2>
        {inspection.resolutions.length === 0 ? (
          <p className="empty-state">No resolution folders detected.</p>
        ) : (
          <ul className="tag-list">
            {inspection.resolutions.map((candidate) => (
              <li key={candidate.relativePath}>{candidate.name}</li>
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
    </div>
  );
}
