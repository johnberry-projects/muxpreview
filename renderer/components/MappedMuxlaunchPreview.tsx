import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import type {
  MuxlaunchRenderModel,
  ThemeAsset,
  ThemeResolution,
} from "../../core/model";
import {
  muxlaunchAssetUrl,
  selectMuxlaunchItems,
} from "./muxlaunch-preview-items";
import { VirtualDisplayCanvas } from "./VirtualDisplayCanvas";

interface MappedMuxlaunchPreviewProps {
  glyphs: ThemeAsset[];
  images: ThemeAsset[];
  renderModel?: MuxlaunchRenderModel;
  resolution: ThemeResolution;
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
}: MappedMuxlaunchPreviewProps) {
  const [wallpaperFailed, setWallpaperFailed] = useState(false);
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
    setWallpaperFailed(false);
  }, [resolution.name, resolution.wallpaper?.relativePath]);

  const wallpaperUrl =
    resolution.wallpaper && !wallpaperFailed
      ? `/api/theme-wallpaper?resolution=${encodeURIComponent(resolution.name)}`
      : undefined;

  return (
    <figure className="mapped-muxlaunch-preview">
      <VirtualDisplayCanvas
        className="muxlaunch-display mapped-muxlaunch-display"
        resolution={resolution}
        wallpaperUrl={wallpaperUrl}
        wallpaperAlt=""
        onWallpaperError={() => setWallpaperFailed(true)}
      >
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
      </VirtualDisplayCanvas>
      <figcaption>
        Mapped preview using verified muxlaunch grid values where available.
        Missing values use muxpreview defaults.
      </figcaption>
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
  const scale = Math.min(
    resolution.width / 640,
    resolution.height / 480,
  );
  const fallbackLayout = {
    columnWidth: BASE_FALLBACK_LAYOUT.columnWidth * scale,
    rowHeight: BASE_FALLBACK_LAYOUT.rowHeight * scale,
    cellWidth: BASE_FALLBACK_LAYOUT.cellWidth * scale,
    cellHeight: BASE_FALLBACK_LAYOUT.cellHeight * scale,
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

  return {
    grid: {
      left: percent(locationX, resolution.width),
      top: percent(locationY, resolution.height),
      width: percent(gridWidth, resolution.width),
      height: percent(gridHeight, resolution.height),
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      columnGap: percent(columnGap, gridWidth),
      rowGap: percent(rowGap, gridHeight),
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
      paddingTop: percent(layout.imagePaddingTop ?? 0, cellHeight),
    } satisfies CSSProperties,
    focusImage: {
      opacity: alphaOpacity(alphas?.focusImage),
      paddingTop: percent(layout.imagePaddingTop ?? 0, cellHeight),
    } satisfies CSSProperties,
    label: {
      paddingInline: percent(layout.textPaddingSide ?? 0, cellWidth),
      paddingBottom: percent(layout.textPaddingBottom ?? 0, cellHeight),
    } satisfies CSSProperties,
    focusLabel: {
      paddingInline: percent(layout.textPaddingSide ?? 0, cellWidth),
      paddingBottom: percent(layout.textPaddingBottom ?? 0, cellHeight),
    } satisfies CSSProperties,
    currentLabel: {
      top: `calc(100% + ${percent(labelOffset, resolution.height)})`,
      color: colorWithAlpha(
        colors?.currentItemLabelText ?? colors?.focusText ?? "#FFFFFF",
        alphas?.currentItemLabelText ?? 255,
      ),
    } satisfies CSSProperties,
  };
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

function percent(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

function alphaOpacity(alpha: number | undefined): number {
  const validAlpha = bounded(alpha, 0, 255);
  return validAlpha === undefined ? 1 : validAlpha / 255;
}

function colorWithAlpha(color: string, alpha: number): string {
  const validAlpha = bounded(alpha, 0, 255) ?? 255;
  return `${color}${validAlpha.toString(16).padStart(2, "0")}`;
}
