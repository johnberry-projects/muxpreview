import { describe, expect, it } from "vitest";

import type { ThemeFamilyDetectionInput } from "./theme-family-detector";
import { detectThemeFamily } from "./theme-family-detector";

describe("detectThemeFamily", () => {
  it("reports an unrecognized asset structure as unsupported with low confidence", () => {
    const input: ThemeFamilyDetectionInput = {
      resolutions: [],
      schemeFiles: [],
      assets: {
        fonts: [],
        glyphs: [],
        images: [
          {
            relativePath: "custom/banner.png",
            fileName: "banner.png",
            extension: ".png",
            size: 1
          }
        ],
        unknown: []
      }
    };

    expect(detectThemeFamily(input)).toEqual({
      family: "empty-unsupported",
      confidence: 0.5,
      evidence: [
        "Theme assets exist, but no supported muxlaunch family structure was recognized."
      ]
    });
  });
});
