import type {
  ThemeAssetManifestEntry,
  ThemeInspectionResult,
  ThemeResolution
} from "../../core/model";

interface AssetManifestPanelProps {
  inspection: ThemeInspectionResult;
  resolution?: ThemeResolution;
}

export function AssetManifestPanel({
  inspection,
  resolution
}: AssetManifestPanelProps) {
  const resolutionManifest = resolution
    ? inspection.assetManifest.resolutions.find(
        (candidate) => candidate.resolution === resolution.name
      )
    : undefined;

  return (
    <section className="inspection-section asset-manifest-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Asset manifest</p>
          <h2>Resolved Inputs</h2>
        </div>
        <span className="mapping-source">
          {inspection.assetManifest.family.family}
        </span>
      </div>

      {!resolutionManifest ? (
        <p className="empty-state">
          No asset manifest is available for this resolution.
        </p>
      ) : (
        <>
          <div className="asset-manifest-list">
            {resolutionManifest.entries.map((entry) => (
              <ManifestEntryCard entry={entry} key={entry.role} />
            ))}
          </div>

          {inspection.assetManifest.uncertainties.length > 0 && (
            <details className="composition-uncertainties">
              <summary>Manifest limits</summary>
              <ul>
                {inspection.assetManifest.uncertainties.map((uncertainty) => (
                  <li key={uncertainty}>{uncertainty}</li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}

function ManifestEntryCard({ entry }: { entry: ThemeAssetManifestEntry }) {
  return (
    <article className="asset-manifest-card">
      <div>
        <h3>{roleLabel(entry.role)}</h3>
        <span className="asset-manifest-confidence">
          {Math.round(entry.confidence * 100)}%
        </span>
      </div>

      <dl>
        <div>
          <dt>Selected</dt>
          <dd>{entry.selectedFile?.relativePath ?? "none"}</dd>
        </div>
        <div>
          <dt>Reason</dt>
          <dd>{entry.reason}</dd>
        </div>
      </dl>

      {entry.alternatives.length > 0 && (
        <details className="asset-manifest-alternatives">
          <summary>{entry.alternatives.length} alternative(s)</summary>
          <ul>
            {entry.alternatives.map((alternative) => (
              <li key={alternative.relativePath}>{alternative.relativePath}</li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function roleLabel(role: ThemeAssetManifestEntry["role"]): string {
  switch (role) {
    case "primary-wallpaper":
      return "Primary wallpaper";
    case "muxlaunch-artwork":
      return "muxlaunch artwork";
    case "menu-glyph-candidates":
      return "Menu glyph candidates";
    case "header-status-glyph-candidates":
      return "Header/status glyph candidates";
    case "fonts":
      return "Fonts";
    case "scheme-files":
      return "Scheme files";
  }
}
