import type {
  ThemeAssetGroup,
  ThemeInspectionWarning,
  ThemeResolution,
  ThemeSchemeFile
} from "../model";

export function createInspectionWarnings(
  resolutions: ThemeResolution[],
  schemeFiles: ThemeSchemeFile[],
  assets: ThemeAssetGroup
): ThemeInspectionWarning[] {
  const warnings: ThemeInspectionWarning[] = [];

  if (resolutions.length === 0) {
    warnings.push({
      code: "missing-resolutions",
      message: "No resolution folders matching <width>x<height> were found."
    });
  }

  if (schemeFiles.length === 0) {
    warnings.push({
      code: "missing-schemes",
      message: "No INI files were found inside a scheme folder."
    });
  }

  if (assets.fonts.length === 0) {
    warnings.push({
      code: "missing-fonts",
      message: "No files were found inside a font folder."
    });
  }

  if (assets.glyphs.length === 0) {
    warnings.push({
      code: "missing-glyphs",
      message: "No raster images were found inside a glyph folder."
    });
  }

  if (assets.images.length === 0) {
    warnings.push({
      code: "missing-images",
      message:
        "No raster images were found inside image, overlay, or catalogue folders."
    });
  }

  return warnings;
}
