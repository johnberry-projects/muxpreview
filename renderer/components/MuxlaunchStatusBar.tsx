import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import type {
  MuxlaunchRenderModel,
  ThemeAsset,
  ThemeResolution
} from "../../core/model";

interface MuxlaunchStatusBarProps {
  glyphs: ThemeAsset[];
  renderModel?: MuxlaunchRenderModel;
  resolution: ThemeResolution;
  title?: string;
}

type StatusBarStyle = CSSProperties & {
  "--status-background"?: string;
  "--status-color"?: string;
  "--status-height"?: string;
  "--status-icon-height"?: string;
  "--status-padding-left"?: string;
  "--status-padding-right"?: string;
};

export function MuxlaunchStatusBar({
  glyphs,
  renderModel,
  resolution,
  title = "muxlaunch"
}: MuxlaunchStatusBarProps) {
  const [currentTime, setCurrentTime] = useState(formatCurrentTime);
  const assets = useMemo(
    () => selectStatusAssets(glyphs, resolution.name),
    [glyphs, resolution.name]
  );
  const style = createStatusBarStyle(renderModel, resolution);

  useEffect(() => {
    const interval = window.setInterval(
      () => setCurrentTime(formatCurrentTime()),
      30_000
    );

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="muxlaunch-status-bar" style={style}>
      <div className="muxlaunch-status-side muxlaunch-status-time">
        {currentTime}
      </div>
      <div className="muxlaunch-status-title">{title}</div>
      <div
        aria-label="Preview status indicators"
        className="muxlaunch-status-side muxlaunch-status-indicators"
      >
        {assets.network ? (
          <img
            className="muxlaunch-status-icon"
            src={glyphUrl(assets.network)}
            alt="Wi-Fi"
          />
        ) : (
          <span className="muxlaunch-status-fallback-icon" aria-label="Wi-Fi">
            Wi-Fi
          </span>
        )}
        {assets.battery ? (
          <img
            className="muxlaunch-status-icon"
            src={glyphUrl(assets.battery)}
            alt="Battery"
          />
        ) : (
          <span
            className="muxlaunch-status-fallback-battery"
            aria-label="Battery"
          />
        )}
      </div>
    </div>
  );
}

function selectStatusAssets(glyphs: ThemeAsset[], resolutionName: string) {
  const headerGlyphs = glyphs
    .filter((asset) => asset.relativePath.toLowerCase().includes("glyph/header/"))
    .filter((asset) => !asset.resolution || asset.resolution === resolutionName)
    .sort((left, right) => {
      const resolutionPriority =
        Number(right.resolution === resolutionName) -
        Number(left.resolution === resolutionName);

      return (
        resolutionPriority ||
        left.relativePath.localeCompare(right.relativePath)
      );
    });

  return {
    network: findByStem(headerGlyphs, [
      "network_active",
      "network_normal",
      "wifi_active",
      "wifi_normal"
    ]),
    battery:
      findByStem(headerGlyphs, [
        "capacity_100",
        "capacity_90",
        "capacity_80",
        "battery_full",
        "battery"
      ]) ??
      headerGlyphs.find((asset) =>
        fileStem(asset).startsWith("capacity_")
      )
  };
}

function findByStem(
  assets: ThemeAsset[],
  stems: string[]
): ThemeAsset | undefined {
  return assets.find((asset) => stems.includes(fileStem(asset)));
}

function fileStem(asset: ThemeAsset): string {
  return asset.fileName
    .slice(0, -asset.extension.length)
    .toLocaleLowerCase();
}

function createStatusBarStyle(
  renderModel: MuxlaunchRenderModel | undefined,
  resolution: ThemeResolution
): StatusBarStyle {
  const scale = Math.min(resolution.width / 640, resolution.height / 480);
  const statusBar = renderModel?.statusBar;
  const height = positive(statusBar?.headerHeight) ?? Math.round(48 * scale);
  const color =
    colorWithAlpha(
      statusBar?.headerText ??
        statusBar?.dateTimeText ??
        statusBar?.networkActive ??
        "#FFFFFF",
      statusBar?.headerTextAlpha ?? statusBar?.dateTimeAlpha ?? 255
    );
  const headerBackgroundAlpha = positiveOrZero(
    statusBar?.headerBackgroundAlpha
  );
  const background =
    statusBar?.headerBackground && headerBackgroundAlpha
      ? colorWithAlpha(statusBar.headerBackground, headerBackgroundAlpha)
      : "transparent";

  return {
    "--status-background": background,
    "--status-color": color,
    "--status-height": `${height}px`,
    "--status-icon-height": `${Math.max(14, Math.round(height * 0.44))}px`,
    "--status-padding-left": `${positive(statusBar?.datePaddingLeft) ?? Math.round(10 * scale)}px`,
    "--status-padding-right": `${positive(statusBar?.statusPaddingRight) ?? Math.round(12 * scale)}px`
  };
}

function positive(value: number | undefined): number | undefined {
  return value !== undefined && value > 0 ? value : undefined;
}

function positiveOrZero(value: number | undefined): number | undefined {
  return value !== undefined && value >= 0 ? value : undefined;
}

function colorWithAlpha(color: string, alpha: number): string {
  const validAlpha = Math.min(Math.max(alpha, 0), 255);
  return `${color}${validAlpha.toString(16).padStart(2, "0")}`;
}

function formatCurrentTime(): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function glyphUrl(asset: ThemeAsset): string {
  return `/api/theme-glyph?path=${encodeURIComponent(asset.relativePath)}`;
}
