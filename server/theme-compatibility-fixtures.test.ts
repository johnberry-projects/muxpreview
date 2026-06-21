import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type {
  ThemeInspectionResult,
  ThemeInspectionWarningCode
} from "../core/model";
import { parseThemeScheme, ThemeInspectionService } from "../core";
import { NodeThemeScanner } from "./node-theme-scanner";

const FIXTURE_ROOT = path.resolve(process.cwd(), "fixtures", "themes");

describe("theme compatibility fixtures", () => {
  it.each([
    {
      family: "baked-ui",
      scannedFileCount: 5,
      resolutions: ["640x480"],
      schemes: ["default.ini", "muxlaunch.ini"],
      wallpaperCount: 2,
      selectedWallpaper: "default.png",
      imageCount: 2,
      glyphCount: 0,
      fontCount: 1,
      warnings: ["missing-glyphs"]
    },
    {
      family: "composited-grid",
      scannedFileCount: 6,
      resolutions: ["640x480"],
      schemes: ["global.ini", "muxlaunch.ini"],
      wallpaperCount: 1,
      selectedWallpaper: "muxlaunch.png",
      imageCount: 2,
      glyphCount: 1,
      fontCount: 1,
      warnings: []
    },
    {
      family: "static-composition",
      scannedFileCount: 6,
      resolutions: ["640x480"],
      schemes: ["default.ini", "muxlaunch.ini"],
      wallpaperCount: 1,
      selectedWallpaper: "default.png",
      imageCount: 2,
      glyphCount: 1,
      fontCount: 1,
      warnings: []
    },
    {
      family: "scheme-only-partial",
      scannedFileCount: 2,
      resolutions: ["640x480"],
      schemes: ["default.ini", "muxlaunch.ini"],
      wallpaperCount: 0,
      selectedWallpaper: undefined,
      imageCount: 0,
      glyphCount: 0,
      fontCount: 0,
      warnings: ["missing-fonts", "missing-glyphs", "missing-images"]
    },
    {
      family: "empty-unsupported",
      scannedFileCount: 1,
      resolutions: [],
      schemes: [],
      wallpaperCount: 0,
      selectedWallpaper: undefined,
      imageCount: 0,
      glyphCount: 0,
      fontCount: 0,
      warnings: [
        "missing-resolutions",
        "missing-schemes",
        "missing-fonts",
        "missing-glyphs",
        "missing-images"
      ]
    }
  ])("inspects the $family fixture", async (expected) => {
    const inspection = await inspectFixture(expected.family);
    const resolution = inspection.resolutions[0];

    expect(inspection.themeName).toBe(expected.family);
    expect(inspection.scannedFileCount).toBe(expected.scannedFileCount);
    expect(inspection.resolutions.map((candidate) => candidate.name)).toEqual(
      expected.resolutions
    );
    expect(
      inspection.schemeFiles.map((scheme) => scheme.fileName).sort()
    ).toEqual([...expected.schemes].sort());
    expect(resolution?.wallpapers ?? []).toHaveLength(expected.wallpaperCount);
    expect(resolution?.wallpaper?.fileName).toBe(expected.selectedWallpaper);
    expect(inspection.assets.images).toHaveLength(expected.imageCount);
    expect(inspection.assets.glyphs).toHaveLength(expected.glyphCount);
    expect(inspection.assets.fonts).toHaveLength(expected.fontCount);
    expect(inspection.assets.unknown).toEqual([]);
    expect(warningCodes(inspection)).toEqual(expected.warnings);
  });

  it("keeps shared scheme and launcher assets unscoped by resolution", async () => {
    const inspection = await inspectFixture("composited-grid");
    const globalScheme = inspection.schemeFiles.find(
      (scheme) => scheme.fileName === "global.ini"
    );
    const gridImage = inspection.assets.images.find(
      (asset) => asset.relativePath === "image/grid/muxlaunch/explore.png"
    );
    const menuGlyph = inspection.assets.glyphs.find(
      (asset) => asset.relativePath === "glyph/muxlaunch/explore.png"
    );

    expect(globalScheme?.resolution).toBeUndefined();
    expect(gridImage?.resolution).toBeUndefined();
    expect(menuGlyph?.resolution).toBeUndefined();
    expect(inspection.resolutions[0]?.schemeFiles.map((scheme) => scheme.fileName))
      .toEqual(["muxlaunch.ini"]);
  });

  it("preserves representative shared focus and radius scheme keys", async () => {
    const inspection = await inspectFixture("composited-grid");
    const globalScheme = inspection.schemeFiles.find(
      (scheme) => scheme.fileName === "global.ini"
    );

    expect(globalScheme).toBeDefined();
    if (!globalScheme) return;

    const content = await readFile(
      path.join(FIXTURE_ROOT, "composited-grid", globalScheme.relativePath),
      "utf8"
    );
    const parsed = parseThemeScheme(content, globalScheme);
    const gridEntries = parsed.sections.find(
      (section) => section.name === "grid"
    )?.entries;

    expect(gridEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "CELL_RADIUS", value: "16" }),
        expect.objectContaining({
          key: "CELL_FOCUS_BACKGROUND",
          value: "05A3E6"
        })
      ])
    );
  });
});

async function inspectFixture(family: string): Promise<ThemeInspectionResult> {
  return new ThemeInspectionService(new NodeThemeScanner()).inspect(
    path.join(FIXTURE_ROOT, family)
  );
}

function warningCodes(
  inspection: ThemeInspectionResult
): ThemeInspectionWarningCode[] {
  return inspection.warnings.map((warning) => warning.code);
}
