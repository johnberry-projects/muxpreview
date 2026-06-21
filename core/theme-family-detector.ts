import type {
  ThemeAsset,
  ThemeAssetGroup,
  ThemeFamilyDetection,
  ThemeResolution,
  ThemeSchemeFile
} from "./model";

export interface ThemeFamilyDetectionInput {
  resolutions: ThemeResolution[];
  schemeFiles: ThemeSchemeFile[];
  assets: ThemeAssetGroup;
}

export function detectThemeFamily(
  input: ThemeFamilyDetectionInput
): ThemeFamilyDetection {
  const bakedStates = matchingAssets(
    input.assets.images,
    /(?:^|\/)image\/wall\/muxlaunch\/[^/]+$/i
  );
  const staticStates = matchingAssets(
    input.assets.images,
    /(?:^|\/)image\/static\/muxlaunch\/[^/]+$/i
  );
  const gridImages = matchingAssets(
    input.assets.images,
    /(?:^|\/)image\/grid\/muxlaunch\/[^/]+$/i
  );
  const menuGlyphs = matchingAssets(
    input.assets.glyphs,
    /(?:^|\/)glyph\/muxlaunch\/[^/]+$/i
  );

  if (bakedStates.length > 0) {
    return {
      family: "baked-ui",
      confidence: 0.98,
      evidence: [
        evidenceCount(
          bakedStates,
          "full-screen muxlaunch state under image/wall/muxlaunch"
        )
      ]
    };
  }

  if (staticStates.length > 0) {
    return {
      family: "static-composition",
      confidence: 0.97,
      evidence: [
        evidenceCount(
          staticStates,
          "static muxlaunch state under image/static/muxlaunch"
        )
      ]
    };
  }

  if (gridImages.length > 0 || menuGlyphs.length > 0) {
    const hasBothStrategies = gridImages.length > 0 && menuGlyphs.length > 0;

    return {
      family: "composited-grid",
      confidence: hasBothStrategies ? 0.96 : 0.9,
      evidence: [
        ...(gridImages.length > 0
          ? [evidenceCount(gridImages, "muxlaunch grid image")]
          : []),
        ...(menuGlyphs.length > 0
          ? [evidenceCount(menuGlyphs, "muxlaunch menu glyph")]
          : [])
      ]
    };
  }

  const visualAssetCount =
    input.assets.images.length + input.assets.glyphs.length;

  if (input.schemeFiles.length > 0 && visualAssetCount === 0) {
    return {
      family: "scheme-only-partial",
      confidence: input.resolutions.length > 0 ? 0.9 : 0.75,
      evidence: [
        `${input.schemeFiles.length} scheme file(s) detected.`,
        "No raster image or glyph assets were detected."
      ]
    };
  }

  const hasKnownStructure =
    input.resolutions.length > 0 ||
    input.schemeFiles.length > 0 ||
    input.assets.images.length > 0 ||
    input.assets.glyphs.length > 0 ||
    input.assets.fonts.length > 0;

  return {
    family: "empty-unsupported",
    confidence: hasKnownStructure ? 0.5 : 1,
    evidence: [
      hasKnownStructure
        ? "Theme assets exist, but no supported muxlaunch family structure was recognized."
        : "No resolution, scheme, image, glyph, or font structure was detected."
    ]
  };
}

function matchingAssets(
  assets: ThemeAsset[],
  pattern: RegExp
): ThemeAsset[] {
  return assets.filter((asset) => pattern.test(asset.relativePath));
}

function evidenceCount(assets: ThemeAsset[], label: string): string {
  return `${assets.length} ${label}${assets.length === 1 ? "" : "s"} detected.`;
}
