export type ThemeCompositionAssetType =
  | "glyph"
  | "image-overlay"
  | "runtime-overlay"
  | "scheme"
  | "static-composition"
  | "wallpaper";

export type ThemeCompositionConfidence = "high" | "medium" | "low";

export interface ThemeCompositionElement {
  id: string;
  label: string;
  assetType: ThemeCompositionAssetType;
  confidence: ThemeCompositionConfidence;
  evidence: string[];
  resolution?: string;
  sourceFile?: string;
}

export interface ThemeCompositionRisk {
  id: string;
  severity: "high" | "medium" | "low";
  message: string;
  evidence: string[];
  resolution?: string;
  sourceFiles: string[];
}

export interface ThemeCompositionResolutionReport {
  resolution: string;
  bakedUiElements: ThemeCompositionElement[];
  glyphUsage: ThemeCompositionElement[];
  overlays: ThemeCompositionElement[];
  schemeDrivenElements: ThemeCompositionElement[];
  duplicationRisks: ThemeCompositionRisk[];
  compatibilityWarnings: ThemeCompositionRisk[];
}

export interface ThemeCompositionReport {
  themeName: string;
  themePath: string;
  generatedFrom: "theme-inspection";
  summary: {
    bakedUiElementCount: number;
    glyphUsageCount: number;
    overlayCount: number;
    duplicationRiskCount: number;
    compatibilityWarningCount: number;
  };
  resolutions: ThemeCompositionResolutionReport[];
  uncertainties: string[];
}
