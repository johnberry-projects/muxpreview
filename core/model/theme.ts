export type ThemeAssetKind = "font" | "glyph" | "image" | "unknown";

export type ThemeFamily =
  | "baked-ui"
  | "composited-grid"
  | "static-composition"
  | "scheme-only-partial"
  | "empty-unsupported";

export interface ThemeFamilyDetection {
  family: ThemeFamily;
  confidence: number;
  evidence: string[];
}

export interface ThemeAsset {
  relativePath: string;
  fileName: string;
  extension: string;
  size: number;
  resolution?: string;
}

export interface ThemeAssetGroup {
  fonts: ThemeAsset[];
  glyphs: ThemeAsset[];
  images: ThemeAsset[];
  unknown: ThemeAsset[];
}

export interface ThemeSchemeFile {
  relativePath: string;
  fileName: string;
  size: number;
  resolution?: string;
  screenId?: string;
}

export interface ThemeResolution {
  name: string;
  width: number;
  height: number;
  relativePath: string;
  schemeFiles: ThemeSchemeFile[];
  assets: ThemeAssetGroup;
  wallpapers: ThemeAsset[];
  wallpaper?: ThemeAsset;
}

export type ThemeInspectionWarningCode =
  | "missing-resolutions"
  | "missing-schemes"
  | "missing-fonts"
  | "missing-glyphs"
  | "missing-images";

export interface ThemeInspectionWarning {
  code: ThemeInspectionWarningCode;
  message: string;
}

export interface ThemeInspectionResult {
  themePath: string;
  themeName: string;
  resolutions: ThemeResolution[];
  schemeFiles: ThemeSchemeFile[];
  assets: ThemeAssetGroup;
  themeFamily: ThemeFamilyDetection;
  assetManifest: ThemeAssetManifest;
  warnings: ThemeInspectionWarning[];
  scannedFileCount: number;
}

export type ThemeAssetManifestRole =
  | "primary-wallpaper"
  | "muxlaunch-artwork"
  | "menu-glyph-candidates"
  | "header-status-glyph-candidates"
  | "fonts"
  | "scheme-files";

export type ThemeAssetManifestFileKind = "font" | "glyph" | "image" | "scheme";

export interface ThemeAssetManifestFile {
  kind: ThemeAssetManifestFileKind;
  relativePath: string;
  fileName: string;
  size: number;
  resolution?: string;
}

export interface ThemeAssetManifestEntry {
  role: ThemeAssetManifestRole;
  selectedFile?: ThemeAssetManifestFile;
  confidence: number;
  alternatives: ThemeAssetManifestFile[];
  reason: string;
}

export interface ThemeResolutionAssetManifest {
  resolution: string;
  entries: ThemeAssetManifestEntry[];
}

export interface ThemeAssetManifest {
  themeName: string;
  themePath: string;
  family: ThemeFamilyDetection;
  generatedFrom: "theme-inspection";
  resolutions: ThemeResolutionAssetManifest[];
  uncertainties: string[];
}
