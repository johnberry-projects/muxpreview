import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type {
  ThemeAssetManifestEntry,
  ThemeAssetManifestRole,
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
      detectedFamily: "baked-ui",
      confidence: 0.98,
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
      detectedFamily: "composited-grid",
      confidence: 0.96,
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
      detectedFamily: "static-composition",
      confidence: 0.97,
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
      detectedFamily: "scheme-only-partial",
      confidence: 0.9,
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
      detectedFamily: "empty-unsupported",
      confidence: 1,
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
    expect(inspection.themeFamily).toMatchObject({
      family: expected.detectedFamily,
      confidence: expected.confidence
    });
    expect(inspection.themeFamily.evidence.length).toBeGreaterThan(0);
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

  it.each([
    {
      family: "baked-ui",
      selected: {
        "primary-wallpaper": "640x480/image/wall/default.png",
        "muxlaunch-artwork": "640x480/image/wall/muxlaunch/explore.png",
        "menu-glyph-candidates": undefined,
        "header-status-glyph-candidates": undefined,
        fonts: "font/default.bin",
        "scheme-files": "640x480/scheme/muxlaunch.ini"
      }
    },
    {
      family: "composited-grid",
      selected: {
        "primary-wallpaper": "640x480/image/wall/muxlaunch.png",
        "muxlaunch-artwork": "image/grid/muxlaunch/explore.png",
        "menu-glyph-candidates": "glyph/muxlaunch/explore.png",
        "header-status-glyph-candidates": undefined,
        fonts: "font/default.bin",
        "scheme-files": "640x480/scheme/muxlaunch.ini"
      }
    },
    {
      family: "static-composition",
      selected: {
        "primary-wallpaper": "640x480/image/wall/default.png",
        "muxlaunch-artwork": "640x480/image/static/muxlaunch/explore.png",
        "menu-glyph-candidates": undefined,
        "header-status-glyph-candidates": "glyph/header/network_active.png",
        fonts: "font/default.bin",
        "scheme-files": "640x480/scheme/muxlaunch.ini"
      }
    },
    {
      family: "scheme-only-partial",
      selected: {
        "primary-wallpaper": undefined,
        "muxlaunch-artwork": undefined,
        "menu-glyph-candidates": undefined,
        "header-status-glyph-candidates": undefined,
        fonts: undefined,
        "scheme-files": "640x480/scheme/muxlaunch.ini"
      }
    }
  ])("resolves asset manifest roles for $family", async (expected) => {
    const inspection = await inspectFixture(expected.family);
    const manifest = inspection.assetManifest.resolutions[0];

    expect(inspection.assetManifest).toMatchObject({
      themeName: expected.family,
      generatedFrom: "theme-inspection",
      family: { family: inspection.themeFamily.family }
    });
    expect(manifest?.resolution).toBe("640x480");

    for (const [role, selectedPath] of Object.entries(expected.selected)) {
      const entry = findManifestEntry(
        inspection,
        role as ThemeAssetManifestRole
      );

      expect(entry.selectedFile?.relativePath).toBe(selectedPath);
      expect(entry.confidence).toBeGreaterThan(0);
      expect(entry.reason.length).toBeGreaterThan(0);
    }
  });

  it("keeps shared manifest candidates as alternatives", async () => {
    const inspection = await inspectFixture("composited-grid");
    const schemeEntry = findManifestEntry(inspection, "scheme-files");

    expect(schemeEntry.alternatives.map((file) => file.relativePath)).toContain(
      "scheme/global.ini"
    );
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

function findManifestEntry(
  inspection: ThemeInspectionResult,
  role: ThemeAssetManifestRole
): ThemeAssetManifestEntry {
  const entry = inspection.assetManifest.resolutions[0]?.entries.find(
    (candidate) => candidate.role === role
  );

  expect(entry).toBeDefined();

  return entry as ThemeAssetManifestEntry;
}
