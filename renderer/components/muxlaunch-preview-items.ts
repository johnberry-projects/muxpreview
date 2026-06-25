import type { PreviewAssetRef } from "../../core/preview";

export function previewAssetUrl(asset: PreviewAssetRef | undefined): string | undefined {
  if (!asset) {
    return undefined;
  }

  const endpoint =
    asset.kind === "image" ? "/api/theme-image" : "/api/theme-glyph";

  return `${endpoint}?path=${encodeURIComponent(asset.relativePath)}`;
}
