import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import type {
  MuxlaunchRenderModel,
  MuxlaunchVisualLayerModel,
  ThemeAsset,
  ThemeResolution,
} from "../../core/model";
import {
  muxlaunchAssetUrl,
  selectMuxlaunchItems,
} from "./muxlaunch-preview-items";
import { MuxlaunchStatusBar } from "./MuxlaunchStatusBar";
import { VirtualDisplayCanvas } from "./VirtualDisplayCanvas";

interface MappedMuxlaunchPreviewProps {
  glyphs: ThemeAsset[];
  images: ThemeAsset[];
  renderModel?: MuxlaunchRenderModel;
  resolution: ThemeResolution;
  showCaption?: boolean;
  showMetricsOverlay?: boolean;
  visualLayers?: MuxlaunchVisualLayerModel;
}

const BASE_FALLBACK_LAYOUT = {
  columnCount: 4,
  rowCount: 2,
  columnWidth: 136,
  rowHeight: 156,
  cellWidth: 120,
  cellHeight: 120,
};

export function MappedMuxlaunchPreview({
  glyphs,
  images,
  renderModel,
  resolution,
  showCaption = true,
  showMetricsOverlay = false,
  visualLayers,
}: MappedMuxlaunchPreviewProps) {
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const [contentFailed, setContentFailed] = useState(false);
  const [overlayFailed, setOverlayFailed] = useState(false);
  const items = useMemo(
    () =>
      selectMuxlaunchItems(
        glyphs,
        images,
        resolution.name,
        visibleItemCount(renderModel),
      ),
    [glyphs, images, renderModel, resolution.name],
  );
  const gridStyle = createMappedGridStyle(renderModel, resolution);

  useEffect(() => {
    setBackgroundFailed(false);
    setContentFailed(false);
    setOverlayFailed(false);
  }, [
    resolution.name,
    visualLayers?.backgroundAsset?.relativePath,
    visualLayers?.contentAsset?.relativePath,
    visualLayers?.overlayAsset?.relativePath,
  ]);

  const backgroundUrl =
    visualLayers?.backgroundAsset && !backgroundFailed
      ? themeImageUrl(visualLayers.backgroundAsset.relativePath)
      : undefined;
  const overlayUrl =
    visualLayers?.overlayEnabled &&
    visualLayers.overlayAsset &&
    !overlayFailed
      ? themeImageUrl(visualLayers.overlayAsset.relativePath)
      : undefined;
  const staticContentUrl =
    visualLayers?.contentMode === "static" &&
    visualLayers.contentAsset &&
    !contentFailed
      ? themeImageUrl(visualLayers.contentAsset.relativePath)
      : undefined;

  return (
    <figure className="mapped-muxlaunch-preview">
      <VirtualDisplayCanvas
        className="muxlaunch-display mapped-muxlaunch-display"
        resolution={resolution}
        backgroundUrl={backgroundUrl}
        backgroundAlt=""
        onBackgroundError={() => setBackgroundFailed(true)}
        overlayUrl={overlayUrl}
        onOverlayError={() => setOverlayFailed(true)}
        showMetricsOverlay={showMetricsOverlay}
      >
        <MuxlaunchStatusBar
          glyphs={glyphs}
          renderModel={renderModel}
          resolution={resolution}
          title="Main Menu"
        />
        {staticContentUrl ? (
          <img
            className="muxlaunch-static-composition"
            src={staticContentUrl}
            alt=""
            onError={() => setContentFailed(true)}
          />
        ) : (
          <div className="muxlaunch-mapped-grid" style={gridStyle.grid}>
            {items.map((item, index) => {
              const selected = index === 0;
              const assetUrl = muxlaunchAssetUrl(item);

              return (
                <article
                  className={`muxlaunch-mapped-item${selected ? " is-selected" : ""}`}
                  key={item.label}
                  style={selected ? gridStyle.focusCell : gridStyle.cell}
                >
                  <span
                    className="muxlaunch-mapped-icon"
                    style={selected ? gridStyle.focusImage : gridStyle.image}
                  >
                    {assetUrl ? (
                      <img src={assetUrl} alt="" />
                    ) : (
                      <span aria-hidden="true">?</span>
                    )}
                  </span>
                  <span
                    className="muxlaunch-mapped-label"
                    style={selected ? gridStyle.focusLabel : gridStyle.label}
                  >
                    {item.label}
                  </span>
                </article>
              );
            })}
            <p
              className="muxlaunch-current-label"
              style={gridStyle.currentLabel}
            >
              {items[0]?.label}
            </p>
          </div>
        )}
      </VirtualDisplayCanvas>
      {showCaption && (
        <figcaption>
          Mapped preview using verified muxlaunch grid values where available.
          Missing values use muxpreview defaults.
        </figcaption>
      )}
    </figure>
  );
}

function visibleItemCount(renderModel: MuxlaunchRenderModel | undefined): number {
  const columns = bounded(renderModel?.layout.columnCount, 1, 8);
  const rows = bounded(renderModel?.layout.rowCount, 1, 4);

  return Math.min((columns ?? 4) * (rows ?? 2), 8);
}

function createMappedGridStyle(
  renderModel: MuxlaunchRenderModel | undefined,
  resolution: ThemeResolution,
) {
  const fallbackScale = Math.min(
    resolution.width / 640,
    resolution.height / 480,
  );
  const fallbackLayout = {
    columnWidth: BASE_FALLBACK_LAYOUT.columnWidth * fallbackScale,
    rowHeight: BASE_FALLBACK_LAYOUT.rowHeight * fallbackScale,
    cellWidth: BASE_FALLBACK_LAYOUT.cellWidth * fallbackScale,
    cellHeight: BASE_FALLBACK_LAYOUT.cellHeight * fallbackScale,
  };
  const layout = renderModel?.layout ?? {};
  const columns = bounded(layout.columnCount, 1, 8) ?? 4;
  const rows = bounded(layout.rowCount, 1, 4) ?? 2;
  const cellWidth = positive(layout.cellWidth) ?? fallbackLayout.cellWidth;
  const cellHeight = positive(layout.cellHeight) ?? fallbackLayout.cellHeight;
  const columnWidth = Math.max(
    cellWidth,
    positive(layout.columnWidth) ?? fallbackLayout.columnWidth,
  );
  const rowHeight = Math.max(
    cellHeight,
    positive(layout.rowHeight) ?? fallbackLayout.rowHeight,
  );
  const gridWidth = (columns - 1) * columnWidth + cellWidth;
  const gridHeight = (rows - 1) * rowHeight + cellHeight;
  const locationX =
    layout.locationX ?? Math.max(0, (resolution.width - gridWidth) / 2);
  const locationY =
    layout.locationY ?? Math.max(0, (resolution.height - gridHeight) / 2);
  const columnGap = columnWidth - cellWidth;
  const rowGap = rowHeight - cellHeight;
  const colors = renderModel?.colors;
  const alphas = renderModel?.alphas;
  const borderWidth = bounded(layout.cellBorderWidth, 0, 20) ?? 0;
  const radius = bounded(layout.cellRadius, 0, Math.max(cellWidth, cellHeight));
  const labelOffset = layout.currentItemLabelOffsetY ?? 8;
  const labelFontSize = Math.max(8, Math.round(cellHeight * 0.13));
  const currentLabelFontSize = Math.max(9, Math.round(cellHeight * 0.15));

  return {
    grid: {
      left: locationX,
      top: locationY,
      width: gridWidth,
      height: gridHeight,
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      columnGap,
      rowGap,
    } satisfies CSSProperties,
    cell: {
      borderWidth,
      borderRadius: radius,
      borderColor: colorWithAlpha(
        colors?.cellBorder ?? "#FFFFFF",
        alphas?.cellBorder ?? 0,
      ),
      background: colorWithAlpha(
        colors?.cellBackground ?? "#11151A",
        alphas?.cellBackground ?? 150,
      ),
      color: colorWithAlpha(
        colors?.labelText ?? "#FFFFFF",
        alphas?.labelText ?? 255,
      ),
    } satisfies CSSProperties,
    focusCell: {
      borderWidth,
      borderRadius: radius,
      borderColor: colorWithAlpha(
        colors?.focusBorder ?? "#F3BD3D",
        alphas?.focusBorder ?? 255,
      ),
      background: colorWithAlpha(
        colors?.focusBackground ?? "#F3BD3D",
        alphas?.focusBackground ?? 220,
      ),
      color: colorWithAlpha(
        colors?.focusText ?? "#11151A",
        alphas?.focusText ?? 255,
      ),
    } satisfies CSSProperties,
    image: {
      opacity: alphaOpacity(alphas?.cellImage),
      paddingTop: layout.imagePaddingTop ?? 0,
    } satisfies CSSProperties,
    focusImage: {
      opacity: alphaOpacity(alphas?.focusImage),
      paddingTop: layout.imagePaddingTop ?? 0,
    } satisfies CSSProperties,
    label: {
      display: alphas?.labelText === 0 ? "none" : undefined,
      fontSize: labelFontSize,
      paddingInline: layout.textPaddingSide ?? 0,
      paddingBottom: layout.textPaddingBottom ?? 0,
    } satisfies CSSProperties,
    focusLabel: {
      display: alphas?.focusText === 0 ? "none" : undefined,
      fontSize: labelFontSize,
      paddingInline: layout.textPaddingSide ?? 0,
      paddingBottom: layout.textPaddingBottom ?? 0,
    } satisfies CSSProperties,
    currentLabel: {
      display: alphas?.currentItemLabelText === 0 ? "none" : undefined,
      top: gridHeight + labelOffset,
      color: colorWithAlpha(
        colors?.currentItemLabelText ?? colors?.focusText ?? "#FFFFFF",
        alphas?.currentItemLabelText ?? 255,
      ),
      fontSize: currentLabelFontSize,
    } satisfies CSSProperties,
  };
}

function themeImageUrl(relativePath: string): string {
  return `/api/theme-image?path=${encodeURIComponent(relativePath)}`;
}

function bounded(
  value: number | undefined,
  minimum: number,
  maximum: number,
): number | undefined {
  return value !== undefined && value >= minimum && value <= maximum
    ? value
    : undefined;
}

function positive(value: number | undefined): number | undefined {
  return value !== undefined && value > 0 ? value : undefined;
}

function alphaOpacity(alpha: number | undefined): number {
  const validAlpha = bounded(alpha, 0, 255);
  return validAlpha === undefined ? 1 : validAlpha / 255;
}

function colorWithAlpha(color: string, alpha: number): string {
  const validAlpha = bounded(alpha, 0, 255) ?? 255;
  return `${color}${validAlpha.toString(16).padStart(2, "0")}`;
}
