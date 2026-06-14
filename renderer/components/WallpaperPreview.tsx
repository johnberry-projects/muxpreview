import { useEffect, useState } from "react";

import type { ThemeResolution } from "../../core/model";
import { VirtualDisplayCanvas } from "./VirtualDisplayCanvas";

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
      <VirtualDisplayCanvas
        resolution={resolution}
        wallpaperUrl={failed ? undefined : wallpaperUrl}
        wallpaperAlt={`${resolution.name} theme wallpaper`}
        onWallpaperError={() => setFailed(true)}
      >
        {failed && <p>Unable to load this wallpaper from the local server.</p>}
      </VirtualDisplayCanvas>
      <figcaption>
        <span>{resolution.wallpaper.relativePath}</span>
        {resolution.wallpapers.length > 1 && (
          <span>{resolution.wallpapers.length} wallpaper candidates found</span>
        )}
      </figcaption>
    </figure>
  );
}
