import { useEffect, useState } from "react";

import type { MuxlaunchPreviewModel } from "../../core/preview";
import { previewAssetUrl } from "./muxlaunch-preview-items";
import { VirtualDisplayCanvas } from "./VirtualDisplayCanvas";

interface StaticMuxlaunchPreviewProps {
  model?: MuxlaunchPreviewModel;
}

export function StaticMuxlaunchPreview({ model }: StaticMuxlaunchPreviewProps) {
  const [wallpaperFailed, setWallpaperFailed] = useState(false);

  useEffect(() => {
    setWallpaperFailed(false);
  }, [model?.resolution.name, model?.wallpaper.asset?.relativePath]);

  if (!model) {
    return (
      <figure className="static-muxlaunch-preview">
        <p className="wallpaper-empty">No preview model is available.</p>
      </figure>
    );
  }

  const wallpaperUrl =
    model.wallpaper.asset && !wallpaperFailed
      ? previewAssetUrl(model.wallpaper.asset)
      : undefined;

  return (
    <figure className="static-muxlaunch-preview">
      <VirtualDisplayCanvas
        className="muxlaunch-display"
        resolution={model.resolution}
        backgroundUrl={wallpaperUrl}
        backgroundAlt=""
        onBackgroundError={() => setWallpaperFailed(true)}
      >
        <div className="muxlaunch-static-grid">
          {model.menu.entries.slice(0, 4).map((item) => (
            <article className="muxlaunch-static-item" key={item.label}>
              <span className="muxlaunch-static-icon">
                {previewAssetUrl(item.artwork) ? (
                  <img src={previewAssetUrl(item.artwork)} alt="" />
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
