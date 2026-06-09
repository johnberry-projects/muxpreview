import type { ThemeInspectionResult } from "../model";

export function formatInspectionSummary(
  inspection: ThemeInspectionResult
): string {
  const resolutions =
    inspection.resolutions.length > 0
      ? inspection.resolutions.map((resolution) => resolution.name).join(", ")
      : "none";

  const lines = [
    `Theme: ${inspection.themeName}`,
    `Path: ${inspection.themePath}`,
    `Files scanned: ${inspection.scannedFileCount}`,
    `Resolutions: ${resolutions}`,
    "",
    "Assets",
    `  Scheme files: ${inspection.schemeFiles.length}`,
    `  Images: ${inspection.assets.images.length}`,
    `  Glyphs: ${inspection.assets.glyphs.length}`,
    `  Fonts: ${inspection.assets.fonts.length}`,
    `  Unknown: ${inspection.assets.unknown.length}`
  ];

  if (inspection.warnings.length > 0) {
    lines.push("", "Warnings");
    lines.push(
      ...inspection.warnings.map((warning) => `  - ${warning.message}`)
    );
  }

  return lines.join("\n");
}
