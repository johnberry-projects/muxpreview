import type { ReactNode } from "react";

import type { ThemeResolution } from "../../core/model";

interface VirtualDisplayCanvasProps {
  backgroundAlt?: string;
  backgroundUrl?: string;
  children?: ReactNode;
  className?: string;
  onBackgroundError?: () => void;
  onOverlayError?: () => void;
  overlayUrl?: string;
  resolution: ThemeResolution;
}

export function VirtualDisplayCanvas({
  backgroundAlt = "",
  backgroundUrl,
  children,
  className,
  onBackgroundError,
  onOverlayError,
  overlayUrl,
  resolution,
}: VirtualDisplayCanvasProps) {
  const classes = ["virtual-display-canvas", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={{ aspectRatio: `${resolution.width} / ${resolution.height}` }}
    >
      {backgroundUrl && (
        <img
          className="virtual-display-layer virtual-display-background"
          src={backgroundUrl}
          alt={backgroundAlt}
          onError={onBackgroundError}
        />
      )}
      {children && (
        <div className="virtual-display-layer virtual-display-content">
          {children}
        </div>
      )}
      {overlayUrl && (
        <img
          className="virtual-display-layer virtual-display-overlay"
          src={overlayUrl}
          alt=""
          onError={onOverlayError}
        />
      )}
    </div>
  );
}
