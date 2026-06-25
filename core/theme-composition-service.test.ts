import { describe, expect, it } from "vitest";

import type {
  ThemeAsset,
  ThemeInspectionResult,
  ThemeResolution,
  ThemeSchemeFile
} from "./model";
import { analyzeThemeComposition } from "./theme-composition-service";
import {
  buildThemeAssetManifest,
  type ThemeAssetManifestInput
} from "./theme-asset-manifest-builder";

describe("analyzeThemeComposition compatibility warnings", () => {
  it("explains a scheme-only theme instead of assuming assets exist", () => {
    const inspection = createInspection({
      schemes: [scheme("640x480/scheme/muxlaunch.ini", "muxlaunch")]
    });
    const report = analyzeThemeComposition(inspection).resolutions[0];
    const warningIds = report.compatibilityWarnings.map((warning) =>
      warning.id.split(":").at(-1)
    );

    expect(warningIds).toEqual(
      expect.arrayContaining([
        "missing-default-scheme",
        "missing-launcher-wallpaper",
        "missing-launcher-content",
        "missing-header-glyphs",
        "missing-fonts"
      ])
    );
  });

  it("accepts baked wall states without requiring separate glyphs", () => {
    const inspection = createInspection({
      images: [
        asset("640x480/image/wall/default.png", "640x480"),
        asset("640x480/image/wall/muxlaunch/explore.png", "640x480")
      ],
      fonts: [asset("font/default.bin")],
      schemes: [
        scheme("640x480/scheme/default.ini", "default"),
        scheme("640x480/scheme/muxlaunch.ini", "muxlaunch")
      ]
    });
    const report = analyzeThemeComposition(inspection).resolutions[0];

    expect(report.compatibilityWarnings).toEqual([]);
    expect(report.bakedUiElements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetType: "static-composition",
          sourceFile: "640x480/image/wall/muxlaunch/explore.png"
        })
      ])
    );
  });
});

function createInspection({
  fonts = [],
  images = [],
  schemes = []
}: {
  fonts?: ThemeAsset[];
  images?: ThemeAsset[];
  schemes?: ThemeSchemeFile[];
}): ThemeInspectionResult {
  const resolution: ThemeResolution = {
    name: "640x480",
    width: 640,
    height: 480,
    relativePath: "640x480",
    schemeFiles: schemes,
    assets: { fonts: [], glyphs: [], images, unknown: [] },
    wallpapers: images.filter((image) => image.relativePath.includes("/wall/"))
  };

  const inspectionBase: ThemeAssetManifestInput = {
    themePath: "C:/theme",
    themeName: "theme",
    resolutions: [resolution],
    schemeFiles: schemes,
    assets: { fonts, glyphs: [], images, unknown: [] },
    themeFamily: {
      family: "scheme-only-partial",
      confidence: 1,
      evidence: ["Synthetic test inspection."]
    }
  };

  return {
    ...inspectionBase,
    assetManifest: buildThemeAssetManifest(inspectionBase),
    warnings: [],
    scannedFileCount: fonts.length + images.length + schemes.length
  };
}

function asset(relativePath: string, resolution?: string): ThemeAsset {
  const fileName = relativePath.split("/").at(-1) ?? relativePath;
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").at(-1)}`
    : "";

  return { relativePath, fileName, extension, size: 1, resolution };
}

function scheme(relativePath: string, screenId: string): ThemeSchemeFile {
  return {
    relativePath,
    fileName: `${screenId}.ini`,
    size: 1,
    resolution: "640x480",
    screenId
  };
}
