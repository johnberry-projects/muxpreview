import type { ThemeResolution } from "../../core/model";

interface ResolutionSelectorProps {
  resolutions: ThemeResolution[];
  selectedResolution: string;
  onChange: (resolution: string) => void;
}

export function ResolutionSelector({
  resolutions,
  selectedResolution,
  onChange,
}: ResolutionSelectorProps) {
  return (
    <label className="resolution-selector">
      <span>Resolution</span>
      <select
        value={selectedResolution}
        onChange={(event) => onChange(event.target.value)}
      >
        {resolutions.map((resolution) => (
          <option key={resolution.name} value={resolution.name}>
            {resolution.name}
          </option>
        ))}
      </select>
    </label>
  );
}
