import type { ThemeAsset } from "../../core/model";

export interface MuxlaunchPreviewItem {
  aliases: string[];
  asset?: ThemeAsset;
  assetKind?: "glyph" | "image";
  label: string;
}

const LAUNCH_ITEMS: Array<
  Pick<MuxlaunchPreviewItem, "aliases" | "label">
> = [
  { label: "Explore", aliases: ["explore"] },
  {
    label: "Favourites",
    aliases: ["collection", "favourites", "favorites"],
  },
  { label: "Applications", aliases: ["apps", "applications", "app"] },
  { label: "Configuration", aliases: ["config", "configuration", "settings"] },
  { label: "History", aliases: ["history"] },
  { label: "Information", aliases: ["info", "information"] },
  { label: "Reboot", aliases: ["reboot"] },
  { label: "Shutdown", aliases: ["shutdown"] },
];

export function selectMuxlaunchItems(
  glyphs: ThemeAsset[],
  images: ThemeAsset[],
  resolutionName: string,
  limit = LAUNCH_ITEMS.length,
): MuxlaunchPreviewItem[] {
  const launcherImages = sortAssets(
    images.filter((asset) =>
      asset.relativePath.toLowerCase().includes("image/grid/muxlaunch/"),
    ),
    resolutionName,
  );
  const launcherGlyphs = sortAssets(
    glyphs.filter((asset) =>
      asset.relativePath.toLowerCase().includes("glyph/muxlaunch/"),
    ),
    resolutionName,
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
      asset,
      assetKind: image ? "image" : glyph ? "glyph" : undefined,
    };
  });
}

export function muxlaunchAssetUrl(
  item: MuxlaunchPreviewItem,
): string | undefined {
  if (!item.asset || !item.assetKind) {
    return undefined;
  }

  const endpoint =
    item.assetKind === "image" ? "/api/theme-image" : "/api/theme-glyph";
  return `${endpoint}?path=${encodeURIComponent(item.asset.relativePath)}`;
}

function findAsset(
  assets: ThemeAsset[],
  aliases: string[],
  usedPaths: Set<string>,
): ThemeAsset | undefined {
  return assets.find(
    (asset) =>
      !usedPaths.has(asset.relativePath) &&
      aliases.includes(fileStem(asset)),
  );
}

function findUnusedAsset(
  assets: ThemeAsset[],
  usedPaths: Set<string>,
): ThemeAsset | undefined {
  return assets.find((asset) => !usedPaths.has(asset.relativePath));
}

function sortAssets(
  assets: ThemeAsset[],
  resolutionName: string,
): ThemeAsset[] {
  return assets
    .filter(
      (asset) => !asset.resolution || asset.resolution === resolutionName,
    )
    .sort((left, right) => {
      const resolutionPriority =
        Number(right.resolution === resolutionName) -
        Number(left.resolution === resolutionName);

      return (
        resolutionPriority ||
        left.relativePath.localeCompare(right.relativePath)
      );
    });
}

function fileStem(asset: ThemeAsset): string {
  return asset.fileName
    .slice(0, -asset.extension.length)
    .toLocaleLowerCase();
}
