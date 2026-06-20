import type {
  ThemeCompositionElement,
  ThemeCompositionReport,
  ThemeCompositionRisk,
  ThemeResolution
} from "../../core/model";

interface ThemeCompositionPanelProps {
  error?: string;
  loading: boolean;
  report?: ThemeCompositionReport;
  resolution?: ThemeResolution;
}

export function ThemeCompositionPanel({
  error,
  loading,
  report,
  resolution
}: ThemeCompositionPanelProps) {
  const resolutionReport = resolution
    ? report?.resolutions.find(
        (candidate) => candidate.resolution === resolution.name
      )
    : undefined;

  return (
    <section className="inspection-section theme-composition-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Composition analysis</p>
          <h2>Theme Composition</h2>
        </div>
        {report && (
          <p className="composition-summary">
            {report.summary.bakedUiElementCount} baked /
            {" "}
            {report.summary.glyphUsageCount} glyph /
            {" "}
            {report.summary.duplicationRiskCount} risks
            {" / "}
            {report.summary.compatibilityWarningCount} compatibility
          </p>
        )}
      </div>

      {loading && <p className="scheme-message">Analyzing theme composition...</p>}
      {error && <p className="scheme-message scheme-error">{error}</p>}

      {!loading && !error && !resolutionReport && (
        <p className="empty-state">
          No composition report is available for this resolution.
        </p>
      )}

      {report && resolutionReport && (
        <>
          <CompositionGroup
            title="Detected Baked UI Elements"
            emptyMessage="No baked UI candidates detected for this resolution."
            elements={resolutionReport.bakedUiElements}
          />
          <CompositionGroup
            title="Detected Glyph Usage"
            emptyMessage="No runtime glyph usage detected for this resolution."
            elements={resolutionReport.glyphUsage}
          />
          <CompositionGroup
            title="Detected Overlays"
            emptyMessage="No overlay candidates detected for this resolution."
            elements={resolutionReport.overlays}
          />
          <CompositionGroup
            title="Scheme-Driven Elements"
            emptyMessage="No scheme files detected for this resolution."
            elements={resolutionReport.schemeDrivenElements}
          />
          <RiskGroup
            emptyMessage="No compatibility warnings detected for this resolution."
            risks={resolutionReport.compatibilityWarnings}
            title="Compatibility Warnings"
          />
          <RiskGroup
            emptyMessage="No duplication risks detected for this resolution."
            risks={resolutionReport.duplicationRisks}
            title="Potential Duplication Risks"
          />

          {report.uncertainties.length > 0 && (
            <details className="composition-uncertainties">
              <summary>Analysis limits</summary>
              <ul>
                {report.uncertainties.map((uncertainty) => (
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

function CompositionGroup({
  elements,
  emptyMessage,
  title
}: {
  elements: ThemeCompositionElement[];
  emptyMessage: string;
  title: string;
}) {
  return (
    <div className="composition-group">
      <h3>{title}</h3>
      {elements.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <div className="composition-card-grid">
          {elements.map((element) => (
            <article className="composition-card" key={element.id}>
              <div>
                <h4>{element.label}</h4>
                <span className={`composition-confidence is-${element.confidence}`}>
                  {element.confidence}
                </span>
              </div>
              <dl>
                <div>
                  <dt>Source</dt>
                  <dd>{element.sourceFile ?? "runtime"}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{element.assetType}</dd>
                </div>
              </dl>
              <ul>
                {element.evidence.map((evidence) => (
                  <li key={evidence}>{evidence}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function RiskGroup({
  emptyMessage,
  risks,
  title
}: {
  emptyMessage: string;
  risks: ThemeCompositionRisk[];
  title: string;
}) {
  return (
    <div className="composition-group">
      <h3>{title}</h3>
      {risks.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <div className="composition-card-grid">
          {risks.map((risk) => (
            <article className="composition-card is-risk" key={risk.id}>
              <div>
                <h4>{risk.message}</h4>
                <span className={`composition-confidence is-${risk.severity}`}>
                  {risk.severity}
                </span>
              </div>
              {risk.sourceFiles.length > 0 && (
                <p className="composition-source-list">
                  {risk.sourceFiles.join(", ")}
                </p>
              )}
              <ul>
                {risk.evidence.map((evidence) => (
                  <li key={evidence}>{evidence}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
