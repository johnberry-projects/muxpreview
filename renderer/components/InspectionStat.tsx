interface InspectionStatProps {
  label: string;
  value: number;
}

export function InspectionStat({ label, value }: InspectionStatProps) {
  return (
    <article className="inspection-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}
