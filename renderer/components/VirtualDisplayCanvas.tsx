import type { ReactNode } from "react";

import type { ThemeResolution } from "../../core/model";

interface VirtualDisplayCanvasProps {
  children?: ReactNode;
  className?: string;
  resolution: ThemeResolution;
  wallpaperAlt?: string;
  wallpaperUrl?: string;
  onWallpaperError?: () => void;
}

export function VirtualDisplayCanvas({
  children,
  className,
  resolution,
  wallpaperAlt = "",
  wallpaperUrl,
  onWallpaperError,
}: VirtualDisplayCanvasProps) {
  const classes = ["virtual-display-canvas", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={{ aspectRatio: `${resolution.width} / ${resolution.height}` }}
    >
      {wallpaperUrl && (
        <img
          className="virtual-display-wallpaper"
          src={wallpaperUrl}
          alt={wallpaperAlt}
          onError={onWallpaperError}
        />
      )}
      {children && <div className="virtual-display-content">{children}</div>}
    </div>
  );
}
