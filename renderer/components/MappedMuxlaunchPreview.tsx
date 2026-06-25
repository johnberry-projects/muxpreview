import { useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  KeyboardEvent,
} from "react";

import type {
  MuxlaunchPreviewModel,
  PreviewGridBox,
  PreviewMenuCellStyle
} from "../../core/preview";
import { previewAssetUrl } from "./muxlaunch-preview-items";
import {
  itemPositions,
  navigateSelection,
} from "./muxlaunch-navigation";
import { MuxlaunchStatusBar } from "./MuxlaunchStatusBar";
import { VirtualDisplayCanvas } from "./VirtualDisplayCanvas";

interface MappedMuxlaunchPreviewProps {
  model?: MuxlaunchPreviewModel;
  showCaption?: boolean;
  showMetricsOverlay?: boolean;
}

export function MappedMuxlaunchPreview({
  model,
  showCaption = true,
  showMetricsOverlay = false,
}: MappedMuxlaunchPreviewProps) {
  const previewRef = useRef<HTMLElement>(null);
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const [contentFailed, setContentFailed] = useState(false);
  const [overlayFailed, setOverlayFailed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setBackgroundFailed(false);
    setContentFailed(false);
    setOverlayFailed(false);
  }, [
    model?.resolution.name,
    model?.wallpaper.asset?.relativePath,
    model?.content.asset?.relativePath,
    model?.overlay.asset?.relativePath,
  ]);

  useEffect(() => {
    setSelectedIndex(model?.menu.initialFocusIndex ?? 0);
  }, [model?.resolution.name, model?.content.mode, model?.menu.initialFocusIndex]);

  const items = model?.menu.entries ?? [];

  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedIndex]);

  if (!model) {
    return (
      <figure className="mapped-muxlaunch-preview">
        <p className="wallpaper-empty">No preview model is available.</p>
      </figure>
    );
  }

  const previewModel = model;
  const selectedItem = items[selectedIndex] ?? items[0];
  const compositionAsset =
    selectedItem?.compositionAsset ?? previewModel.content.asset;
  const backgroundUrl =
    previewModel.wallpaper.asset && !backgroundFailed
      ? previewAssetUrl(previewModel.wallpaper.asset)
      : undefined;
  const overlayUrl =
    previewModel.overlay.enabled && previewModel.overlay.asset && !overlayFailed
      ? previewAssetUrl(previewModel.overlay.asset)
      : undefined;
  const staticContentUrl =
    previewModel.content.mode !== "grid" && compositionAsset && !contentFailed
      ? previewAssetUrl(compositionAsset)
      : undefined;

  function selectItem(index: number): void {
    setSelectedIndex(Math.min(Math.max(index, 0), items.length - 1));
    previewRef.current?.focus({ preventScroll: true });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const positions = itemPositions(
      items,
      previewModel.content.mode,
      previewModel.menu.layout.columns,
    );
    const nextIndex = navigateSelection(
      selectedIndex,
      event.key,
      positions,
    );

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();
    setSelectedIndex(nextIndex);
  }

  return (
    <figure
      aria-label="Interactive muxlaunch selection preview"
      className="mapped-muxlaunch-preview"
      onKeyDown={handleKeyDown}
      ref={previewRef}
      tabIndex={0}
    >
      <VirtualDisplayCanvas
        className="muxlaunch-display mapped-muxlaunch-display"
        resolution={previewModel.resolution}
        backgroundUrl={backgroundUrl}
        backgroundAlt=""
        onBackgroundError={() => setBackgroundFailed(true)}
        overlayUrl={overlayUrl}
        onOverlayError={() => setOverlayFailed(true)}
        showMetricsOverlay={showMetricsOverlay}
      >
        <MuxlaunchStatusBar model={previewModel.statusBar} />
        {staticContentUrl ? (
          <>
            <img
              className="muxlaunch-static-composition"
              src={staticContentUrl}
              alt=""
              onError={() => setContentFailed(true)}
            />
            <div
              aria-label="muxlaunch menu items"
              className="muxlaunch-composition-hotspots"
              role="group"
            >
              {items.map((item, index) => (
                <button
                  aria-label={item.label}
                  aria-pressed={index === selectedIndex}
                  className="muxlaunch-composition-hotspot"
                  key={item.label}
                  onClick={() => selectItem(index)}
                  style={compositionRegionStyle(item.hotspot)}
                  title={item.label}
                  type="button"
                />
              ))}
            </div>
          </>
        ) : (
          <div className="muxlaunch-mapped-grid" style={gridStyle(previewModel)}>
            {items.map((item, index) => {
              const selected = index === selectedIndex;
              const cellStyle = selected ? previewModel.menu.focus : previewModel.menu.item;
              const assetUrl = previewAssetUrl(item.artwork);

              return (
                <button
                  aria-pressed={selected}
                  className={`muxlaunch-mapped-item${selected ? " is-selected" : ""}`}
                  key={item.label}
                  onClick={() => selectItem(index)}
                  style={cellStyleProperties(cellStyle)}
                  type="button"
                >
                  <span
                    className="muxlaunch-mapped-icon"
                    style={iconStyleProperties(cellStyle)}
                  >
                    {assetUrl ? (
                      <img src={assetUrl} alt="" />
                    ) : (
                      <span className="muxlaunch-missing-icon" aria-hidden="true" />
                    )}
                  </span>
                  <span
                    className="muxlaunch-mapped-label"
                    style={labelStyleProperties(cellStyle)}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
            <p
              className="muxlaunch-current-label"
              style={currentLabelStyle(previewModel)}
            >
              {selectedItem?.label}
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

function gridStyle(model: MuxlaunchPreviewModel): CSSProperties {
  return {
    left: model.menu.layout.x,
    top: model.menu.layout.y,
    width: model.menu.layout.gridWidth,
    height: model.menu.layout.gridHeight,
    gridTemplateColumns: `repeat(${model.menu.layout.columns}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${model.menu.layout.rows}, minmax(0, 1fr))`,
    columnGap: model.menu.layout.columnGap,
    rowGap: model.menu.layout.rowGap,
  };
}

function cellStyleProperties(style: PreviewMenuCellStyle): CSSProperties {
  return {
    borderWidth: style.borderWidth,
    borderRadius: style.borderRadius,
    borderColor: style.borderColor,
    background: style.background,
    color: style.color,
  };
}

function iconStyleProperties(style: PreviewMenuCellStyle): CSSProperties {
  return {
    opacity: style.imageOpacity,
    paddingTop: style.imagePaddingTop,
  };
}

function labelStyleProperties(style: PreviewMenuCellStyle): CSSProperties {
  return {
    display: style.labelVisible ? undefined : "none",
    fontSize: style.labelFontSize,
    paddingInline: style.labelPaddingInline,
    paddingBottom: style.labelPaddingBottom,
  };
}

function currentLabelStyle(model: MuxlaunchPreviewModel): CSSProperties {
  return {
    display: model.menu.currentLabel.visible ? undefined : "none",
    top: model.menu.currentLabel.y,
    color: model.menu.currentLabel.color,
    fontSize: model.menu.currentLabel.fontSize,
  };
}

function compositionRegionStyle(region: PreviewGridBox): CSSProperties {
  return {
    height: `${region.height * 100}%`,
    left: `${region.left * 100}%`,
    top: `${region.top * 100}%`,
    width: `${region.width * 100}%`,
  };
}
