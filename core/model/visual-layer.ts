import type { ThemeAsset } from "./theme";

export type MuxlaunchVisualLayerKind =
  | "background"
  | "top-bar"
  | "status-bar"
  | "content"
  | "overlay";

export type MuxlaunchVisualLayerState =
  | "rendered"
  | "embedded"
  | "available"
  | "generated";

export interface MuxlaunchVisualLayer {
  id: string;
  kind: MuxlaunchVisualLayerKind;
  label: string;
  state: MuxlaunchVisualLayerState;
  assetPaths: string[];
  note: string;
}

export interface MuxlaunchVisualLayerModel {
  resolution: string;
  backgroundAsset?: ThemeAsset;
  contentAsset?: ThemeAsset;
  contentMode: "grid" | "static";
  overlayAsset?: ThemeAsset;
  overlayEnabled: boolean;
  layers: MuxlaunchVisualLayer[];
}
