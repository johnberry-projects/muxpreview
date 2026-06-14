import type { MuxlaunchVisualLayerModel } from "../../core/model";

interface VisualLayersPanelProps {
  error?: string;
  loading: boolean;
  model?: MuxlaunchVisualLayerModel;
}

export function VisualLayersPanel({
  error,
  loading,
  model,
}: VisualLayersPanelProps) {
  return (
    <section className="inspection-section visual-layers-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Renderer composition</p>
          <h2>Visual layers</h2>
        </div>
        {model && <span className="mapping-source">{model.resolution}</span>}
      </div>

      {loading && <p className="scheme-message">Resolving visual layers...</p>}
      {error && <p className="scheme-message scheme-error">{error}</p>}

      {model && (
        <div className="visual-layer-list">
          {model.layers.map((layer) => (
            <article className="visual-layer-card" key={layer.id}>
              <div>
                <h3>{layer.label}</h3>
                <span className={`visual-layer-state is-${layer.state}`}>
                  {layer.state}
                </span>
              </div>
              <p>{layer.note}</p>
              {layer.assetPaths.length === 0 ? (
                <small>No source asset</small>
              ) : (
                <ul>
                  {layer.assetPaths.map((assetPath) => (
                    <li key={assetPath}>{assetPath}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
