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
  cellRadius?: number;
  cellBorderWidth?: number;
  currentItemLabelOffsetY?: number;
}

export interface MuxlaunchColorModel {
  labelText?: string;
  cellBackground?: string;
  cellBorder?: string;
  focusText?: string;
  focusBackground?: string;
  focusBorder?: string;
  currentItemLabelText?: string;
}

export interface MuxlaunchAlphaModel {
  labelText?: number;
  cellBackground?: number;
  cellBorder?: number;
  cellImage?: number;
  focusText?: number;
  focusBackground?: number;
  focusBorder?: number;
  focusImage?: number;
  currentItemLabelText?: number;
}

export interface MuxlaunchVisualModel {
  imageOverlayEnabled?: boolean;
}

export interface MuxlaunchStatusBarModel {
  headerHeight?: number;
  headerBackground?: string;
  headerBackgroundAlpha?: number;
  headerText?: string;
  headerTextAlpha?: number;
  dateTimeText?: string;
  dateTimeAlpha?: number;
  datePaddingLeft?: number;
  statusPaddingRight?: number;
  batteryNormal?: string;
  batteryNormalAlpha?: number;
  batteryActive?: string;
  batteryActiveAlpha?: number;
  batteryLow?: string;
  batteryLowAlpha?: number;
  networkNormal?: string;
  networkNormalAlpha?: number;
  networkActive?: string;
  networkActiveAlpha?: number;
}

export interface MuxlaunchRenderModel {
  screenName: "muxlaunch";
  sourceSchemePath: string;
  resolution?: string;
  availableSections: string[];
  layout: MuxlaunchLayoutModel;
  colors: MuxlaunchColorModel;
  alphas: MuxlaunchAlphaModel;
  visual: MuxlaunchVisualModel;
  statusBar: MuxlaunchStatusBarModel;
  fontValues: MuxlaunchMappedValue[];
  glyphReferences: string[];
  mappedValues: MuxlaunchMappedValue[];
  unmappedValues: MuxlaunchUnmappedValue[];
  missingExpectedValues: string[];
}
