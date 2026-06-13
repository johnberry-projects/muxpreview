import { describe, expect, it } from "vitest";

import { parseThemeScheme } from "./theme-scheme-parser";

describe("parseThemeScheme", () => {
  it("extracts sections and preserves assignment text", () => {
    const scheme = parseThemeScheme(
      [
        "; comment",
        "[grid]",
        "COLUMN_COUNT = 4",
        "LABEL = value=with=equals",
        "",
        "[misc]",
        "OFFSET = -8 "
      ].join("\n"),
      {
        relativePath: "640x480/scheme/muxlaunch.ini",
        fileName: "muxlaunch.ini",
        resolution: "640x480",
        screenId: "muxlaunch"
      }
    );

    expect(scheme.sections).toHaveLength(2);
    expect(scheme.sections[0]?.entries).toEqual([
      {
        key: "COLUMN_COUNT",
        value: "4",
        rawValue: " 4",
        line: 3
      },
      {
        key: "LABEL",
        value: "value=with=equals",
        rawValue: " value=with=equals",
        line: 4
      }
    ]);
    expect(scheme.sections[1]?.entries[0]).toMatchObject({
      key: "OFFSET",
      value: "-8",
      rawValue: " -8 "
    });
    expect(scheme.issues).toEqual([]);
  });

  it("reports unsupported lines without discarding parsed sections", () => {
    const scheme = parseThemeScheme(
      ["ORPHAN = 1", "[grid]", "not an assignment", "= missing-key"].join(
        "\n"
      ),
      {
        relativePath: "scheme/example.ini",
        fileName: "example.ini"
      }
    );

    expect(scheme.sections).toHaveLength(1);
    expect(scheme.sections[0]?.entries).toEqual([]);
    expect(scheme.issues.map((issue) => issue.line)).toEqual([1, 3, 4]);
  });
});
