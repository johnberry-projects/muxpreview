import type {
  MuxlaunchRenderModel,
  ParsedThemeScheme,
  ThemeAsset,
  ThemeAssetManifest,
  ThemeAssetManifestEntry,
  ThemeAssetManifestFile,
  ThemeCompositionRisk,
  ThemeInspectionResult,
  ThemeResolution
} from "../model";
import { mapMuxlaunchScheme } from "../parser";
import { analyzeThemeComposition } from "../theme-composition-service";
import type {
  MuxlaunchPreviewModel,
  PreviewAssetRef,
  PreviewContentMode,
  PreviewCurrentLabelStyle,
  PreviewGridBox,
  PreviewMenuCellStyle,
  PreviewMenuEntry,
  PreviewMenuLayout,
  PreviewStatusBarStyle
} from "./model";

export interface BuildMuxlaunchPreviewModelInput {
  assetManifest: ThemeAssetManifest;
  inspection: ThemeInspectionResult;
  parsedSchemes: ParsedThemeScheme[];
  resolution: ThemeResolution;
}

const BASE_FALLBACK_LAYOUT = {
  columnCount: 4,
  rowCount: 2,
  columnWidth: 136,
  rowHeight: 156,
  cellWidth: 120,
  cellHeight: 120
};

const LAUNCH_ITEMS: Array<{ aliases: string[]; label: string }> = [
  { label: "Explore", aliases: ["explore"] },
  {
    label: "Favourites",
    aliases: ["collection", "favourite", "favourites", "favorites"]
  },
  { label: "Applications", aliases: ["apps", "applications", "app"] },
  { label: "Configuration", aliases: ["config", "configuration", "settings"] },
  { label: "History", aliases: ["history"] },
  { label: "Information", aliases: ["info", "information"] },
  { label: "Reboot", aliases: ["reboot"] },
  { label: "Shutdown", aliases: ["shutdown"] }
];

const COMPOSITION_REGIONS: Array<PreviewGridBox & { aliases: string[] }> = [
  { aliases: ["explore"], left: 0.065, top: 0.19, width: 0.285, height: 0.45 },
  {
    aliases: ["collection", "favourite", "favourites", "favorites"],
    left: 0.355,
    top: 0.19,
    width: 0.285,
    height: 0.45
  },
  { aliases: ["history"], left: 0.65, top: 0.19, width: 0.285, height: 0.45 },
  {
    aliases: ["apps", "applications", "app"],
    left: 0.065,
    top: 0.69,
    width: 0.315,
    height: 0.16
  },
  {
    aliases: ["info", "information"],
    left: 0.4,
    top: 0.69,
    width: 0.12,
    height: 0.16
  },
  {
    aliases: ["config", "configuration", "settings"],
    left: 0.535,
    top: 0.69,
    width: 0.125,
    height: 0.16
  },
  { aliases: ["reboot"], left: 0.675, top: 0.69, width: 0.125, height: 0.16 },
  { aliases: ["shutdown"], left: 0.81, top: 0.69, width: 0.125, height: 0.16 }
];

export function buildMuxlaunchPreviewModel(
  input: BuildMuxlaunchPreviewModelInput
): MuxlaunchPreviewModel {
  const renderModel = mapSchemes(input.parsedSchemes, input.resolution);
  const resolutionManifest = input.assetManifest.resolutions.find(
    (candidate) => candidate.resolution === input.resolution.name
  );
  const wallpaperEntry = findEntry(resolutionManifest?.entries, "primary-wallpaper");
  const artworkEntry = findEntry(resolutionManifest?.entries, "muxlaunch-artwork");
  const fontEntry = findEntry(resolutionManifest?.entries, "fonts");
  const contentMode = resolveContentMode(artworkEntry?.selectedFile);
  const overlay = selectOverlay(input.inspection.assets.images, input.resolution);
  const menuLayout = createMenuLayout(renderModel, input.resolution);
  const menuStyles = createMenuStyles(renderModel, menuLayout);
  const entries = selectMenuEntries(
    input.inspection,
    input.resolution,
    visibleItemCount(renderModel),
    contentMode
  );
  const statusAssets = selectStatusAssets(
    input.inspection.assets.glyphs,
    input.resolution.name
  );
  const compatibilityWarnings = analyzeThemeComposition(input.inspection)
    .resolutions.find(
      (candidate) => candidate.resolution === input.resolution.name
    )?.compatibilityWarnings ?? [];

  return {
    diagnostics: compatibilityWarnings.map(toPreviewDiagnostic),
    fonts: selectedAndAlternatives(fontEntry).map((file) =>
      manifestFileToPreviewAsset(file)
    ),
    generatedFrom: "preview-model-builder",
    resolution: {
      name: input.resolution.name,
      width: input.resolution.width,
      height: input.resolution.height
    },
    screen: "muxlaunch",
    wallpaper: {
      asset: wallpaperEntry?.selectedFile
        ? manifestFileToPreviewAsset(wallpaperEntry.selectedFile)
        : undefined,
      reason: wallpaperEntry?.reason ?? "No wallpaper manifest entry was available."
    },
    overlay: {
      asset: overlay ? assetToPreviewAsset(overlay, "image") : undefined,
      enabled: renderModel?.visual.imageOverlayEnabled === true && Boolean(overlay),
      reason: overlay
        ? renderModel?.visual.imageOverlayEnabled === true
          ? "Enabled by misc.IMAGE_OVERLAY."
          : "Overlay asset exists, but the mapped scheme does not enable it."
        : "No image/overlay asset was detected."
    },
    content: {
      asset: artworkEntry?.selectedFile
        ? manifestFileToPreviewAsset(artworkEntry.selectedFile)
        : undefined,
      mode: contentMode,
      reason: artworkEntry?.reason ?? "No muxlaunch artwork manifest entry was available."
    },
    statusBar: {
      icons: {
        battery: {
          asset: statusAssets.battery
            ? assetToPreviewAsset(statusAssets.battery, "glyph")
            : undefined,
          fallback: "battery",
          label: "Battery"
        },
        network: {
          asset: statusAssets.network
            ? assetToPreviewAsset(statusAssets.network, "glyph")
            : undefined,
          fallback: "text",
          fallbackText: "Wi-Fi",
          label: "Wi-Fi"
        }
      },
      style: createStatusBarStyle(renderModel, input.resolution),
      title: "Main Menu",
      visible: contentMode !== "baked"
    },
    menu: {
      currentLabel: menuStyles.currentLabel,
      entries,
      focus: menuStyles.focus,
      initialFocusIndex: 0,
      item: menuStyles.item,
      layout: menuLayout
    }
  };
}

function mapSchemes(
  parsedSchemes: ParsedThemeScheme[],
  resolution: ThemeResolution
): MuxlaunchRenderModel | undefined {
  const muxlaunchScheme = parsedSchemes.find(
    (scheme) => scheme.screenId?.toLowerCase() === "muxlaunch"
  );

  if (!muxlaunchScheme) {
    return undefined;
  }

  return mapMuxlaunchScheme({
    relativePath: parsedSchemes.map((scheme) => scheme.relativePath).join(" + "),
    fileName: muxlaunchScheme.fileName,
    resolution: resolution.name,
    screenId: "muxlaunch",
    sections: parsedSchemes.flatMap((scheme) => scheme.sections),
    issues: parsedSchemes.flatMap((scheme) => scheme.issues)
  });
}

function findEntry(
  entries: ThemeAssetManifestEntry[] | undefined,
  role: ThemeAssetManifestEntry["role"]
): ThemeAssetManifestEntry | undefined {
  return entries?.find((entry) => entry.role === role);
}

function selectedAndAlternatives(
  entry: ThemeAssetManifestEntry | undefined
): ThemeAssetManifestFile[] {
  return [entry?.selectedFile, ...(entry?.alternatives ?? [])].filter(
    Boolean
  ) as ThemeAssetManifestFile[];
}

function resolveContentMode(
  selectedArtwork: ThemeAssetManifestFile | undefined
): PreviewContentMode {
  const path = selectedArtwork?.relativePath.toLowerCase() ?? "";

  if (path.includes("image/wall/muxlaunch/")) {
    return "baked";
  }

  if (path.includes("image/static/muxlaunch/")) {
    return "static";
  }

  return "grid";
}

function selectMenuEntries(
  inspection: ThemeInspectionResult,
  resolution: ThemeResolution,
  limit: number,
  contentMode: PreviewContentMode
): PreviewMenuEntry[] {
  const launcherImages = sortAssets(
    inspection.assets.images.filter((asset) =>
      asset.relativePath.toLowerCase().includes("image/grid/muxlaunch/")
    ),
    resolution.name
  );
  const launcherGlyphs = sortAssets(
    inspection.assets.glyphs.filter((asset) =>
      asset.relativePath.toLowerCase().includes("glyph/muxlaunch/")
    ),
    resolution.name
  );
  const usedPaths = new Set<string>();

  return LAUNCH_ITEMS.slice(0, limit).map((item) => {
    const matchedImage = findAsset(launcherImages, item.aliases, usedPaths);
    const matchedGlyph = matchedImage
      ? undefined
      : findAsset(launcherGlyphs, item.aliases, usedPaths);
    const image =
      matchedImage ??
      (matchedGlyph ? undefined : findUnusedAsset(launcherImages, usedPaths));
    const glyph =
      matchedGlyph ??
      (image ? undefined : findUnusedAsset(launcherGlyphs, usedPaths));
    const asset = image ?? glyph;

    if (asset) {
      usedPaths.add(asset.relativePath);
    }

    return {
      ...item,
      artwork: asset
        ? assetToPreviewAsset(asset, image ? "image" : "glyph")
        : undefined,
      artworkKind: image ? "image" : glyph ? "glyph" : undefined,
      compositionAsset: selectCompositionAsset(
        inspection.assets.images,
        resolution.name,
        contentMode,
        item.aliases
      ),
      hotspot: hotspotForAliases(item.aliases)
    };
  });
}

function hotspotForAliases(aliases: string[]): PreviewGridBox {
  const region = COMPOSITION_REGIONS.find((candidate) =>
    aliases.some((alias) => candidate.aliases.includes(alias))
  );

  return {
    height: region?.height ?? 0,
    left: region?.left ?? 0,
    top: region?.top ?? 0,
    width: region?.width ?? 0
  };
}

function selectCompositionAsset(
  images: ThemeAsset[],
  resolutionName: string,
  contentMode: PreviewContentMode,
  aliases: string[]
): PreviewAssetRef | undefined {
  if (contentMode === "grid") {
    return undefined;
  }

  const pathSegment =
    contentMode === "baked"
      ? "image/wall/muxlaunch/"
      : "image/static/muxlaunch/";
  const candidates = sortAssets(
    images.filter((asset) =>
      asset.relativePath.toLowerCase().includes(pathSegment)
    ),
    resolutionName
  );
  const selected = candidates.find((asset) => aliases.includes(fileStem(asset)));

  return selected ? assetToPreviewAsset(selected, "image") : undefined;
}

function selectOverlay(
  images: ThemeAsset[],
  resolution: ThemeResolution
): ThemeAsset | undefined {
  return sortAssets(
    images.filter((asset) =>
      /(?:^|\/)image\/overlay\.[^/]+$/i.test(asset.relativePath)
    ),
    resolution.name
  )[0];
}

function selectStatusAssets(glyphs: ThemeAsset[], resolutionName: string) {
  const headerGlyphs = sortAssets(
    glyphs.filter((asset) =>
      asset.relativePath.toLowerCase().includes("glyph/header/")
    ),
    resolutionName
  );

  return {
    network: findByStem(headerGlyphs, [
      "network_active",
      "network_normal",
      "wifi_active",
      "wifi_normal"
    ]),
    battery:
      findByStem(headerGlyphs, [
        "capacity_100",
        "capacity_90",
        "capacity_80",
        "battery_full",
        "battery"
      ]) ?? headerGlyphs.find((asset) => fileStem(asset).startsWith("capacity_"))
  };
}

function findByStem(
  assets: ThemeAsset[],
  stems: string[]
): ThemeAsset | undefined {
  return assets.find((asset) => stems.includes(fileStem(asset)));
}

function findAsset(
  assets: ThemeAsset[],
  aliases: string[],
  usedPaths: Set<string>
): ThemeAsset | undefined {
  return assets.find(
    (asset) =>
      !usedPaths.has(asset.relativePath) && aliases.includes(fileStem(asset))
  );
}

function findUnusedAsset(
  assets: ThemeAsset[],
  usedPaths: Set<string>
): ThemeAsset | undefined {
  return assets.find((asset) => !usedPaths.has(asset.relativePath));
}

function sortAssets<T extends ThemeAsset>(
  assets: T[],
  resolutionName: string
): T[] {
  return assets
    .filter((asset) => !asset.resolution || asset.resolution === resolutionName)
    .sort((left, right) => {
      const resolutionPriority =
        Number(right.resolution === resolutionName) -
        Number(left.resolution === resolutionName);

      return (
        resolutionPriority || left.relativePath.localeCompare(right.relativePath)
      );
    });
}

function createMenuLayout(
  renderModel: MuxlaunchRenderModel | undefined,
  resolution: ThemeResolution
): PreviewMenuLayout {
  const fallbackScale = Math.min(resolution.width / 640, resolution.height / 480);
  const fallbackLayout = {
    columnWidth: BASE_FALLBACK_LAYOUT.columnWidth * fallbackScale,
    rowHeight: BASE_FALLBACK_LAYOUT.rowHeight * fallbackScale,
    cellWidth: BASE_FALLBACK_LAYOUT.cellWidth * fallbackScale,
    cellHeight: BASE_FALLBACK_LAYOUT.cellHeight * fallbackScale
  };
  const layout = renderModel?.layout ?? {};
  const columns = bounded(layout.columnCount, 1, 8) ?? 4;
  const rows = bounded(layout.rowCount, 1, 4) ?? 2;
  const cellWidth = positive(layout.cellWidth) ?? fallbackLayout.cellWidth;
  const cellHeight = positive(layout.cellHeight) ?? fallbackLayout.cellHeight;
  const columnWidth = Math.max(
    cellWidth,
    positive(layout.columnWidth) ?? fallbackLayout.columnWidth
  );
  const rowHeight = Math.max(
    cellHeight,
    positive(layout.rowHeight) ?? fallbackLayout.rowHeight
  );
  const gridWidth = (columns - 1) * columnWidth + cellWidth;
  const gridHeight = (rows - 1) * rowHeight + cellHeight;

  return {
    cellHeight,
    cellWidth,
    columnGap: columnWidth - cellWidth,
    columns,
    gridHeight,
    gridWidth,
    rowGap: rowHeight - cellHeight,
    rows,
    x: layout.locationX ?? Math.max(0, (resolution.width - gridWidth) / 2),
    y: layout.locationY ?? Math.max(0, (resolution.height - gridHeight) / 2)
  };
}

function createMenuStyles(
  renderModel: MuxlaunchRenderModel | undefined,
  menuLayout: PreviewMenuLayout
): {
  currentLabel: PreviewCurrentLabelStyle;
  focus: PreviewMenuCellStyle;
  item: PreviewMenuCellStyle;
} {
  const layout = renderModel?.layout ?? {};
  const colors = renderModel?.colors;
  const alphas = renderModel?.alphas;
  const borderWidth = bounded(layout.cellBorderWidth, 0, 20) ?? 0;
  const radius = bounded(
    layout.cellRadius,
    0,
    Math.max(menuLayout.cellWidth, menuLayout.cellHeight)
  );
  const labelOffset = layout.currentItemLabelOffsetY ?? 8;
  const labelFontSize = Math.max(8, Math.round(menuLayout.cellHeight * 0.13));
  const currentLabelFontSize = Math.max(
    9,
    Math.round(menuLayout.cellHeight * 0.15)
  );

  return {
    item: {
      background: colorWithAlpha(
        colors?.cellBackground ?? "#11151A",
        alphas?.cellBackground ?? 150
      ),
      borderColor: colorWithAlpha(
        colors?.cellBorder ?? "#FFFFFF",
        alphas?.cellBorder ?? 0
      ),
      borderRadius: radius,
      borderWidth,
      color: colorWithAlpha(
        colors?.labelText ?? "#FFFFFF",
        alphas?.labelText ?? 255
      ),
      imageOpacity: alphaOpacity(alphas?.cellImage),
      imagePaddingTop: layout.imagePaddingTop ?? 0,
      labelFontSize,
      labelPaddingBottom: layout.textPaddingBottom ?? 0,
      labelPaddingInline: layout.textPaddingSide ?? 0,
      labelVisible: alphas?.labelText !== 0
    },
    focus: {
      background: colorWithAlpha(
        colors?.focusBackground ?? "#F3BD3D",
        alphas?.focusBackground ?? 220
      ),
      borderColor: colorWithAlpha(
        colors?.focusBorder ?? "#F3BD3D",
        alphas?.focusBorder ?? 255
      ),
      borderRadius: radius,
      borderWidth,
      color: colorWithAlpha(
        colors?.focusText ?? "#11151A",
        alphas?.focusText ?? 255
      ),
      imageOpacity: alphaOpacity(alphas?.focusImage),
      imagePaddingTop: layout.imagePaddingTop ?? 0,
      labelFontSize,
      labelPaddingBottom: layout.textPaddingBottom ?? 0,
      labelPaddingInline: layout.textPaddingSide ?? 0,
      labelVisible: alphas?.focusText !== 0
    },
    currentLabel: {
      color: colorWithAlpha(
        colors?.currentItemLabelText ?? colors?.focusText ?? "#FFFFFF",
        alphas?.currentItemLabelText ?? 255
      ),
      fontSize: currentLabelFontSize,
      visible: alphas?.currentItemLabelText !== 0,
      y: menuLayout.gridHeight + labelOffset
    }
  };
}

function createStatusBarStyle(
  renderModel: MuxlaunchRenderModel | undefined,
  resolution: ThemeResolution
): PreviewStatusBarStyle {
  const fallbackScale = Math.min(resolution.width / 640, resolution.height / 480);
  const statusBar = renderModel?.statusBar;
  const height = positive(statusBar?.headerHeight) ?? Math.round(48 * fallbackScale);
  const titleColor = colorWithAlpha(
    statusBar?.headerText ?? statusBar?.dateTimeText ?? "#FFFFFF",
    statusBar?.headerTextAlpha ?? statusBar?.dateTimeAlpha ?? 255
  );
  const timeColor = colorWithAlpha(
    statusBar?.dateTimeText ?? statusBar?.headerText ?? "#FFFFFF",
    statusBar?.dateTimeAlpha ?? statusBar?.headerTextAlpha ?? 255
  );
  const headerBackgroundAlpha = positiveOrZero(statusBar?.headerBackgroundAlpha);
  const background =
    statusBar?.headerBackground && headerBackgroundAlpha
      ? colorWithAlpha(statusBar.headerBackground, headerBackgroundAlpha)
      : "transparent";
  const textColor =
    statusBar?.headerText ?? statusBar?.dateTimeText ?? "#FFFFFF";

  return {
    background,
    batteryColor: statusBar?.batteryNormal ?? statusBar?.batteryActive ?? textColor,
    batteryOpacity: alphaOpacity(
      statusBar?.batteryNormalAlpha ?? statusBar?.batteryActiveAlpha
    ),
    fontSize: Math.max(10, Math.round(height * 0.32)),
    height,
    iconHeight: Math.max(14, Math.round(height * 0.44)),
    networkColor:
      statusBar?.networkActive ?? statusBar?.networkNormal ?? textColor,
    networkOpacity: alphaOpacity(
      statusBar?.networkActiveAlpha ?? statusBar?.networkNormalAlpha
    ),
    paddingLeft:
      positive(statusBar?.datePaddingLeft) ?? Math.round(18 * fallbackScale),
    paddingRight:
      positive(statusBar?.statusPaddingRight) ?? Math.round(20 * fallbackScale),
    timeColor,
    titleColor
  };
}

function visibleItemCount(renderModel: MuxlaunchRenderModel | undefined): number {
  const columns = bounded(renderModel?.layout.columnCount, 1, 8);
  const rows = bounded(renderModel?.layout.rowCount, 1, 4);

  return Math.min((columns ?? 4) * (rows ?? 2), 8);
}

function toPreviewDiagnostic(risk: ThemeCompositionRisk) {
  return {
    id: risk.id,
    message: risk.message,
    severity: risk.severity,
    sourceFiles: risk.sourceFiles
  };
}

function assetToPreviewAsset(
  asset: ThemeAsset,
  kind: PreviewAssetRef["kind"]
): PreviewAssetRef {
  return {
    kind,
    relativePath: asset.relativePath,
    fileName: asset.fileName,
    size: asset.size,
    resolution: asset.resolution
  };
}

function manifestFileToPreviewAsset(
  file: ThemeAssetManifestFile
): PreviewAssetRef {
  return {
    kind: file.kind,
    relativePath: file.relativePath,
    fileName: file.fileName,
    size: file.size,
    resolution: file.resolution
  };
}

function fileStem(asset: ThemeAsset): string {
  return asset.fileName
    .slice(0, -asset.extension.length)
    .toLocaleLowerCase();
}

function bounded(
  value: number | undefined,
  minimum: number,
  maximum: number
): number | undefined {
  return value !== undefined && value >= minimum && value <= maximum
    ? value
    : undefined;
}

function positive(value: number | undefined): number | undefined {
  return value !== undefined && value > 0 ? value : undefined;
}

function positiveOrZero(value: number | undefined): number | undefined {
  return value !== undefined && value >= 0 ? value : undefined;
}

function alphaOpacity(alpha: number | undefined): number {
  const validAlpha = bounded(alpha, 0, 255);
  return validAlpha === undefined ? 1 : validAlpha / 255;
}

function colorWithAlpha(color: string, alpha: number): string {
  const validAlpha = bounded(alpha, 0, 255) ?? 255;
  return `${color}${validAlpha.toString(16).padStart(2, "0")}`;
}
