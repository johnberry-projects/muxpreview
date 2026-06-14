export type MuxlaunchMappedValueKind = "color" | "number" | "text";

export interface MuxlaunchMappedValue {
  name: string;
  section: string;
  key: string;
  rawValue: string;
  value: number | string;
  kind: MuxlaunchMappedValueKind;
  line: number;
}

export interface MuxlaunchUnmappedValue {
  section: string;
  key: string;
  rawValue: string;
  line: number;
  reason: "invalid-color" | "invalid-number" | "unknown-key";
}

export interface MuxlaunchLayoutModel {
  locationX?: number;
  locationY?: number;
  columnCount?: number;
  rowCount?: number;
  columnWidth?: number;
  rowHeight?: number;
  cellWidth?: number;
  cellHeight?: number;
  imagePaddingTop?: number;
  textPaddingBottom?: number;
  textPaddingSide?: number;
}

export interface MuxlaunchColorModel {
  labelText?: string;
  cellBackground?: string;
  focusText?: string;
  focusBackground?: string;
}

export interface MuxlaunchRenderModel {
  screenName: "muxlaunch";
  sourceSchemePath: string;
  resolution?: string;
  availableSections: string[];
  layout: MuxlaunchLayoutModel;
  colors: MuxlaunchColorModel;
  fontValues: MuxlaunchMappedValue[];
  glyphReferences: string[];
  mappedValues: MuxlaunchMappedValue[];
  unmappedValues: MuxlaunchUnmappedValue[];
  missingExpectedValues: string[];
}
