import type {
  MuxlaunchColorModel,
  MuxlaunchLayoutModel,
  MuxlaunchMappedValue,
  MuxlaunchMappedValueKind,
  MuxlaunchRenderModel,
  MuxlaunchUnmappedValue,
  ParsedThemeScheme,
  ThemeSchemeEntry
} from "../model";

interface MappingDefinition {
  kind: MuxlaunchMappedValueKind;
  name: string;
}

const EXPECTED_KEYS = [
  "grid.COLUMN_COUNT",
  "grid.ROW_COUNT",
  "grid.LOCATION_X",
  "grid.LOCATION_Y",
  "grid.CELL_WIDTH",
  "grid.CELL_HEIGHT",
  "grid.CELL_DEFAULT_TEXT"
];

const MAPPINGS: Record<string, MappingDefinition> = {
  "grid.LOCATION_X": { name: "locationX", kind: "number" },
  "grid.LOCATION_Y": { name: "locationY", kind: "number" },
  "grid.COLUMN_COUNT": { name: "columnCount", kind: "number" },
  "grid.ROW_COUNT": { name: "rowCount", kind: "number" },
  "grid.COLUMN_WIDTH": { name: "columnWidth", kind: "number" },
  "grid.ROW_HEIGHT": { name: "rowHeight", kind: "number" },
  "grid.CELL_WIDTH": { name: "cellWidth", kind: "number" },
  "grid.CELL_HEIGHT": { name: "cellHeight", kind: "number" },
  "grid.CELL_IMAGE_PADDING_TOP": {
    name: "imagePaddingTop",
    kind: "number"
  },
  "grid.CELL_TEXT_PADDING_BOTTOM": {
    name: "textPaddingBottom",
    kind: "number"
  },
  "grid.CELL_TEXT_PADDING_SIDE": {
    name: "textPaddingSide",
    kind: "number"
  },
  "grid.CELL_DEFAULT_TEXT": { name: "labelText", kind: "color" },
  "grid.CELL_DEFAULT_BACKGROUND": {
    name: "cellBackground",
    kind: "color"
  },
  "grid.CELL_FOCUS_TEXT": { name: "focusText", kind: "color" },
  "grid.CELL_FOCUS_BACKGROUND": {
    name: "focusBackground",
    kind: "color"
  }
};

const GLYPH_REFERENCES = [
  "glyph/muxlaunch/explore.png",
  "glyph/muxlaunch/collection.png",
  "glyph/muxlaunch/apps.png",
  "glyph/muxlaunch/config.png"
];

export function mapMuxlaunchScheme(
  scheme: ParsedThemeScheme
): MuxlaunchRenderModel {
  const mappedValues: MuxlaunchMappedValue[] = [];
  const unmappedValues: MuxlaunchUnmappedValue[] = [];
  const fontValues: MuxlaunchMappedValue[] = [];
  const mappedKeys = new Set<string>();

  for (const section of scheme.sections) {
    for (const entry of section.entries) {
      const qualifiedKey = `${section.name}.${entry.key}`;
      const definition = MAPPINGS[qualifiedKey];

      if (definition) {
        const mapped = mapEntry(section.name, entry, definition);

        if (mapped) {
          mappedValues.push(mapped);
          mappedKeys.add(qualifiedKey);
        } else {
          unmappedValues.push({
            section: section.name,
            key: entry.key,
            rawValue: entry.rawValue,
            line: entry.line,
            reason:
              definition.kind === "color" ? "invalid-color" : "invalid-number"
          });
        }

        continue;
      }

      if (section.name === "font" || entry.key.startsWith("FONT_")) {
        fontValues.push({
          name: entry.key,
          section: section.name,
          key: entry.key,
          rawValue: entry.rawValue,
          value: entry.value,
          kind: "text",
          line: entry.line
        });
        continue;
      }

      unmappedValues.push({
        section: section.name,
        key: entry.key,
        rawValue: entry.rawValue,
        line: entry.line,
        reason: "unknown-key"
      });
    }
  }

  return {
    screenName: "muxlaunch",
    sourceSchemePath: scheme.relativePath,
    resolution: scheme.resolution,
    availableSections: scheme.sections.map((section) => section.name),
    layout: buildLayout(mappedValues),
    colors: buildColors(mappedValues),
    fontValues,
    glyphReferences: GLYPH_REFERENCES,
    mappedValues,
    unmappedValues,
    missingExpectedValues: EXPECTED_KEYS.filter((key) => !mappedKeys.has(key))
  };
}

function mapEntry(
  section: string,
  entry: ThemeSchemeEntry,
  definition: MappingDefinition
): MuxlaunchMappedValue | undefined {
  const value =
    definition.kind === "number"
      ? parseNumber(entry.value)
      : definition.kind === "color"
        ? parseColor(entry.value)
        : entry.value;

  if (value === undefined) {
    return undefined;
  }

  return {
    name: definition.name,
    section,
    key: entry.key,
    rawValue: entry.rawValue,
    value,
    kind: definition.kind,
    line: entry.line
  };
}

function parseNumber(value: string): number | undefined {
  if (!/^-?\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function parseColor(value: string): string | undefined {
  return /^[0-9a-f]{6}$/i.test(value) ? `#${value.toUpperCase()}` : undefined;
}

function buildLayout(
  values: MuxlaunchMappedValue[]
): MuxlaunchLayoutModel {
  return pickMappedValues<MuxlaunchLayoutModel>(values, "number");
}

function buildColors(values: MuxlaunchMappedValue[]): MuxlaunchColorModel {
  return pickMappedValues<MuxlaunchColorModel>(values, "color");
}

function pickMappedValues<T extends object>(
  values: MuxlaunchMappedValue[],
  kind: MuxlaunchMappedValueKind
): T {
  const result: Record<string, number | string> = {};

  for (const value of values) {
    if (value.kind === kind) {
      result[value.name] = value.value;
    }
  }

  return result as T;
}
