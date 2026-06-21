import type { ThemeFamilyDetection } from "../../core/model";

interface ThemeFamilySummaryProps {
  detection: ThemeFamilyDetection;
}

export function ThemeFamilySummary({
  detection
}: ThemeFamilySummaryProps) {
  return (
    <section className="inspection-section theme-family-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Structural classification</p>
          <h2>Theme family</h2>
        </div>
        <span className="family-confidence">
          {Math.round(detection.confidence * 100)}% confidence
        </span>
      </div>
      <p className="family-name">{detection.family}</p>
      <ul className="file-list">
        {detection.evidence.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
