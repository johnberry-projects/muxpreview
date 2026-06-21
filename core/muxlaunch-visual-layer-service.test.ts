import { describe, expect, it } from "vitest";

import type {
  MuxlaunchRenderModel,
  ThemeInspectionResult,
  ThemeResolution
} from "./model";
import { resolveMuxlaunchVisualLayers } from "./muxlaunch-visual-layer-service";

describe("resolveMuxlaunchVisualLayers", () => {
  it("prefers a muxlaunch background and preserves embedded top-bar chrome", () => {
    const inspection = createInspection({
      images: [
      image("640x480/image/wall/default.png", "640x480"),
      image("640x480/image/wall/muxlaunch.png", "640x480"),
      image("640x480/image/wall/muxcharge.png", "640x480"),
      image("640x480/image/overlay.png", "640x480"),
      image("640x480/image/static/muxlaunch/explore.png", "640x480")
      ],
      glyphs: [image("640x480/glyph/header/network_active.png", "640x480")]
    });
    const resolution = inspection.resolutions[0];
    const model = resolveMuxlaunchVisualLayers(
      inspection,
      resolution,
      createRenderModel(true)
    );

    expect(model.backgroundAsset?.relativePath).toBe(
      "640x480/image/wall/muxlaunch.png"
    );
    expect(model.overlayEnabled).toBe(true);
    expect(model.contentMode).toBe("static");
    expect(model.contentAsset?.relativePath).toBe(
      "640x480/image/static/muxlaunch/explore.png"
    );
    expect(model.layers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "top-bar",
          state: "embedded",
          assetPaths: ["640x480/image/wall/muxlaunch.png"]
        }),
        expect.objectContaining({
          kind: "overlay",
          state: "rendered",
          assetPaths: ["640x480/image/overlay.png"]
        }),
        expect.objectContaining({
          kind: "content",
          assetPaths: ["640x480/image/static/muxlaunch/explore.png"]
        }),
        expect.objectContaining({
          kind: "status-bar",
          state: "rendered",
          assetPaths: ["640x480/glyph/header/network_active.png"]
        })
      ])
    );
  });

  it("does not use unrelated screen wallpapers as muxlaunch backgrounds", () => {
    const inspection = createInspection({
      images: [image("640x480/image/wall/muxcharge.png", "640x480")]
    });
    const model = resolveMuxlaunchVisualLayers(
      inspection,
      inspection.resolutions[0]
    );

    expect(model.backgroundAsset).toBeUndefined();
    expect(model.layers[0]).toMatchObject({
      kind: "background",
      state: "generated",
      assetPaths: []
    });
  });

  it("uses nested muxlaunch wall states as baked full compositions", () => {
    const inspection = createInspection({
      images: [
        image("640x480/image/wall/default.png", "640x480"),
        image("640x480/image/wall/muxlaunch/explore.png", "640x480")
      ],
      glyphs: [image("glyph/header/network_active.png", "640x480")]
    });
    const model = resolveMuxlaunchVisualLayers(
      inspection,
      inspection.resolutions[0]
    );

    expect(model.contentMode).toBe("baked");
    expect(model.contentAsset?.relativePath).toBe(
      "640x480/image/wall/muxlaunch/explore.png"
    );
    expect(model.layers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "status-bar",
          state: "suppressed"
        }),
        expect.objectContaining({
          kind: "content",
          state: "rendered",
          assetPaths: ["640x480/image/wall/muxlaunch/explore.png"]
        })
      ])
    );
  });
});

function createInspection({
  images,
  glyphs = []
}: {
  images: ThemeInspectionResult["assets"]["images"];
  glyphs?: ThemeInspectionResult["assets"]["glyphs"];
}): ThemeInspectionResult {
  const resolution: ThemeResolution = {
    name: "640x480",
    width: 640,
    height: 480,
    relativePath: "640x480",
    schemeFiles: [],
    assets: {
      fonts: [],
      glyphs,
      images,
      unknown: []
    },
    wallpapers: images.filter((asset) =>
      asset.relativePath.includes("/image/wall/")
    )
  };

  return {
    themePath: "C:/theme",
    themeName: "theme",
    resolutions: [resolution],
    schemeFiles: [],
    assets: {
      fonts: [],
      glyphs,
      images,
      unknown: []
    },
    themeFamily: {
      family: "composited-grid",
      confidence: 1,
      evidence: ["Synthetic test inspection."]
    },
    warnings: [],
    scannedFileCount: images.length + glyphs.length
  };
}

function image(relativePath: string, resolution: string) {
  const fileName = relativePath.split("/").at(-1) ?? relativePath;

  return {
    relativePath,
    fileName,
    extension: ".png",
    size: 1,
    resolution
  };
}

function createRenderModel(
  imageOverlayEnabled: boolean
): MuxlaunchRenderModel {
  return {
    screenName: "muxlaunch",
    sourceSchemePath: "640x480/scheme/muxlaunch.ini",
    resolution: "640x480",
    availableSections: [],
    layout: {},
    colors: {},
    alphas: {},
    visual: { imageOverlayEnabled },
    statusBar: {},
    fontValues: [],
    glyphReferences: [],
    mappedValues: [],
    unmappedValues: [],
    missingExpectedValues: []
  };
}
