import path from "node:path";

import { describe, expect, it } from "vitest";

import type { ThemeInspectionResult } from "../core/model";
import type { MuxlaunchPreviewModel } from "../core/preview";
import { ThemeInspectionProvider } from "./theme-inspection-provider";

const FIXTURE_ROOT = path.resolve(process.cwd(), "fixtures", "themes");

interface FixtureExpectation {
  cellRadius?: number;
  contentAsset?: string;
  contentMode?: MuxlaunchPreviewModel["content"]["mode"];
  diagnosticsExpected: boolean;
  family: string;
  focusBackground?: string;
  menuEntriesExpected: boolean;
  modelExpected: boolean;
  resolution?: string;
  wallpaper?: string;
}

const FIXTURES: FixtureExpectation[] = [
  {
    contentAsset: "640x480/image/wall/muxlaunch/explore.png",
    contentMode: "baked",
    diagnosticsExpected: false,
    family: "baked-ui",
    menuEntriesExpected: true,
    modelExpected: true,
    resolution: "640x480",
    wallpaper: "640x480/image/wall/default.png"
  },
  {
    contentAsset: "image/grid/muxlaunch/explore.png",
    contentMode: "grid",
    cellRadius: 16,
    diagnosticsExpected: true,
    family: "composited-grid",
    focusBackground: "#05A3E6ff",
    menuEntriesExpected: true,
    modelExpected: true,
    resolution: "640x480",
    wallpaper: "640x480/image/wall/muxlaunch.png"
  },
  {
    diagnosticsExpected: true,
    family: "empty-unsupported",
    menuEntriesExpected: false,
    modelExpected: false
  },
  {
    contentMode: "grid",
    diagnosticsExpected: true,
    family: "scheme-only-partial",
    menuEntriesExpected: true,
    modelExpected: true,
    resolution: "640x480"
  },
  {
    contentAsset: "640x480/image/static/muxlaunch/explore.png",
    contentMode: "static",
    diagnosticsExpected: false,
    family: "static-composition",
    menuEntriesExpected: true,
    modelExpected: true,
    resolution: "640x480",
    wallpaper: "640x480/image/wall/default.png"
  }
];

describe("PreviewModel regression harness", () => {
  it.each(FIXTURES)(
    "validates PreviewModel generation for $family",
    async (expected) => {
      const provider = createProvider(expected.family);
      const inspection = await provider.getInspection();
      const resolution = inspection.resolutions[0];
      const model = resolution
        ? await provider.getMuxlaunchPreviewModel(resolution.name)
        : undefined;

      assertResolutionOrDiagnostic(inspection, expected);

      if (!expected.modelExpected) {
        expect(model).toBeUndefined();
        expect(inspection.warnings.map((warning) => warning.code)).toContain(
          "missing-resolutions"
        );
        return;
      }

      expect(model).toBeDefined();
      if (!model) return;

      expect(model.generatedFrom).toBe("preview-model-builder");
      expect(model.screen).toBe("muxlaunch");
      expect(model.resolution.name).toBe(expected.resolution);
      expect(model.content.mode).toBe(expected.contentMode);
      expect(model.content.asset?.relativePath).toBe(expected.contentAsset);

      assertWallpaperOrDiagnostic(model, expected);
      assertMenuEntries(model, expected);
      assertDiagnostics(model, expected);
      assertExpectedStyleRules(model, expected);
      assertStableModelShape(model);
    }
  );

  it("matches the structured PreviewModel fixture summary", async () => {
    const summary = await Promise.all(
      FIXTURES.map(async (fixture) => {
        const provider = createProvider(fixture.family);
        const inspection = await provider.getInspection();
        const resolution = inspection.resolutions[0];
        const model = resolution
          ? await provider.getMuxlaunchPreviewModel(resolution.name)
          : undefined;

        return summarizeFixture(inspection, model);
      })
    );

    expect(summary).toMatchInlineSnapshot(`
      [
        {
          "content": "baked:640x480/image/wall/muxlaunch/explore.png",
          "diagnostics": [],
          "family": "baked-ui",
          "firstEntry": {
            "artwork": undefined,
            "compositionAsset": "640x480/image/wall/muxlaunch/explore.png",
            "label": "Explore",
          },
          "menuEntries": 8,
          "model": true,
          "resolution": "640x480",
          "style": {
            "cellRadius": 20,
            "focusBackground": "#F3BD3Ddc",
          },
          "wallpaper": "640x480/image/wall/default.png",
          "warnings": [
            "missing-glyphs",
          ],
        },
        {
          "content": "grid:image/grid/muxlaunch/explore.png",
          "diagnostics": [
            "640x480:compatibility:missing-default-scheme",
            "640x480:compatibility:missing-header-glyphs",
            "640x480:compatibility:shared-root-launcher-assets",
          ],
          "family": "composited-grid",
          "firstEntry": {
            "artwork": "image/grid/muxlaunch/explore.png",
            "compositionAsset": undefined,
            "label": "Explore",
          },
          "menuEntries": 8,
          "model": true,
          "resolution": "640x480",
          "style": {
            "cellRadius": 16,
            "focusBackground": "#05A3E6ff",
          },
          "wallpaper": "640x480/image/wall/muxlaunch.png",
          "warnings": [],
        },
        {
          "diagnostics": [],
          "family": "empty-unsupported",
          "model": false,
          "resolution": undefined,
          "warnings": [
            "missing-resolutions",
            "missing-schemes",
            "missing-fonts",
            "missing-glyphs",
            "missing-images",
          ],
        },
        {
          "content": "grid:none",
          "diagnostics": [
            "640x480:compatibility:missing-launcher-wallpaper",
            "640x480:compatibility:missing-launcher-content",
            "640x480:compatibility:missing-header-glyphs",
            "640x480:compatibility:missing-fonts",
          ],
          "family": "scheme-only-partial",
          "firstEntry": {
            "artwork": undefined,
            "compositionAsset": undefined,
            "label": "Explore",
          },
          "menuEntries": 8,
          "model": true,
          "resolution": "640x480",
          "style": {
            "cellRadius": undefined,
            "focusBackground": "#F3BD3Ddc",
          },
          "wallpaper": undefined,
          "warnings": [
            "missing-fonts",
            "missing-glyphs",
            "missing-images",
          ],
        },
        {
          "content": "static:640x480/image/static/muxlaunch/explore.png",
          "diagnostics": [],
          "family": "static-composition",
          "firstEntry": {
            "artwork": undefined,
            "compositionAsset": "640x480/image/static/muxlaunch/explore.png",
            "label": "Explore",
          },
          "menuEntries": 8,
          "model": true,
          "resolution": "640x480",
          "style": {
            "cellRadius": 12,
            "focusBackground": "#F3BD3Ddc",
          },
          "wallpaper": "640x480/image/wall/default.png",
          "warnings": [],
        },
      ]
    `);
  });
});

function createProvider(family: string): ThemeInspectionProvider {
  return new ThemeInspectionProvider(path.join(FIXTURE_ROOT, family));
}

function assertResolutionOrDiagnostic(
  inspection: ThemeInspectionResult,
  expected: FixtureExpectation
): void {
  if (expected.resolution) {
    expect(inspection.resolutions.map((resolution) => resolution.name)).toContain(
      expected.resolution
    );
    return;
  }

  expect(inspection.resolutions).toHaveLength(0);
  expect(inspection.warnings.map((warning) => warning.code)).toContain(
    "missing-resolutions"
  );
}

function assertWallpaperOrDiagnostic(
  model: MuxlaunchPreviewModel,
  expected: FixtureExpectation
): void {
  expect(model.wallpaper.asset?.relativePath).toBe(expected.wallpaper);
  expect(model.wallpaper.reason.length).toBeGreaterThan(0);

  if (!expected.wallpaper) {
    expect(model.diagnostics.map((diagnostic) => diagnostic.id)).toContain(
      `${model.resolution.name}:compatibility:missing-launcher-wallpaper`
    );
  }
}

function assertMenuEntries(
  model: MuxlaunchPreviewModel,
  expected: FixtureExpectation
): void {
  if (!expected.menuEntriesExpected) {
    expect(model.menu.entries).toHaveLength(0);
    return;
  }

  expect(model.menu.entries).toHaveLength(8);
  expect(model.menu.entries[0]).toMatchObject({
    label: "Explore",
    aliases: ["explore"]
  });
}

function assertDiagnostics(
  model: MuxlaunchPreviewModel,
  expected: FixtureExpectation
): void {
  if (expected.diagnosticsExpected) {
    expect(model.diagnostics.length).toBeGreaterThan(0);
    return;
  }

  expect(model.diagnostics).toEqual([]);
}

function assertExpectedStyleRules(
  model: MuxlaunchPreviewModel,
  expected: FixtureExpectation
): void {
  if (expected.focusBackground) {
    expect(model.menu.focus.background).toBe(expected.focusBackground);
  }

  if (expected.cellRadius !== undefined) {
    expect(model.menu.focus.borderRadius).toBe(expected.cellRadius);
    expect(model.menu.item.borderRadius).toBe(expected.cellRadius);
  }
}

function assertStableModelShape(model: MuxlaunchPreviewModel): void {
  expect(model.menu.layout.columns).toBeGreaterThan(0);
  expect(model.menu.layout.rows).toBeGreaterThan(0);
  expect(model.menu.item.background).toMatch(/^#/);
  expect(model.menu.focus.background).toMatch(/^#/);
  expect(model.statusBar.title).toBe("Main Menu");
  expect(model.statusBar.icons.network.label).toBe("Wi-Fi");
  expect(model.statusBar.icons.battery.label).toBe("Battery");
  expect(model.overlay.reason.length).toBeGreaterThan(0);
}

function summarizeFixture(
  inspection: ThemeInspectionResult,
  model: MuxlaunchPreviewModel | undefined
) {
  if (!model) {
    return {
      diagnostics: [],
      family: inspection.themeFamily.family,
      model: false,
      resolution: undefined,
      warnings: inspection.warnings.map((warning) => warning.code)
    };
  }

  const firstEntry = model.menu.entries[0];

  return {
    content: `${model.content.mode}:${model.content.asset?.relativePath ?? "none"}`,
    diagnostics: model.diagnostics.map((diagnostic) => diagnostic.id),
    family: inspection.themeFamily.family,
    firstEntry: firstEntry
      ? {
          artwork: firstEntry.artwork?.relativePath,
          compositionAsset: firstEntry.compositionAsset?.relativePath,
          label: firstEntry.label
        }
      : undefined,
    menuEntries: model.menu.entries.length,
    model: true,
    resolution: model.resolution.name,
    style: {
      cellRadius: model.menu.focus.borderRadius,
      focusBackground: model.menu.focus.background
    },
    warnings: inspection.warnings.map((warning) => warning.code),
    wallpaper: model.wallpaper.asset?.relativePath
  };
}
