import type { ThemeInspectionWarning } from "../../core/model";

interface WarningListProps {
  warnings: ThemeInspectionWarning[];
}

export function WarningList({ warnings }: WarningListProps) {
  return (
    <section className="inspection-section">
      <h2>Warnings</h2>
      {warnings.length === 0 ? (
        <p className="empty-state">No inspection warnings.</p>
      ) : (
        <ul className="warning-list">
          {warnings.map((warning) => (
            <li key={warning.code}>{warning.message}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
