import { useEffect, useMemo, useState } from "react";

import type { ThemeAsset, ThemeResolution } from "../../core/model";
import {
  muxlaunchAssetUrl,
  selectMuxlaunchItems,
} from "./muxlaunch-preview-items";
import { VirtualDisplayCanvas } from "./VirtualDisplayCanvas";

interface StaticMuxlaunchPreviewProps {
  glyphs: ThemeAsset[];
  resolution: ThemeResolution;
}

export function StaticMuxlaunchPreview({
  glyphs,
  resolution,
}: StaticMuxlaunchPreviewProps) {
  const [wallpaperFailed, setWallpaperFailed] = useState(false);
  const items = useMemo(
    () => selectMuxlaunchItems(glyphs, [], resolution.name, 4),
    [glyphs, resolution.name],
  );

  useEffect(() => {
    setWallpaperFailed(false);
  }, [resolution.name, resolution.wallpaper?.relativePath]);

  const wallpaperUrl =
    resolution.wallpaper && !wallpaperFailed
      ? `/api/theme-wallpaper?resolution=${encodeURIComponent(resolution.name)}`
      : undefined;

  return (
    <figure className="static-muxlaunch-preview">
      <VirtualDisplayCanvas
        className="muxlaunch-display"
        resolution={resolution}
        backgroundUrl={wallpaperUrl}
        backgroundAlt=""
        onBackgroundError={() => setWallpaperFailed(true)}
      >
        <div className="muxlaunch-static-grid">
          {items.map((item) => (
            <article className="muxlaunch-static-item" key={item.label}>
              <span className="muxlaunch-static-icon">
                {muxlaunchAssetUrl(item) ? (
                  <img src={muxlaunchAssetUrl(item)} alt="" />
                ) : (
                  <span className="muxlaunch-missing-icon" aria-hidden="true" />
                )}
              </span>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </VirtualDisplayCanvas>
      <figcaption>
        Static muxpreview fixture using fixed layout and fallback styling.
      </figcaption>
    </figure>
  );
}
