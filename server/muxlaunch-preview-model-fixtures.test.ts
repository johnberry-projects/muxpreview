import path from "node:path";

import { describe, expect, it } from "vitest";

import { ThemeInspectionProvider } from "./theme-inspection-provider";

const FIXTURE_ROOT = path.resolve(process.cwd(), "fixtures", "themes");

describe("muxlaunch preview model fixtures", () => {
  it.each([
    {
      family: "baked-ui",
      contentMode: "baked",
      wallpaper: "640x480/image/wall/default.png",
      contentAsset: "640x480/image/wall/muxlaunch/explore.png",
      firstArtwork: undefined,
      firstComposition: "640x480/image/wall/muxlaunch/explore.png",
      statusVisible: false
    },
    {
      family: "composited-grid",
      contentMode: "grid",
      wallpaper: "640x480/image/wall/muxlaunch.png",
      contentAsset: "image/grid/muxlaunch/explore.png",
      firstArtwork: "image/grid/muxlaunch/explore.png",
      firstComposition: undefined,
      statusVisible: true
    },
    {
      family: "static-composition",
      contentMode: "static",
      wallpaper: "640x480/image/wall/default.png",
      contentAsset: "640x480/image/static/muxlaunch/explore.png",
      firstArtwork: undefined,
      firstComposition: "640x480/image/static/muxlaunch/explore.png",
      statusVisible: true
    },
    {
      family: "scheme-only-partial",
      contentMode: "grid",
      wallpaper: undefined,
      contentAsset: undefined,
      firstArtwork: undefined,
      firstComposition: undefined,
      statusVisible: true
    }
  ])("builds a resolved PreviewModel for $family", async (expected) => {
    const provider = new ThemeInspectionProvider(
      path.join(FIXTURE_ROOT, expected.family)
    );
    const model = await provider.getMuxlaunchPreviewModel("640x480");

    expect(model).toBeDefined();
    if (!model) return;

    expect(model.generatedFrom).toBe("preview-model-builder");
    expect(model.screen).toBe("muxlaunch");
    expect(model.resolution).toMatchObject({
      name: "640x480",
      width: 640,
      height: 480
    });
    expect(model.content.mode).toBe(expected.contentMode);
    expect(model.wallpaper.asset?.relativePath).toBe(expected.wallpaper);
    expect(model.content.asset?.relativePath).toBe(expected.contentAsset);
    expect(model.menu.entries).toHaveLength(8);
    expect(model.menu.entries[0]).toMatchObject({
      label: "Explore",
      aliases: ["explore"]
    });
    expect(model.menu.entries[0]?.artwork?.relativePath).toBe(
      expected.firstArtwork
    );
    expect(model.menu.entries[0]?.compositionAsset?.relativePath).toBe(
      expected.firstComposition
    );
    expect(model.statusBar.visible).toBe(expected.statusVisible);
    expect(model.menu.layout.columns).toBeGreaterThan(0);
    expect(model.menu.item.background).toMatch(/^#/);
  });

  it("returns no model for unsupported fixtures without resolutions", async () => {
    const provider = new ThemeInspectionProvider(
      path.join(FIXTURE_ROOT, "empty-unsupported")
    );

    await expect(
      provider.getMuxlaunchPreviewModel("640x480")
    ).resolves.toBeUndefined();
  });
});
