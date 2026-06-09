import type {
  ThemeAsset,
  ThemeAssetGroup,
  ThemeInspectionResult,
  ThemeResolution,
  ThemeSchemeFile
} from "../model";
import { classifyThemePath } from "../parser";
import { createInspectionWarnings } from "../validation";
import type { ThemeFileScanner } from "./theme-file-scanner";

export class ThemeInspectionService {
  constructor(private readonly scanner: ThemeFileScanner) {}

  async inspect(themePath: string): Promise<ThemeInspectionResult> {
    const scan = await this.scanner.scan(themePath);
    const assets = createEmptyAssetGroup();
    const schemeFiles: ThemeSchemeFile[] = [];
    const resolutions = new Map<string, ThemeResolution>();

    for (const file of scan.files) {
      const classification = classifyThemePath(file);
      const resolution = classification.resolution
        ? getOrCreateResolution(resolutions, classification.resolution)
        : undefined;

      if (classification.isScheme) {
        const schemeFile: ThemeSchemeFile = {
          relativePath: file.relativePath,
          fileName: file.fileName,
          size: file.size,
          resolution: classification.resolution?.name,
          screenId: classification.screenId
        };

        schemeFiles.push(schemeFile);
        resolution?.schemeFiles.push(schemeFile);
        continue;
      }

      if (!classification.assetKind) {
        continue;
      }

      const asset: ThemeAsset = {
        relativePath: file.relativePath,
        fileName: file.fileName,
        extension: file.extension,
        size: file.size,
        resolution: classification.resolution?.name
      };

      assets[assetGroupKey(classification.assetKind)].push(asset);
      resolution?.assets[assetGroupKey(classification.assetKind)].push(asset);
    }

    const sortedResolutions = [...resolutions.values()].sort(compareResolutions);
    const warnings = createInspectionWarnings(
      sortedResolutions,
      schemeFiles,
      assets
    );

    return {
      themePath: scan.rootPath,
      themeName: scan.rootName,
      resolutions: sortedResolutions,
      schemeFiles,
      assets,
      warnings,
      scannedFileCount: scan.files.length
    };
  }
}

function createEmptyAssetGroup(): ThemeAssetGroup {
  return {
    fonts: [],
    glyphs: [],
    images: [],
    unknown: []
  };
}

function getOrCreateResolution(
  resolutions: Map<string, ThemeResolution>,
  resolution: { name: string; width: number; height: number }
): ThemeResolution {
  const existing = resolutions.get(resolution.name);

  if (existing) {
    return existing;
  }

  const created: ThemeResolution = {
    ...resolution,
    relativePath: resolution.name,
    schemeFiles: [],
    assets: createEmptyAssetGroup()
  };

  resolutions.set(resolution.name, created);
  return created;
}

function assetGroupKey(
  kind: "font" | "glyph" | "image" | "unknown"
): keyof ThemeAssetGroup {
  switch (kind) {
    case "font":
      return "fonts";
    case "glyph":
      return "glyphs";
    case "image":
      return "images";
    case "unknown":
      return "unknown";
  }
}

function compareResolutions(
  left: ThemeResolution,
  right: ThemeResolution
): number {
  return left.width - right.width || left.height - right.height;
}
