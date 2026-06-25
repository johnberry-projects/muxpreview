import type {
  ThemeAsset,
  ThemeAssetGroup,
  ThemeAssetManifest,
  ThemeAssetManifestEntry,
  ThemeAssetManifestFile,
  ThemeAssetManifestFileKind,
  ThemeAssetManifestRole,
  ThemeFamily,
  ThemeFamilyDetection,
  ThemeResolution,
  ThemeSchemeFile
} from "./model";

export interface ThemeAssetManifestInput {
  themePath: string;
  themeName: string;
  resolutions: ThemeResolution[];
  schemeFiles: ThemeSchemeFile[];
  assets: ThemeAssetGroup;
  themeFamily: ThemeFamilyDetection;
}

type Candidate = ThemeAsset | ThemeSchemeFile;

export function buildThemeAssetManifest(
  input: ThemeAssetManifestInput
): ThemeAssetManifest {
  return {
    themeName: input.themeName,
    themePath: input.themePath,
    family: input.themeFamily,
    generatedFrom: "theme-inspection",
    resolutions: input.resolutions.map((resolution) => ({
      resolution: resolution.name,
      entries: [
        resolvePrimaryWallpaper(input, resolution),
        resolveMuxlaunchArtwork(input, resolution),
        resolveMenuGlyphs(input, resolution),
        resolveHeaderStatusGlyphs(input, resolution),
        resolveFonts(input, resolution),
        resolveSchemeFiles(input, resolution)
      ]
    })),
    uncertainties: [
      "Resolution-specific assets are preferred over shared root assets as a muxpreview preview policy, not a verified muOS runtime rule.",
      "The manifest uses paths, file names, and detected theme family; it does not inspect image pixels or decode fonts.",
      "A selected file is the best representative for a role. Alternatives remain visible because later renderer policies may choose differently."
    ]
  };
}

function resolvePrimaryWallpaper(
  input: ThemeAssetManifestInput,
  resolution: ThemeResolution
): ThemeAssetManifestEntry {
  const candidates = scopedAssets(input.assets.images, resolution)
    .filter(isMuxlaunchBackground)
    .sort((left, right) =>
      compareScopedCandidates(left, right, resolution, (leftAsset, rightAsset) =>
        compareWallpaperByFamily(leftAsset, rightAsset, input.themeFamily.family)
      )
    );
  const selected = candidates[0];

  return createEntry({
    role: "primary-wallpaper",
    selected,
    candidates,
    kind: "image",
    confidence: selected ? wallpaperConfidence(selected, input.themeFamily.family) : 0.12,
    reason: selected
      ? primaryWallpaperReason(selected, input.themeFamily.family)
      : "No image/wall/default.* or image/wall/muxlaunch.* background candidate was found for this resolution or shared root scope."
  });
}

function resolveMuxlaunchArtwork(
  input: ThemeAssetManifestInput,
  resolution: ThemeResolution
): ThemeAssetManifestEntry {
  const candidates = scopedAssets(input.assets.images, resolution)
    .filter((asset) => isFamilyMuxlaunchArtwork(asset, input.themeFamily.family))
    .sort((left, right) =>
      compareScopedCandidates(left, right, resolution, compareExploreFirst)
    );
  const selected = candidates[0];

  return createEntry({
    role: "muxlaunch-artwork",
    selected,
    candidates,
    kind: "image",
    confidence: selected
      ? muxlaunchArtworkConfidence(input.themeFamily.family)
      : input.themeFamily.family === "scheme-only-partial"
        ? 0.08
        : 0.18,
    reason: selected
      ? muxlaunchArtworkReason(selected, input.themeFamily.family)
      : missingMuxlaunchArtworkReason(input.themeFamily.family)
  });
}

function resolveMenuGlyphs(
  input: ThemeAssetManifestInput,
  resolution: ThemeResolution
): ThemeAssetManifestEntry {
  const candidates = scopedAssets(input.assets.glyphs, resolution)
    .filter(isMenuGlyphCandidate)
    .sort((left, right) =>
      compareScopedCandidates(left, right, resolution, compareExploreFirst)
    );
  const selected = candidates[0];

  return createEntry({
    role: "menu-glyph-candidates",
    selected,
    candidates,
    kind: "glyph",
    confidence: selected ? (isMuxlaunchGlyph(selected) ? 0.9 : 0.62) : 0.1,
    reason: selected
      ? `Found ${candidates.length} launcher glyph candidate(s); glyph/muxlaunch paths are preferred before launcher-like file names.`
      : "No glyph/muxlaunch assets or launcher-like glyph file names were found for this resolution or shared root scope."
  });
}

function resolveHeaderStatusGlyphs(
  input: ThemeAssetManifestInput,
  resolution: ThemeResolution
): ThemeAssetManifestEntry {
  const candidates = scopedAssets(input.assets.glyphs, resolution)
    .filter(isHeaderGlyph)
    .sort((left, right) =>
      compareScopedCandidates(left, right, resolution, comparePaths)
    );
  const selected = candidates[0];

  return createEntry({
    role: "header-status-glyph-candidates",
    selected,
    candidates,
    kind: "glyph",
    confidence: selected ? 0.88 : 0.12,
    reason: selected
      ? `Found ${candidates.length} glyph/header candidate(s) for runtime status indicators.`
      : input.themeFamily.family === "baked-ui"
        ? "No glyph/header candidates were found; baked UI themes may already include status artwork in muxlaunch wall states."
        : "No glyph/header candidates were found, so status icons would need renderer fallbacks."
  });
}

function resolveFonts(
  input: ThemeAssetManifestInput,
  resolution: ThemeResolution
): ThemeAssetManifestEntry {
  const candidates = scopedAssets(input.assets.fonts, resolution)
    .sort((left, right) =>
      compareScopedCandidates(left, right, resolution, compareDefaultFirst)
    );
  const selected = candidates[0];

  return createEntry({
    role: "fonts",
    selected,
    candidates,
    kind: "font",
    confidence: selected ? (isNamed(selected, "default") ? 0.78 : 0.68) : 0.1,
    reason: selected
      ? "Theme font files were found; default.* is preferred when present, but font decoding is not implemented yet."
      : "No font assets were found for this resolution or shared root scope."
  });
}

function resolveSchemeFiles(
  input: ThemeAssetManifestInput,
  resolution: ThemeResolution
): ThemeAssetManifestEntry {
  const candidates = scopedSchemes(input.schemeFiles, resolution)
    .sort((left, right) =>
      compareScopedCandidates(left, right, resolution, compareSchemePriority)
    );
  const selected = candidates[0];

  return createEntry({
    role: "scheme-files",
    selected,
    candidates,
    kind: "scheme",
    confidence: selected
      ? selected.screenId?.toLowerCase() === "muxlaunch"
        ? 0.9
        : 0.72
      : 0.1,
    reason: selected
      ? "Screen-specific muxlaunch.ini is preferred as the representative scheme; shared and default schemes remain alternatives for layering/provenance."
      : "No scheme files were found for this resolution or shared root scope."
  });
}

function createEntry(options: {
  role: ThemeAssetManifestRole;
  selected?: Candidate;
  candidates: Candidate[];
  kind: ThemeAssetManifestFileKind;
  confidence: number;
  reason: string;
}): ThemeAssetManifestEntry {
  const selectedPath = options.selected?.relativePath;

  return {
    role: options.role,
    selectedFile: options.selected
      ? toManifestFile(options.selected, options.kind)
      : undefined,
    confidence: options.confidence,
    alternatives: options.candidates
      .filter((candidate) => candidate.relativePath !== selectedPath)
      .map((candidate) => toManifestFile(candidate, options.kind)),
    reason: options.reason
  };
}

function scopedAssets<T extends ThemeAsset>(
  assets: T[],
  resolution: ThemeResolution
): T[] {
  return assets.filter(
    (asset) => !asset.resolution || asset.resolution === resolution.name
  );
}

function scopedSchemes(
  schemes: ThemeSchemeFile[],
  resolution: ThemeResolution
): ThemeSchemeFile[] {
  return schemes.filter(
    (scheme) => !scheme.resolution || scheme.resolution === resolution.name
  );
}

function toManifestFile(
  candidate: Candidate,
  kind: ThemeAssetManifestFileKind
): ThemeAssetManifestFile {
  return {
    kind,
    relativePath: candidate.relativePath,
    fileName: candidate.fileName,
    size: candidate.size,
    resolution: candidate.resolution
  };
}

function compareScopedCandidates<T extends Candidate>(
  left: T,
  right: T,
  resolution: ThemeResolution,
  compareWithinScope: (left: T, right: T) => number
): number {
  return (
    Number(right.resolution === resolution.name) -
      Number(left.resolution === resolution.name) ||
    compareWithinScope(left, right) ||
    comparePaths(left, right)
  );
}

function compareWallpaperByFamily(
  left: ThemeAsset,
  right: ThemeAsset,
  family: ThemeFamily
): number {
  if (family === "baked-ui") {
    return (
      Number(isNamed(right, "default")) - Number(isNamed(left, "default")) ||
      Number(isNamed(right, "muxlaunch")) - Number(isNamed(left, "muxlaunch"))
    );
  }

  return (
    Number(isNamed(right, "muxlaunch")) - Number(isNamed(left, "muxlaunch")) ||
    Number(isNamed(right, "default")) - Number(isNamed(left, "default"))
  );
}

function compareExploreFirst(left: ThemeAsset, right: ThemeAsset): number {
  return Number(isNamed(right, "explore")) - Number(isNamed(left, "explore"));
}

function compareDefaultFirst(left: ThemeAsset, right: ThemeAsset): number {
  return Number(isNamed(right, "default")) - Number(isNamed(left, "default"));
}

function compareSchemePriority(
  left: ThemeSchemeFile,
  right: ThemeSchemeFile
): number {
  return schemeRank(left) - schemeRank(right);
}

function schemeRank(scheme: ThemeSchemeFile): number {
  const screenId = scheme.screenId?.toLowerCase();
  const fileName = scheme.fileName.toLowerCase();

  if (screenId === "muxlaunch") return 0;
  if (fileName === "default.ini") return 1;
  if (fileName === "global.ini") return 2;
  return 3;
}

function comparePaths(left: Candidate, right: Candidate): number {
  return left.relativePath.localeCompare(right.relativePath);
}

function isMuxlaunchBackground(asset: ThemeAsset): boolean {
  return /(?:^|\/)image\/wall\/(?:muxlaunch|default)\.[^/]+$/i.test(
    asset.relativePath
  );
}

function isFamilyMuxlaunchArtwork(
  asset: ThemeAsset,
  family: ThemeFamily
): boolean {
  switch (family) {
    case "baked-ui":
      return isMuxlaunchWallState(asset);
    case "static-composition":
      return isStaticMuxlaunchImage(asset);
    case "composited-grid":
      return isMuxlaunchGridImage(asset);
    case "scheme-only-partial":
    case "empty-unsupported":
      return (
        isMuxlaunchWallState(asset) ||
        isStaticMuxlaunchImage(asset) ||
        isMuxlaunchGridImage(asset)
      );
  }
}

function wallpaperConfidence(asset: ThemeAsset, family: ThemeFamily): number {
  if (family === "baked-ui" && isNamed(asset, "default")) {
    return 0.86;
  }

  return isNamed(asset, "muxlaunch") ? 0.92 : 0.84;
}

function primaryWallpaperReason(asset: ThemeAsset, family: ThemeFamily): string {
  if (family === "baked-ui") {
    return isNamed(asset, "default")
      ? "Baked UI themes prioritize default wallpaper as the background because muxlaunch wall-state assets are treated as screen content."
      : "No default wallpaper was available, so the screen-specific muxlaunch wallpaper is the best background candidate.";
  }

  return isNamed(asset, "muxlaunch")
    ? "Screen-specific image/wall/muxlaunch.* is preferred for muxlaunch background rendering."
    : "No screen-specific muxlaunch wallpaper was available, so image/wall/default.* is the best background candidate.";
}

function muxlaunchArtworkConfidence(family: ThemeFamily): number {
  switch (family) {
    case "baked-ui":
      return 0.98;
    case "static-composition":
      return 0.97;
    case "composited-grid":
      return 0.9;
    case "scheme-only-partial":
    case "empty-unsupported":
      return 0.5;
  }
}

function muxlaunchArtworkReason(asset: ThemeAsset, family: ThemeFamily): string {
  switch (family) {
    case "baked-ui":
      return `Selected ${asset.relativePath} because baked-ui themes use image/wall/muxlaunch/<item> as complete launcher states.`;
    case "static-composition":
      return `Selected ${asset.relativePath} because static-composition themes use image/static/muxlaunch/<item> as pre-composed launcher content.`;
    case "composited-grid":
      return `Selected ${asset.relativePath} because composited-grid themes use image/grid/muxlaunch assets as menu artwork.`;
    case "scheme-only-partial":
    case "empty-unsupported":
      return `Selected ${asset.relativePath} as a recognized muxlaunch artwork path despite the lower-confidence theme family.`;
  }
}

function missingMuxlaunchArtworkReason(family: ThemeFamily): string {
  switch (family) {
    case "baked-ui":
      return "No image/wall/muxlaunch/<item> baked launcher state was found.";
    case "static-composition":
      return "No image/static/muxlaunch/<item> static launcher composition was found.";
    case "composited-grid":
      return "No image/grid/muxlaunch menu artwork was found; glyph candidates are reported separately.";
    case "scheme-only-partial":
      return "This scheme-only theme has no visual muxlaunch artwork candidates.";
    case "empty-unsupported":
      return "No recognized muxlaunch artwork path was found for this unsupported structure.";
  }
}

function isStaticMuxlaunchImage(asset: ThemeAsset): boolean {
  return /(?:^|\/)image\/static\/muxlaunch\/[^/]+$/i.test(asset.relativePath);
}

function isMuxlaunchWallState(asset: ThemeAsset): boolean {
  return /(?:^|\/)image\/wall\/muxlaunch\/[^/]+$/i.test(asset.relativePath);
}

function isMuxlaunchGridImage(asset: ThemeAsset): boolean {
  return /(?:^|\/)image\/grid\/muxlaunch\/[^/]+$/i.test(asset.relativePath);
}

function isMenuGlyphCandidate(asset: ThemeAsset): boolean {
  return isMuxlaunchGlyph(asset) || LAUNCH_ITEM_NAMES.has(fileStem(asset));
}

function isMuxlaunchGlyph(asset: ThemeAsset): boolean {
  return /(?:^|\/)glyph\/muxlaunch\/[^/]+$/i.test(asset.relativePath);
}

function isHeaderGlyph(asset: ThemeAsset): boolean {
  return /(?:^|\/)glyph\/header\/[^/]+$/i.test(asset.relativePath);
}

function isNamed(asset: ThemeAsset, name: string): boolean {
  return fileStem(asset) === name;
}

function fileStem(asset: ThemeAsset): string {
  return asset.fileName
    .slice(0, -asset.extension.length)
    .toLocaleLowerCase();
}

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
