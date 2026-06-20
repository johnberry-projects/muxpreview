import type {
  ThemeAsset,
  ThemeCompositionElement,
  ThemeCompositionReport,
  ThemeCompositionResolutionReport,
  ThemeCompositionRisk,
  ThemeInspectionResult,
  ThemeResolution
} from "./model";

const LAUNCH_ITEM_NAMES = new Set([
  "apps",
  "applications",
  "collection",
  "config",
  "configuration",
  "explore",
  "favourites",
  "favorites",
  "history",
  "info",
  "information"
]);

export function analyzeThemeComposition(
  inspection: ThemeInspectionResult
): ThemeCompositionReport {
  const resolutions = inspection.resolutions.map((resolution) =>
    analyzeResolution(resolution, inspection)
  );

  return {
    themeName: inspection.themeName,
    themePath: inspection.themePath,
    generatedFrom: "theme-inspection",
    summary: {
      bakedUiElementCount: sum(
        resolutions,
        (resolution) => resolution.bakedUiElements.length
      ),
      glyphUsageCount: sum(
        resolutions,
        (resolution) => resolution.glyphUsage.length
      ),
      overlayCount: sum(
        resolutions,
        (resolution) => resolution.overlays.length
      ),
      duplicationRiskCount: sum(
        resolutions,
        (resolution) => resolution.duplicationRisks.length
      )
    },
    resolutions,
    uncertainties: [
      "This report uses theme structure, file names, and asset sizes; it does not inspect image pixels.",
      "Wallpaper UI chrome and menu artwork are reported as likely baked when the file path and neighboring assets suggest it.",
      "Runtime labels and live device state are not present in theme assets."
    ]
  };
}

function analyzeResolution(
  resolution: ThemeResolution,
  inspection: ThemeInspectionResult
): ThemeCompositionResolutionReport {
  const images = [
    ...resolution.assets.images,
    ...inspection.assets.images.filter((asset) => !asset.resolution)
  ];
  const glyphs = [
    ...resolution.assets.glyphs,
    ...inspection.assets.glyphs.filter((asset) => !asset.resolution)
  ];
  const schemeFiles = [
    ...resolution.schemeFiles,
    ...inspection.schemeFiles.filter((scheme) => !scheme.resolution)
  ];
  const bakedUiElements = detectBakedUiElements(resolution, images);
  const glyphUsage = detectGlyphUsage(resolution, glyphs);
  const overlays = detectOverlays(resolution, images, glyphs);
  const schemeDrivenElements = schemeFiles.map((scheme) => ({
    id: `${resolution.name}:scheme:${scheme.relativePath}`,
    label:
      scheme.screenId === "default"
        ? "Default scheme values"
        : `${scheme.screenId ?? "unknown"} scheme values`,
    assetType: "scheme" as const,
    confidence: "high" as const,
    resolution: resolution.name,
    sourceFile: scheme.relativePath,
    evidence: [
      "Scheme file can define colors, alpha values, spacing, geometry, and runtime rendering hints."
    ]
  }));
  const duplicationRisks = detectDuplicationRisks(
    resolution,
    bakedUiElements,
    glyphUsage,
    overlays
  );

  return {
    resolution: resolution.name,
    bakedUiElements,
    glyphUsage,
    overlays,
    schemeDrivenElements,
    duplicationRisks
  };
}

function detectBakedUiElements(
  resolution: ThemeResolution,
  images: ThemeAsset[]
): ThemeCompositionElement[] {
  const wallpapers = images.filter(isWallpaper);
  const defaultWallpaper = wallpapers.find(isDefaultWallpaper);
  const muxlaunchWallpaper = wallpapers.find((asset) =>
    isNamed(asset, "muxlaunch")
  );
  const bakedMuxlaunchWallStates = images.filter(isMuxlaunchWallState);
  const staticMuxlaunchImages = images.filter(isStaticMuxlaunchImage);
  const elements: ThemeCompositionElement[] = [];

  if (defaultWallpaper) {
    elements.push({
      id: `${resolution.name}:wall-default`,
      label: "Default wallpaper / possible baked UI chrome",
      assetType: "wallpaper",
      confidence: wallpaperComplexityConfidence(
        defaultWallpaper,
        wallpapers,
        staticMuxlaunchImages
      ),
      resolution: resolution.name,
      sourceFile: defaultWallpaper.relativePath,
      evidence: [
        "Found image/wall/default.* for this resolution.",
        ...wallpaperEvidence(defaultWallpaper, wallpapers, staticMuxlaunchImages)
      ]
    });
  }

  if (muxlaunchWallpaper) {
    elements.push({
      id: `${resolution.name}:wall-muxlaunch`,
      label: "muxlaunch wallpaper / possible screen-specific chrome",
      assetType: "wallpaper",
      confidence: "medium",
      resolution: resolution.name,
      sourceFile: muxlaunchWallpaper.relativePath,
      evidence: [
        "Found a screen-specific image/wall/muxlaunch.* asset.",
        "This asset may already include decorative launcher chrome."
      ]
    });
  }

  for (const asset of bakedMuxlaunchWallStates) {
    elements.push({
      id: `${resolution.name}:wall-state:${asset.relativePath}`,
      label: `Baked muxlaunch wall state: ${asset.fileName}`,
      assetType: "static-composition",
      confidence: "high",
      resolution: resolution.name,
      sourceFile: asset.relativePath,
      evidence: [
        "Asset lives under image/wall/muxlaunch/<item>.",
        "Observed reference assets in this folder contain complete launcher states."
      ]
    });
  }

  for (const asset of staticMuxlaunchImages) {
    elements.push({
      id: `${resolution.name}:static:${asset.relativePath}`,
      label: `Static muxlaunch composition: ${asset.fileName}`,
      assetType: "static-composition",
      confidence: "high",
      resolution: resolution.name,
      sourceFile: asset.relativePath,
      evidence: [
        "Asset lives under image/static/muxlaunch.",
        "Static muxlaunch images are pre-composed screen content, not individual runtime widgets."
      ]
    });
  }

  return elements;
}

function detectGlyphUsage(
  resolution: ThemeResolution,
  glyphs: ThemeAsset[]
): ThemeCompositionElement[] {
  const elements: ThemeCompositionElement[] = [];
  const headerGlyphs = glyphs.filter((asset) =>
    normalizedPath(asset).includes("/glyph/header/")
  );
  const muxlaunchGlyphs = glyphs.filter((asset) =>
    normalizedPath(asset).includes("/glyph/muxlaunch/")
  );

  if (headerGlyphs.length > 0) {
    elements.push({
      id: `${resolution.name}:glyph-header`,
      label: "Header status glyphs",
      assetType: "glyph",
      confidence: "high",
      resolution: resolution.name,
      sourceFile: summarizeSourceFiles(headerGlyphs),
      evidence: [
        `Found ${headerGlyphs.length} glyph/header asset(s).`,
        "These provide status icon shapes such as network, battery, and Bluetooth."
      ]
    });
  }

  if (muxlaunchGlyphs.length > 0) {
    elements.push({
      id: `${resolution.name}:glyph-muxlaunch`,
      label: "muxlaunch menu glyphs",
      assetType: "glyph",
      confidence: "high",
      resolution: resolution.name,
      sourceFile: summarizeSourceFiles(muxlaunchGlyphs),
      evidence: [
        `Found ${muxlaunchGlyphs.length} glyph/muxlaunch asset(s).`,
        "These are likely runtime-rendered launcher item icons."
      ]
    });
  }

  const launchNamedGlyphs = glyphs.filter((asset) =>
    LAUNCH_ITEM_NAMES.has(fileStem(asset))
  );

  if (launchNamedGlyphs.length > 0 && muxlaunchGlyphs.length === 0) {
    elements.push({
      id: `${resolution.name}:glyph-launch-named`,
      label: "Launcher-like named glyphs",
      assetType: "glyph",
      confidence: "medium",
      resolution: resolution.name,
      sourceFile: summarizeSourceFiles(launchNamedGlyphs),
      evidence: [
        `Found ${launchNamedGlyphs.length} glyph asset(s) with launcher item names.`,
        "Folder names do not prove exact screen usage."
      ]
    });
  }

  return elements;
}

function detectOverlays(
  resolution: ThemeResolution,
  images: ThemeAsset[],
  glyphs: ThemeAsset[]
): ThemeCompositionElement[] {
  const elements: ThemeCompositionElement[] = [];
  const overlay = images.find((asset) =>
    /(?:^|\/)image\/overlay\.[^/]+$/i.test(asset.relativePath)
  );
  const statusGlyphs = glyphs.filter((asset) =>
    normalizedPath(asset).includes("/glyph/header/")
  );

  if (overlay) {
    elements.push({
      id: `${resolution.name}:image-overlay`,
      label: "Image overlay",
      assetType: "image-overlay",
      confidence: "high",
      resolution: resolution.name,
      sourceFile: overlay.relativePath,
      evidence: [
        "Found image/overlay.*.",
        "Scheme values such as misc.IMAGE_OVERLAY can enable this layer."
      ]
    });
  }

  elements.push({
    id: `${resolution.name}:runtime-status`,
    label: "Runtime status text and device state",
    assetType: "runtime-overlay",
    confidence: statusGlyphs.length > 0 ? "medium" : "low",
    resolution: resolution.name,
    sourceFile: statusGlyphs.length > 0
      ? summarizeSourceFiles(statusGlyphs)
      : undefined,
    evidence: [
      "Current time, battery level, and network state are runtime data.",
      statusGlyphs.length > 0
        ? "Theme provides header glyphs for runtime status icons."
        : "No header glyphs were detected for this resolution."
    ]
  });

  return elements;
}

function detectDuplicationRisks(
  resolution: ThemeResolution,
  bakedUiElements: ThemeCompositionElement[],
  glyphUsage: ThemeCompositionElement[],
  overlays: ThemeCompositionElement[]
): ThemeCompositionRisk[] {
  const risks: ThemeCompositionRisk[] = [];
  const defaultWallpaper = bakedUiElements.find((element) =>
    element.id.endsWith(":wall-default")
  );
  const staticMuxlaunch = bakedUiElements.filter(
    (element) => element.assetType === "static-composition"
  );
  const headerGlyphs = glyphUsage.find((element) =>
    element.id.endsWith(":glyph-header")
  );
  const runtimeStatus = overlays.find((element) =>
    element.id.endsWith(":runtime-status")
  );

  if (defaultWallpaper && defaultWallpaper.confidence !== "low") {
    risks.push({
      id: `${resolution.name}:risk-default-wall-baked-ui`,
      severity: defaultWallpaper.confidence === "high" ? "high" : "medium",
      resolution: resolution.name,
      sourceFiles: [defaultWallpaper.sourceFile].filter(Boolean) as string[],
      message:
        "wall/default.png may already contain baked UI artwork; rendering additional chrome over it can duplicate visual elements.",
      evidence: defaultWallpaper.evidence
    });
  }

  if (staticMuxlaunch.length > 0 && glyphUsage.length > 0) {
    risks.push({
      id: `${resolution.name}:risk-static-plus-runtime-icons`,
      severity: "high",
      resolution: resolution.name,
      sourceFiles: [
        ...staticMuxlaunch
          .map((element) => element.sourceFile)
          .filter(Boolean),
        ...glyphUsage.map((element) => element.sourceFile).filter(Boolean)
      ] as string[],
      message:
        "Static muxlaunch compositions and runtime glyph rendering can draw the same launcher content twice.",
      evidence: [
        `Found ${staticMuxlaunch.length} static muxlaunch composition asset(s).`,
        `Found ${glyphUsage.length} glyph usage group(s).`
      ]
    });
  }

  if (headerGlyphs && runtimeStatus) {
    risks.push({
      id: `${resolution.name}:risk-status-over-baked-header`,
      severity: "medium",
      resolution: resolution.name,
      sourceFiles: [
        headerGlyphs.sourceFile,
        runtimeStatus.sourceFile
      ].filter(Boolean) as string[],
      message:
        "Header glyphs are runtime status assets; if the wallpaper already includes status icons, the status bar may duplicate them.",
      evidence: [
        ...headerGlyphs.evidence,
        ...runtimeStatus.evidence
      ]
    });
  }

  return risks;
}

function wallpaperComplexityConfidence(
  wallpaper: ThemeAsset,
  wallpapers: ThemeAsset[],
  staticMuxlaunchImages: ThemeAsset[]
): "high" | "medium" | "low" {
  if (staticMuxlaunchImages.length > 0 && isLargeRelativeWallpaper(wallpaper, wallpapers)) {
    return "high";
  }

  if (staticMuxlaunchImages.length > 0 || isLargeRelativeWallpaper(wallpaper, wallpapers)) {
    return "medium";
  }

  return "low";
}

function wallpaperEvidence(
  wallpaper: ThemeAsset,
  wallpapers: ThemeAsset[],
  staticMuxlaunchImages: ThemeAsset[]
): string[] {
  const evidence: string[] = [];

  if (staticMuxlaunchImages.length > 0) {
    evidence.push(
      `Found ${staticMuxlaunchImages.length} image/static/muxlaunch asset(s) in the same resolution.`
    );
  }

  if (isLargeRelativeWallpaper(wallpaper, wallpapers)) {
    evidence.push(
      "default wallpaper is larger than neighboring wallpaper assets, suggesting more complex baked artwork."
    );
  }

  if (evidence.length === 0) {
    evidence.push(
      "Path confirms a default wallpaper, but image pixels were not inspected."
    );
  }

  return evidence;
}

function isLargeRelativeWallpaper(
  wallpaper: ThemeAsset,
  wallpapers: ThemeAsset[]
): boolean {
  const peers = wallpapers.filter((asset) => asset.relativePath !== wallpaper.relativePath);

  if (peers.length === 0) {
    return false;
  }

  const averagePeerSize =
    peers.reduce((total, asset) => total + asset.size, 0) / peers.length;

  return averagePeerSize > 0 && wallpaper.size >= averagePeerSize * 1.25;
}

function isWallpaper(asset: ThemeAsset): boolean {
  return /(?:^|\/)image\/wall\//i.test(asset.relativePath);
}

function isDefaultWallpaper(asset: ThemeAsset): boolean {
  return isWallpaper(asset) && isNamed(asset, "default");
}

function isStaticMuxlaunchImage(asset: ThemeAsset): boolean {
  return /(?:^|\/)image\/static\/muxlaunch\//i.test(asset.relativePath);
}

function isMuxlaunchWallState(asset: ThemeAsset): boolean {
  return /(?:^|\/)image\/wall\/muxlaunch\/[^/]+$/i.test(asset.relativePath);
}

function isNamed(asset: ThemeAsset, name: string): boolean {
  return fileStem(asset) === name;
}

function fileStem(asset: ThemeAsset): string {
  return asset.fileName
    .slice(0, -asset.extension.length)
    .toLocaleLowerCase();
}

function normalizedPath(asset: ThemeAsset): string {
  return `/${asset.relativePath.toLowerCase()}`;
}

function summarizeSourceFiles(assets: ThemeAsset[]): string {
  const [first] = assets;

  return assets.length === 1
    ? first.relativePath
    : `${first.relativePath} + ${assets.length - 1} more`;
}

function sum<T>(items: T[], readValue: (item: T) => number): number {
  return items.reduce((total, item) => total + readValue(item), 0);
}
