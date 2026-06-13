import type { ThemeAssetKind } from "../model";
import type { ScannedThemeFile } from "../scanner";

const RESOLUTION_PATTERN = /^(\d+)x(\d+)$/i;
const IMAGE_EXTENSIONS = new Set([".bmp", ".gif", ".jpeg", ".jpg", ".png"]);
const KNOWN_METADATA_FILES = new Set([
  "active.txt",
  "collect.html",
  "credits.txt",
  "name.txt",
  "readme.txt",
  "theme_name.txt",
  "version.txt"
]);
export interface ClassifiedThemePath {
  assetKind?: ThemeAssetKind;
  isKnownAuxiliary: boolean;
  isScheme: boolean;
  isWallpaper: boolean;
  resolution?: {
    name: string;
    width: number;
    height: number;
  };
  screenId?: string;
}

export function classifyThemePath(
  file: ScannedThemeFile
): ClassifiedThemePath {
  const segments = file.relativePath.split("/");
  const lowerSegments = segments.map((segment) => segment.toLowerCase());
  const resolution = findResolution(segments);
  const isScheme =
    file.extension === ".ini" && lowerSegments.includes("scheme");

  if (isScheme) {
    return {
      isKnownAuxiliary: false,
      isScheme: true,
      isWallpaper: false,
      resolution,
      screenId: file.fileName.slice(0, -file.extension.length)
    };
  }

  if (lowerSegments.includes("font")) {
    return {
      assetKind: "font",
      isKnownAuxiliary: false,
      isScheme: false,
      isWallpaper: false,
      resolution
    };
  }

  if (lowerSegments.includes("glyph") && IMAGE_EXTENSIONS.has(file.extension)) {
    return {
      assetKind: "glyph",
      isKnownAuxiliary: false,
      isScheme: false,
      isWallpaper: false,
      resolution
    };
  }

  if (IMAGE_EXTENSIONS.has(file.extension)) {
    return {
      assetKind: "image",
      isKnownAuxiliary: false,
      isScheme: false,
      isWallpaper:
        lowerSegments.includes("image") && lowerSegments.includes("wall"),
      resolution
    };
  }

  return {
    assetKind: isKnownFile(file, lowerSegments) ? undefined : "unknown",
    isKnownAuxiliary: isKnownFile(file, lowerSegments),
    isScheme: false,
    isWallpaper: false,
    resolution
  };
}

function findResolution(
  segments: string[]
): ClassifiedThemePath["resolution"] {
  for (const segment of segments) {
    const match = RESOLUTION_PATTERN.exec(segment);

    if (match) {
      return {
        name: segment,
        width: Number(match[1]),
        height: Number(match[2])
      };
    }
  }

  return undefined;
}

function isKnownFile(
  file: ScannedThemeFile,
  lowerSegments: string[]
): boolean {
  const lowerName = file.fileName.toLowerCase();

  return (
    KNOWN_METADATA_FILES.has(lowerName) ||
    lowerName.startsWith("read me") ||
    (lowerSegments.includes("sound") && file.extension === ".wav") ||
    (lowerSegments.includes("rgb") && file.extension === ".sh") ||
    (lowerSegments.includes("alternate") &&
      [".ini", ".json", ".muxalt", ".sh"].includes(file.extension))
  );
}
