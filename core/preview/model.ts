export type PreviewAssetKind = "font" | "glyph" | "image" | "scheme";

export interface PreviewAssetRef {
  kind: PreviewAssetKind;
  relativePath: string;
  fileName: string;
  size: number;
  resolution?: string;
}

export interface PreviewResolution {
  name: string;
  width: number;
  height: number;
}

export interface PreviewDiagnostic {
  id: string;
  severity: "low" | "medium" | "high";
  message: string;
  sourceFiles: string[];
}

export interface PreviewWallpaper {
  asset?: PreviewAssetRef;
  reason: string;
}

export interface PreviewOverlay {
  asset?: PreviewAssetRef;
  enabled: boolean;
  reason: string;
}

export type PreviewContentMode = "baked" | "grid" | "static";

export interface PreviewContent {
  mode: PreviewContentMode;
  asset?: PreviewAssetRef;
  reason: string;
}

export interface PreviewStatusIcon {
  label: string;
  asset?: PreviewAssetRef;
  fallback: "battery" | "text";
  fallbackText?: string;
}

export interface PreviewStatusBarStyle {
  background: string;
  batteryColor: string;
  batteryOpacity: number;
  fontSize: number;
  height: number;
  iconHeight: number;
  networkColor: string;
  networkOpacity: number;
  paddingLeft: number;
  paddingRight: number;
  timeColor: string;
  titleColor: string;
}

export interface PreviewStatusBar {
  visible: boolean;
  title: string;
  icons: {
    battery: PreviewStatusIcon;
    network: PreviewStatusIcon;
  };
  style: PreviewStatusBarStyle;
}

export interface PreviewGridBox {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface PreviewMenuLayout {
  cellHeight: number;
  cellWidth: number;
  columnGap: number;
  columns: number;
  gridHeight: number;
  gridWidth: number;
  rowGap: number;
  rows: number;
  x: number;
  y: number;
}

export interface PreviewMenuCellStyle {
  background: string;
  borderColor: string;
  borderRadius?: number;
  borderWidth: number;
  color: string;
  imageOpacity: number;
  imagePaddingTop: number;
  labelFontSize: number;
  labelPaddingBottom: number;
  labelPaddingInline: number;
  labelVisible: boolean;
}

export interface PreviewCurrentLabelStyle {
  color: string;
  fontSize: number;
  visible: boolean;
  y: number;
}

export interface PreviewMenuEntry {
  aliases: string[];
  artwork?: PreviewAssetRef;
  artworkKind?: "glyph" | "image";
  compositionAsset?: PreviewAssetRef;
  hotspot: PreviewGridBox;
  label: string;
}

export interface PreviewMenu {
  currentLabel: PreviewCurrentLabelStyle;
  entries: PreviewMenuEntry[];
  focus: PreviewMenuCellStyle;
  initialFocusIndex: number;
  item: PreviewMenuCellStyle;
  layout: PreviewMenuLayout;
}

export interface MuxlaunchPreviewModel {
  diagnostics: PreviewDiagnostic[];
  fonts: PreviewAssetRef[];
  generatedFrom: "preview-model-builder";
  menu: PreviewMenu;
  overlay: PreviewOverlay;
  resolution: PreviewResolution;
  screen: "muxlaunch";
  statusBar: PreviewStatusBar;
  content: PreviewContent;
  wallpaper: PreviewWallpaper;
}
