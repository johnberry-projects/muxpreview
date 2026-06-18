import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

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
  showMetricsOverlay?: boolean;
}

interface DisplayMetrics {
  renderedWidth: number;
  renderedHeight: number;
  scale: number;
}

type CanvasStyle = CSSProperties & {
  "--display-scale"?: number;
  "--logical-height"?: string;
  "--logical-width"?: string;
};

export function VirtualDisplayCanvas({
  backgroundAlt = "",
  backgroundUrl,
  children,
  className,
  onBackgroundError,
  onOverlayError,
  overlayUrl,
  resolution,
  showMetricsOverlay = false,
}: VirtualDisplayCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<DisplayMetrics>({
    renderedWidth: resolution.width,
    renderedHeight: resolution.height,
    scale: 1,
  });
  const classes = ["virtual-display-canvas", className]
    .filter(Boolean)
    .join(" ");
  const aspectRatio = resolution.width / resolution.height;
  const canvasStyle: CanvasStyle = {
    "--display-scale": metrics.scale,
    "--logical-height": `${resolution.height}px`,
    "--logical-width": `${resolution.width}px`,
    aspectRatio: `${resolution.width} / ${resolution.height}`,
    maxWidth: `min(100%, ${(aspectRatio * 70).toFixed(3)}vh)`,
  };

  useEffect(() => {
    const element = canvasRef.current;

    if (!element) {
      return;
    }

    const updateMetrics = () => {
      const rect = element.getBoundingClientRect();
      const renderedWidth = Math.round(rect.width);
      const renderedHeight = Math.round(rect.height);

      setMetrics({
        renderedWidth,
        renderedHeight,
        scale:
          renderedWidth > 0 && renderedHeight > 0
            ? Math.min(
                renderedWidth / resolution.width,
                renderedHeight / resolution.height
              )
            : 1,
      });
    };

    updateMetrics();

    const observer = new ResizeObserver(updateMetrics);
    observer.observe(element);

    return () => observer.disconnect();
  }, [resolution.height, resolution.width]);

  return (
    <div
      ref={canvasRef}
      className={classes}
      style={canvasStyle}
    >
      <div className="virtual-display-surface">
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
      {showMetricsOverlay && (
        <dl className="virtual-display-metrics">
          <div>
            <dt>Resolution</dt>
            <dd>{resolution.name}</dd>
          </div>
          <div>
            <dt>Logical</dt>
            <dd>
              {resolution.width} x {resolution.height}
            </dd>
          </div>
          <div>
            <dt>Rendered</dt>
            <dd>
              {metrics.renderedWidth} x {metrics.renderedHeight}
            </dd>
          </div>
          <div>
            <dt>Scale</dt>
            <dd>{metrics.scale.toFixed(3)}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
