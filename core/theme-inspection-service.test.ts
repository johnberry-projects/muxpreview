import { describe, expect, it } from "vitest";

import type { ThemeFileScanner } from "./scanner";
import { ThemeInspectionService } from "./theme-inspection-service";

describe("ThemeInspectionService wallpapers", () => {
  it("prefers a default wallpaper for each resolution", async () => {
    const scanner: ThemeFileScanner = {
      async scan() {
        return {
          rootPath: "/themes/example",
          rootName: "example",
          files: [
            {
              relativePath: "640x480/image/wall/muxlaunch.png",
              fileName: "muxlaunch.png",
              extension: ".png",
              size: 10
            },
            {
              relativePath: "640x480/image/wall/default.png",
              fileName: "default.png",
              extension: ".png",
              size: 10
            }
          ]
        };
      }
    };

    const inspection = await new ThemeInspectionService(scanner).inspect(
      "/themes/example"
    );

    expect(inspection.resolutions[0]?.wallpapers).toHaveLength(2);
    expect(inspection.resolutions[0]?.wallpaper?.fileName).toBe("default.png");
  });
});
