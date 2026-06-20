import type {
  MuxlaunchRenderModel,
  MuxlaunchVisualLayerModel,
  ThemeAsset,
  ThemeInspectionResult,
  ThemeResolution
} from "./model";

export function resolveMuxlaunchVisualLayers(
  inspection: ThemeInspectionResult,
  resolution: ThemeResolution,
  renderModel?: MuxlaunchRenderModel
): MuxlaunchVisualLayerModel {
  const backgroundAsset = selectAsset(
    inspection.assets.images.filter(isMuxlaunchBackground),
    resolution.name,
    compareBackgrounds
  );
  const overlayAsset = selectAsset(
    inspection.assets.images.filter(isCanvasOverlay),
    resolution.name
  );
  const staticAssets = inspection.assets.images
    .filter(isMuxlaunchStaticImage)
    .filter(
      (asset) => !asset.resolution || asset.resolution === resolution.name
    );
  const bakedAssets = inspection.assets.images
    .filter(isMuxlaunchWallState)
    .filter(
      (asset) => !asset.resolution || asset.resolution === resolution.name
    );
  const gridAssets = [
    ...inspection.assets.images.filter(isMuxlaunchGridImage),
    ...inspection.assets.glyphs.filter(isMuxlaunchGlyph)
  ].filter(
    (asset) => !asset.resolution || asset.resolution === resolution.name
  );
  const statusAssets = inspection.assets.glyphs
    .filter(isHeaderGlyph)
    .filter(
      (asset) => !asset.resolution || asset.resolution === resolution.name
    )
    .sort(comparePaths);
  const bakedContentAsset = selectAsset(
    bakedAssets,
    resolution.name,
    compareStaticContent
  );
  const staticContentAsset = selectAsset(
    staticAssets,
    resolution.name,
    compareStaticContent
  );
  const contentAsset = bakedContentAsset ?? staticContentAsset;
  const contentMode = bakedContentAsset
    ? "baked"
    : staticContentAsset
      ? "static"
      : "grid";
  const contentAssets =
    contentMode === "baked"
      ? bakedAssets
      : contentMode === "static"
        ? staticAssets
        : gridAssets;
  const overlayEnabled =
    renderModel?.visual.imageOverlayEnabled === true && Boolean(overlayAsset);

  return {
    resolution: resolution.name,
    backgroundAsset,
    contentAsset,
    contentMode,
    overlayAsset,
    overlayEnabled,
    layers: [
      {
        id: "background",
        kind: "background",
        label: "Background",
        state: backgroundAsset ? "rendered" : "generated",
        assetPaths: backgroundAsset ? [backgroundAsset.relativePath] : [],
        note: backgroundAsset
          ? "Screen-specific muxlaunch background or default background."
          : "No muxlaunch/default background asset was detected."
      },
      {
        id: "top-bar",
        kind: "top-bar",
        label: "Top bar",
        state: backgroundAsset ? "embedded" : "generated",
        assetPaths: backgroundAsset ? [backgroundAsset.relativePath] : [],
        note: backgroundAsset
          ? "UI chrome is preserved inside the background composite and is not drawn twice."
          : "No separate top-bar asset was verified."
      },
      {
        id: "status-bar",
        kind: "status-bar",
        label: "Status bar",
        state:
          contentMode === "baked"
            ? "suppressed"
            : statusAssets.length > 0
              ? "rendered"
              : "generated",
        assetPaths: statusAssets.map((asset) => asset.relativePath),
        note:
          contentMode === "baked"
            ? "Suppressed because a full nested muxlaunch wall composition is rendered."
            : statusAssets.length > 0
            ? "Header glyphs are rendered over the top bar with mapped colors where available."
            : "No header glyphs were detected; CSS fallback indicators are used."
      },
      {
        id: "content",
        kind: "content",
        label: "Launcher content",
        state: contentAsset ? "rendered" : "generated",
        assetPaths: contentAssets.map((asset) => asset.relativePath),
        note: bakedContentAsset
          ? "A full nested muxlaunch wall state is rendered without generated menu or status layers."
          : staticContentAsset
            ? "A static muxlaunch content composition is rendered for the selected fixture item."
          : "Menu cells are rendered from inspected grid images or glyph fallbacks."
      },
      {
        id: "overlay",
        kind: "overlay",
        label: "Canvas overlay",
        state: overlayEnabled
          ? "rendered"
          : overlayAsset
            ? "available"
            : "generated",
        assetPaths: overlayAsset ? [overlayAsset.relativePath] : [],
        note: overlayAsset
          ? overlayEnabled
            ? "Enabled by misc.IMAGE_OVERLAY."
            : "Asset detected but not enabled by the parsed muxlaunch scheme."
          : "No image/overlay asset was detected."
      }
    ]
  };
}

function selectAsset(
  assets: ThemeAsset[],
  resolutionName: string,
  compareWithinPriority: (
    left: ThemeAsset,
    right: ThemeAsset
  ) => number = comparePaths
): ThemeAsset | undefined {
  return assets
    .filter(
      (asset) => !asset.resolution || asset.resolution === resolutionName
    )
    .sort((left, right) => {
      const resolutionPriority =
        Number(right.resolution === resolutionName) -
        Number(left.resolution === resolutionName);

      return resolutionPriority || compareWithinPriority(left, right);
    })[0];
}

function compareBackgrounds(left: ThemeAsset, right: ThemeAsset): number {
  return (
    Number(isNamed(right, "muxlaunch")) -
      Number(isNamed(left, "muxlaunch")) ||
    comparePaths(left, right)
  );
}

function comparePaths(left: ThemeAsset, right: ThemeAsset): number {
  return left.relativePath.localeCompare(right.relativePath);
}

function isMuxlaunchBackground(asset: ThemeAsset): boolean {
  return /(?:^|\/)image\/wall\/(?:muxlaunch|default)\.[^/]+$/i.test(
    asset.relativePath
  );
}

function isCanvasOverlay(asset: ThemeAsset): boolean {
  return /(?:^|\/)image\/overlay\.[^/]+$/i.test(asset.relativePath);
}

function compareStaticContent(left: ThemeAsset, right: ThemeAsset): number {
  return (
    Number(isNamed(right, "explore")) -
      Number(isNamed(left, "explore")) ||
    comparePaths(left, right)
  );
}

function isMuxlaunchGridImage(asset: ThemeAsset): boolean {
  return asset.relativePath.toLowerCase().includes("image/grid/muxlaunch/");
}

function isMuxlaunchStaticImage(asset: ThemeAsset): boolean {
  return asset.relativePath.toLowerCase().includes("image/static/muxlaunch/");
}

function isMuxlaunchWallState(asset: ThemeAsset): boolean {
  return asset.relativePath.toLowerCase().includes("image/wall/muxlaunch/");
}

function isMuxlaunchGlyph(asset: ThemeAsset): boolean {
  return asset.relativePath.toLowerCase().includes("glyph/muxlaunch/");
}

function isHeaderGlyph(asset: ThemeAsset): boolean {
  return asset.relativePath.toLowerCase().includes("glyph/header/");
}

function isNamed(asset: ThemeAsset, name: string): boolean {
  return asset.fileName.slice(0, -asset.extension.length).toLowerCase() === name;
}
