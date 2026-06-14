import { useState } from "react";

import type { ThemeInspectionResult } from "../../core/model";
import { GlyphExplorer } from "../components/GlyphExplorer";
import { InspectionStat } from "../components/InspectionStat";
import { ResolutionSelector } from "../components/ResolutionSelector";
import { SchemeExplorer } from "../components/SchemeExplorer";
import { WallpaperPreview } from "../components/WallpaperPreview";
import { WarningList } from "../components/WarningList";

interface ThemeInspectionScreenProps {
  inspection: ThemeInspectionResult;
}

export function ThemeInspectionScreen({
  inspection,
}: ThemeInspectionScreenProps) {
  const [selectedResolutionName, setSelectedResolutionName] = useState(
    inspection.resolutions[0]?.name ?? "",
  );
  const selectedResolution =
    inspection.resolutions.find(
      (resolution) => resolution.name === selectedResolutionName,
    ) ?? inspection.resolutions[0];

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
            <p className="eyebrow">Wallpaper preview</p>
            <h2>Resolution background</h2>
          </div>
        </div>

        {selectedResolution ? (
          <WallpaperPreview resolution={selectedResolution} />
        ) : (
          <p className="empty-state">
            No resolution folders are available for preview.
          </p>
        )}
      </section>

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
