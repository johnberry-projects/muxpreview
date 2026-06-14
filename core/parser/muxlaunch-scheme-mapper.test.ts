import { describe, expect, it } from "vitest";

import { mapMuxlaunchScheme } from "./muxlaunch-scheme-mapper";
import { parseThemeScheme } from "./theme-scheme-parser";

describe("mapMuxlaunchScheme", () => {
  it("maps validated layout and color values", () => {
    const parsed = parseThemeScheme(
      [
        "[grid]",
        "COLUMN_COUNT = 4",
        "ROW_COUNT = 2",
        "LOCATION_X = 19",
        "CELL_RADIUS = 12",
        "CELL_DEFAULT_TEXT = f7e318",
        "CELL_DEFAULT_TEXT_ALPHA = 180",
        "CELL_FOCUS_BACKGROUND = 282525",
        "CELL_FOCUS_BACKGROUND_ALPHA = 255",
        "UNKNOWN_GRID_KEY = value",
        "",
        "[font]",
        "FONT_LIST_PAD_TOP = 3"
      ].join("\n"),
      {
        relativePath: "640x480/scheme/muxlaunch.ini",
        fileName: "muxlaunch.ini",
        resolution: "640x480",
        screenId: "muxlaunch"
      }
    );

    const model = mapMuxlaunchScheme(parsed);

    expect(model.layout).toMatchObject({
      columnCount: 4,
      rowCount: 2,
      locationX: 19,
      cellRadius: 12
    });
    expect(model.colors.labelText).toBe("#F7E318");
    expect(model.colors.focusBackground).toBe("#282525");
    expect(model.alphas).toMatchObject({
      labelText: 180,
      focusBackground: 255
    });
    expect(model.fontValues).toHaveLength(1);
    expect(model.unmappedValues).toEqual([
      expect.objectContaining({
        section: "grid",
        key: "UNKNOWN_GRID_KEY",
        reason: "unknown-key"
      })
    ]);
    expect(model.missingExpectedValues).toContain("grid.LOCATION_Y");
  });

  it("keeps invalid known values visible as unmapped", () => {
    const parsed = parseThemeScheme(
      ["[grid]", "COLUMN_COUNT = auto", "CELL_DEFAULT_TEXT = red"].join("\n"),
      {
        relativePath: "scheme/muxlaunch.ini",
        fileName: "muxlaunch.ini",
        screenId: "muxlaunch"
      }
    );

    const model = mapMuxlaunchScheme(parsed);

    expect(model.layout.columnCount).toBeUndefined();
    expect(model.colors.labelText).toBeUndefined();
    expect(model.unmappedValues.map((value) => value.reason)).toEqual([
      "invalid-number",
      "invalid-color"
    ]);
  });
});
