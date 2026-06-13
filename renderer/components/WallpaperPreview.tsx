import { useEffect, useState } from "react";

import type { ThemeResolution } from "../../core/model";

interface WallpaperPreviewProps {
  resolution: ThemeResolution;
}

export function WallpaperPreview({ resolution }: WallpaperPreviewProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolution.name, resolution.wallpaper?.relativePath]);

  if (!resolution.wallpaper) {
    return (
      <div className="wallpaper-empty">
        No wallpaper was detected under this resolution's
        <code> image/wall/</code> directory.
      </div>
    );
  }

  const wallpaperUrl = `/api/theme-wallpaper?resolution=${encodeURIComponent(
    resolution.name,
  )}`;

  return (
    <figure className="wallpaper-preview">
      <div
        className="wallpaper-canvas"
        style={{ aspectRatio: `${resolution.width} / ${resolution.height}` }}
      >
        {failed ? (
          <p>Unable to load this wallpaper from the local server.</p>
        ) : (
          <img
            src={wallpaperUrl}
            alt={`${resolution.name} theme wallpaper`}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <figcaption>
        <span>{resolution.wallpaper.relativePath}</span>
        {resolution.wallpapers.length > 1 && (
          <span>{resolution.wallpapers.length} wallpaper candidates found</span>
        )}
      </figcaption>
    </figure>
  );
}
