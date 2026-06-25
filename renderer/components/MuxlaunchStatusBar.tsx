import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import type { PreviewStatusBar } from "../../core/preview";
import { previewAssetUrl } from "./muxlaunch-preview-items";

interface MuxlaunchStatusBarProps {
  model: PreviewStatusBar;
}

type StatusBarStyle = CSSProperties & {
  "--status-background"?: string;
  "--status-battery-opacity"?: number;
  "--status-battery-color"?: string;
  "--status-font-size"?: string;
  "--status-height"?: string;
  "--status-icon-height"?: string;
  "--status-network-color"?: string;
  "--status-network-opacity"?: number;
  "--status-padding-left"?: string;
  "--status-padding-right"?: string;
  "--status-time-color"?: string;
  "--status-title-color"?: string;
};

type StatusIconStyle = CSSProperties & {
  "--status-icon-mask"?: string;
};

export function MuxlaunchStatusBar({ model }: MuxlaunchStatusBarProps) {
  const [currentTime, setCurrentTime] = useState(formatCurrentTime);
  const style = createStatusBarStyle(model);

  useEffect(() => {
    const interval = window.setInterval(
      () => setCurrentTime(formatCurrentTime()),
      30_000
    );

    return () => window.clearInterval(interval);
  }, []);

  if (!model.visible) {
    return null;
  }

  return (
    <div className="muxlaunch-status-bar" style={style}>
      <div className="muxlaunch-status-side muxlaunch-status-time">
        {currentTime}
      </div>
      <div className="muxlaunch-status-title">{model.title}</div>
      <div
        aria-label="Preview status indicators"
        className="muxlaunch-status-side muxlaunch-status-indicators"
      >
        {model.icons.network.asset ? (
          <span
            aria-label={model.icons.network.label}
            className="muxlaunch-status-icon is-network"
            role="img"
            style={createIconMaskStyle(model.icons.network.asset)}
          />
        ) : (
          <span
            className="muxlaunch-status-fallback-icon is-network"
            aria-label={model.icons.network.label}
          >
            {model.icons.network.fallbackText}
          </span>
        )}
        {model.icons.battery.asset ? (
          <span
            aria-label={model.icons.battery.label}
            className="muxlaunch-status-icon is-battery"
            role="img"
            style={createIconMaskStyle(model.icons.battery.asset)}
          />
        ) : (
          <span
            className="muxlaunch-status-fallback-battery is-battery"
            aria-label={model.icons.battery.label}
          />
        )}
      </div>
    </div>
  );
}

function createStatusBarStyle(model: PreviewStatusBar): StatusBarStyle {
  return {
    "--status-background": model.style.background,
    "--status-battery-color": model.style.batteryColor,
    "--status-battery-opacity": model.style.batteryOpacity,
    "--status-font-size": `${model.style.fontSize}px`,
    "--status-height": `${model.style.height}px`,
    "--status-icon-height": `${model.style.iconHeight}px`,
    "--status-network-color": model.style.networkColor,
    "--status-network-opacity": model.style.networkOpacity,
    "--status-padding-left": `${model.style.paddingLeft}px`,
    "--status-padding-right": `${model.style.paddingRight}px`,
    "--status-time-color": model.style.timeColor,
    "--status-title-color": model.style.titleColor
  };
}

function createIconMaskStyle(
  asset: NonNullable<PreviewStatusBar["icons"]["network"]["asset"]>
): StatusIconStyle {
  return {
    "--status-icon-mask": `url("${previewAssetUrl(asset)}")`
  };
}

function formatCurrentTime(): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}
