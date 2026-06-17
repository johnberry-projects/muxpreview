import type {
  MuxlaunchAlphaModel,
  MuxlaunchColorModel,
  MuxlaunchLayoutModel,
  MuxlaunchMappedValue,
  MuxlaunchMappedValueKind,
  MuxlaunchRenderModel,
  MuxlaunchStatusBarModel,
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
  "grid.CELL_DEFAULT_TEXT",
  "grid.CELL_FOCUS_BACKGROUND"
];

const MAPPINGS: Record<string, MappingDefinition> = {
  "header.HEADER_HEIGHT": { name: "headerHeight", kind: "number" },
  "header.HEADER_BACKGROUND": { name: "headerBackground", kind: "color" },
  "header.HEADER_BACKGROUND_ALPHA": {
    name: "headerBackground",
    kind: "number"
  },
  "header.HEADER_TEXT": { name: "headerText", kind: "color" },
  "header.HEADER_TEXT_ALPHA": { name: "headerText", kind: "number" },
  "date.DATETIME_TEXT": { name: "dateTimeText", kind: "color" },
  "date.DATETIME_ALPHA": { name: "dateTimeText", kind: "number" },
  "date.PADDING_LEFT": { name: "datePaddingLeft", kind: "number" },
  "status.PADDING_RIGHT": { name: "statusPaddingRight", kind: "number" },
  "battery.BATTERY_NORMAL": { name: "batteryNormal", kind: "color" },
  "battery.BATTERY_NORMAL_ALPHA": {
    name: "batteryNormal",
    kind: "number"
  },
  "battery.BATTERY_ACTIVE": { name: "batteryActive", kind: "color" },
  "battery.BATTERY_ACTIVE_ALPHA": {
    name: "batteryActive",
    kind: "number"
  },
  "battery.BATTERY_LOW": { name: "batteryLow", kind: "color" },
  "battery.BATTERY_LOW_ALPHA": { name: "batteryLow", kind: "number" },
  "network.NETWORK_NORMAL": { name: "networkNormal", kind: "color" },
  "network.NETWORK_NORMAL_ALPHA": {
    name: "networkNormal",
    kind: "number"
  },
  "network.NETWORK_ACTIVE": { name: "networkActive", kind: "color" },
  "network.NETWORK_ACTIVE_ALPHA": {
    name: "networkActive",
    kind: "number"
  },
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
  "grid.CELL_RADIUS": { name: "cellRadius", kind: "number" },
  "grid.CELL_BORDER_WIDTH": { name: "cellBorderWidth", kind: "number" },
  "grid.CURRENT_ITEM_LABEL_OFFSET_Y": {
    name: "currentItemLabelOffsetY",
    kind: "number"
  },
  "grid.CELL_DEFAULT_TEXT": { name: "labelText", kind: "color" },
  "grid.CELL_DEFAULT_TEXT_ALPHA": {
    name: "labelText",
    kind: "number"
  },
  "grid.CELL_DEFAULT_BACKGROUND": {
    name: "cellBackground",
    kind: "color"
  },
  "grid.CELL_DEFAULT_BACKGROUND_ALPHA": {
    name: "cellBackground",
    kind: "number"
  },
  "grid.CELL_DEFAULT_BORDER": { name: "cellBorder", kind: "color" },
  "grid.CELL_DEFAULT_BORDER_ALPHA": {
    name: "cellBorder",
    kind: "number"
  },
  "grid.CELL_DEFAULT_IMAGE_ALPHA": {
    name: "cellImage",
    kind: "number"
  },
  "grid.CELL_FOCUS_TEXT": { name: "focusText", kind: "color" },
  "grid.CELL_FOCUS_TEXT_ALPHA": {
    name: "focusText",
    kind: "number"
  },
  "grid.CELL_FOCUS_BACKGROUND": {
    name: "focusBackground",
    kind: "color"
  },
  "grid.CELL_FOCUS_BACKGROUND_ALPHA": {
    name: "focusBackground",
    kind: "number"
  },
  "grid.CELL_FOCUS_BORDER": { name: "focusBorder", kind: "color" },
  "grid.CELL_FOCUS_BORDER_ALPHA": {
    name: "focusBorder",
    kind: "number"
  },
  "grid.CELL_FOCUS_IMAGE_ALPHA": {
    name: "focusImage",
    kind: "number"
  },
  "grid.CURRENT_ITEM_LABEL_TEXT": {
    name: "currentItemLabelText",
    kind: "color"
  },
  "grid.CURRENT_ITEM_LABEL_TEXT_ALPHA": {
    name: "currentItemLabelText",
    kind: "number"
  },
  "misc.IMAGE_OVERLAY": {
    name: "imageOverlayEnabled",
    kind: "number"
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
    alphas: buildAlphas(mappedValues),
    visual: {
      imageOverlayEnabled: readBoolean(
        mappedValues,
        "imageOverlayEnabled"
      )
    },
    statusBar: buildStatusBar(mappedValues),
    fontValues,
    glyphReferences: GLYPH_REFERENCES,
    mappedValues,
    unmappedValues,
    missingExpectedValues: EXPECTED_KEYS.filter((key) => !mappedKeys.has(key))
  };
}

function readBoolean(
  values: MuxlaunchMappedValue[],
  name: string
): boolean | undefined {
  const value = values.find(
    (candidate) => candidate.name === name && candidate.kind === "number"
  )?.value;

  return value === 0 ? false : value === 1 ? true : undefined;
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
  const layoutNames = new Set([
    "locationX",
    "locationY",
    "columnCount",
    "rowCount",
    "columnWidth",
    "rowHeight",
    "cellWidth",
    "cellHeight",
    "imagePaddingTop",
    "textPaddingBottom",
    "textPaddingSide",
    "cellRadius",
    "cellBorderWidth",
    "currentItemLabelOffsetY"
  ]);

  return pickMappedValues<MuxlaunchLayoutModel>(
    values.filter((value) => layoutNames.has(value.name)),
    "number"
  );
}

function buildColors(values: MuxlaunchMappedValue[]): MuxlaunchColorModel {
  return pickMappedValues<MuxlaunchColorModel>(values, "color");
}

function buildAlphas(values: MuxlaunchMappedValue[]): MuxlaunchAlphaModel {
  const alphaNames = new Set([
    "labelText",
    "cellBackground",
    "cellBorder",
    "cellImage",
    "focusText",
    "focusBackground",
    "focusBorder",
    "focusImage",
    "currentItemLabelText"
  ]);
  const alphaValues = values.filter(
    (value) =>
      value.kind === "number" &&
      value.key.endsWith("_ALPHA") &&
      alphaNames.has(value.name)
  );

  return pickMappedValues<MuxlaunchAlphaModel>(alphaValues, "number");
}

function buildStatusBar(
  values: MuxlaunchMappedValue[]
): MuxlaunchStatusBarModel {
  return {
    headerHeight: readNumber(values, "headerHeight"),
    headerBackground: readColor(values, "headerBackground"),
    headerBackgroundAlpha: readAlpha(values, "headerBackground"),
    headerText: readColor(values, "headerText"),
    headerTextAlpha: readAlpha(values, "headerText"),
    dateTimeText: readColor(values, "dateTimeText"),
    dateTimeAlpha: readAlpha(values, "dateTimeText"),
    datePaddingLeft: readNumber(values, "datePaddingLeft"),
    statusPaddingRight: readNumber(values, "statusPaddingRight"),
    batteryNormal: readColor(values, "batteryNormal"),
    batteryNormalAlpha: readAlpha(values, "batteryNormal"),
    batteryActive: readColor(values, "batteryActive"),
    batteryActiveAlpha: readAlpha(values, "batteryActive"),
    batteryLow: readColor(values, "batteryLow"),
    batteryLowAlpha: readAlpha(values, "batteryLow"),
    networkNormal: readColor(values, "networkNormal"),
    networkNormalAlpha: readAlpha(values, "networkNormal"),
    networkActive: readColor(values, "networkActive"),
    networkActiveAlpha: readAlpha(values, "networkActive")
  };
}

function readNumber(
  values: MuxlaunchMappedValue[],
  name: string
): number | undefined {
  return values.find(
    (value) => value.name === name && value.kind === "number"
  )?.value as number | undefined;
}

function readColor(
  values: MuxlaunchMappedValue[],
  name: string
): string | undefined {
  return values.find(
    (value) => value.name === name && value.kind === "color"
  )?.value as string | undefined;
}

function readAlpha(
  values: MuxlaunchMappedValue[],
  name: string
): number | undefined {
  return values.find(
    (value) =>
      value.name === name &&
      value.kind === "number" &&
      value.key.endsWith("_ALPHA")
  )?.value as number | undefined;
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
