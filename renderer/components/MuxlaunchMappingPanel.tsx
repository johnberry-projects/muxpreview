import type { MuxlaunchRenderModel } from "../../core/model";

interface MuxlaunchMappingPanelProps {
  error?: string;
  loading: boolean;
  model?: MuxlaunchRenderModel;
}

export function MuxlaunchMappingPanel({
  error,
  loading,
  model,
}: MuxlaunchMappingPanelProps) {
  return (
    <section className="inspection-section muxlaunch-mapping">
      <div className="section-heading">
        <div>
          <p className="eyebrow">muxlaunch mapping</p>
          <h2>Render model debug</h2>
        </div>
        {model && (
          <span className="mapping-source">{model.sourceSchemePath}</span>
        )}
      </div>

      {loading && <p className="scheme-message">Mapping muxlaunch scheme...</p>}
      {error && (
        <p className="scheme-message scheme-error">
          {error} The static preview is using fallback values.
        </p>
      )}

      {model && (
        <>
          <div className="mapping-summary">
            <span>{model.availableSections.length} sections</span>
            <span>{model.mappedValues.length} mapped values</span>
            <span>{model.unmappedValues.length} unmapped values</span>
            <span>{model.missingExpectedValues.length} expected values missing</span>
          </div>

          <div className="mapping-groups">
            <MappingValues
              title="Layout"
              values={model.mappedValues.filter(
                (value) => value.kind === "number",
              )}
            />
            <MappingValues
              title="Colours"
              values={model.mappedValues.filter(
                (value) => value.kind === "color",
              )}
            />
            <MappingValues title="Font-related values" values={model.fontValues} />
          </div>

          <details className="mapping-details">
            <summary>
              Available sections ({model.availableSections.length})
            </summary>
            <ul>
              {model.availableSections.map((section, index) => (
                <li key={`${section}-${index}`}>[{section}]</li>
              ))}
            </ul>
          </details>

          <details className="mapping-details">
            <summary>
              Missing expected values ({model.missingExpectedValues.length})
            </summary>
            {model.missingExpectedValues.length === 0 ? (
              <p>All currently expected mapping values are present.</p>
            ) : (
              <ul>
                {model.missingExpectedValues.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            )}
          </details>

          <details className="mapping-details">
            <summary>Unmapped values ({model.unmappedValues.length})</summary>
            {model.unmappedValues.length === 0 ? (
              <p>No unmapped assignments.</p>
            ) : (
              <div className="mapping-table">
                {model.unmappedValues.map((value) => (
                  <div key={`${value.section}.${value.key}-${value.line}`}>
                    <code>
                      {value.section}.{value.key}
                    </code>
                    <span>{value.rawValue.trim()}</span>
                    <small>{value.reason}</small>
                  </div>
                ))}
              </div>
            )}
          </details>

          <details className="mapping-details">
            <summary>
              Known glyph references ({model.glyphReferences.length})
            </summary>
            <ul>
              {model.glyphReferences.map((reference) => (
                <li key={reference}>{reference}</li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}

interface MappingValuesProps {
  title: string;
  values: MuxlaunchRenderModel["mappedValues"];
}

function MappingValues({ title, values }: MappingValuesProps) {
  return (
    <article className="mapping-group">
      <h3>{title}</h3>
      {values.length === 0 ? (
        <p>No values mapped from this source file.</p>
      ) : (
        <dl>
          {values.map((value) => (
            <div key={`${value.section}.${value.key}-${value.line}`}>
              <dt>{value.name}</dt>
              <dd>{value.value}</dd>
              <small>
                {value.section}.{value.key}
              </small>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
