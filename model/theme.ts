export type ThemeAssetKind = "font" | "glyph" | "image" | "unknown";

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
  warnings: ThemeInspectionWarning[];
  scannedFileCount: number;
}
