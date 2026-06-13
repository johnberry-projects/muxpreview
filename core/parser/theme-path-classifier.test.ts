import { describe, expect, it } from "vitest";
import { classifyThemePath } from "./theme-path-classifier";

describe("classifyThemePath", () => {
  it("detects resolution scheme files", () => {
    const result = classifyThemePath({
      relativePath: "640x480/scheme/muxlaunch.ini",
      fileName: "muxlaunch.ini",
      extension: ".ini",
      size: 42
    });

    expect(result.isScheme).toBe(true);
    expect(result.screenId).toBe("muxlaunch");
    expect(result.resolution).toEqual({
      name: "640x480",
      width: 640,
      height: 480
    });
  });

  it("keeps unclassified files visible", () => {
    const result = classifyThemePath({
      relativePath: "custom/data.bin",
      fileName: "data.bin",
      extension: ".bin",
      size: 42
    });

    expect(result.assetKind).toBe("unknown");
  });

  it("detects resolution wallpaper images", () => {
    const result = classifyThemePath({
      relativePath: "640x480/image/wall/default.png",
      fileName: "default.png",
      extension: ".png",
      size: 42
    });

    expect(result.assetKind).toBe("image");
    expect(result.isWallpaper).toBe(true);
    expect(result.resolution?.name).toBe("640x480");
  });
});
