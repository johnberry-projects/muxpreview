import { useEffect, useMemo, useState } from "react";

import type {
  CSSProperties,
} from "react";

import type {
  MuxlaunchRenderModel,
  ThemeAsset,
  ThemeResolution,
} from "../../core/model";
import { VirtualDisplayCanvas } from "./VirtualDisplayCanvas";

interface StaticMuxlaunchPreviewProps {
  glyphs: ThemeAsset[];
  renderModel?: MuxlaunchRenderModel;
  resolution: ThemeResolution;
}

interface StaticMuxlaunchItem {
  aliases: string[];
  glyph?: ThemeAsset;
  label: string;
}

const STATIC_ITEMS: Array<Pick<StaticMuxlaunchItem, "aliases" | "label">> = [
  { label: "Explore", aliases: ["explore"] },
  {
    label: "Favourites",
    aliases: ["favourites", "favorites", "collection"],
  },
  { label: "Applications", aliases: ["apps", "applications", "app"] },
  { label: "Config", aliases: ["config", "configuration", "settings"] },
];

export function StaticMuxlaunchPreview({
  glyphs,
  renderModel,
  resolution,
}: StaticMuxlaunchPreviewProps) {
  const [wallpaperFailed, setWallpaperFailed] = useState(false);
  const items = useMemo(
    () =>
      selectStaticItems(
        glyphs,
        resolution.name,
        renderModel?.glyphReferences ?? [],
      ),
    [glyphs, renderModel?.glyphReferences, resolution.name],
  );
  const gridStyle = createGridStyle(renderModel, resolution);

  useEffect(() => {
    setWallpaperFailed(false);
  }, [resolution.name, resolution.wallpaper?.relativePath]);

  const wallpaperUrl =
    resolution.wallpaper && !wallpaperFailed
      ? `/api/theme-wallpaper?resolution=${encodeURIComponent(resolution.name)}`
      : undefined;

  return (
    <figure className="static-muxlaunch-preview">
      <VirtualDisplayCanvas
        className="muxlaunch-display"
        resolution={resolution}
        wallpaperUrl={wallpaperUrl}
        wallpaperAlt=""
        onWallpaperError={() => setWallpaperFailed(true)}
      >
        <div className="muxlaunch-static-grid" style={gridStyle}>
          {items.map((item) => (
            <article className="muxlaunch-static-item" key={item.label}>
              <span className="muxlaunch-static-icon">
                {item.glyph ? (
                  <img
                    src={`/api/theme-glyph?path=${encodeURIComponent(
                      item.glyph.relativePath,
                    )}`}
                    alt=""
                  />
                ) : (
                  <span aria-hidden="true">?</span>
                )}
              </span>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </VirtualDisplayCanvas>
      <figcaption>
        Static muxpreview fixture. Validated mapped values are applied when
        available; labels and remaining layout behavior are temporary.
      </figcaption>
    </figure>
  );
}

function selectStaticItems(
  glyphs: ThemeAsset[],
  resolutionName: string,
  glyphReferences: string[],
): StaticMuxlaunchItem[] {
  const availableGlyphs = glyphs
    .filter(
      (glyph) =>
        !glyph.resolution || glyph.resolution === resolutionName,
    )
    .sort((left, right) => {
      const resolutionPriority =
        Number(right.resolution === resolutionName) -
        Number(left.resolution === resolutionName);

      return (
        resolutionPriority ||
        left.relativePath.localeCompare(right.relativePath)
      );
    });
  const referenceNames = new Set(
    glyphReferences.map((reference) =>
      reference.split("/").at(-1)?.toLocaleLowerCase(),
    ),
  );
  const muxlaunchGlyphs = availableGlyphs
    .filter((glyph) =>
      glyph.relativePath.toLowerCase().includes("glyph/muxlaunch/"),
    )
    .sort((left, right) => {
      const referencePriority =
        Number(referenceNames.has(right.fileName.toLocaleLowerCase())) -
        Number(referenceNames.has(left.fileName.toLocaleLowerCase()));

      return referencePriority;
    });
  const fallbackGlyphs = [
    ...muxlaunchGlyphs,
    ...availableGlyphs.filter(
      (glyph) => !muxlaunchGlyphs.includes(glyph),
    ),
  ];
  const usedPaths = new Set<string>();

  return STATIC_ITEMS.map((item) => {
    const matchedGlyph = muxlaunchGlyphs.find(
      (glyph) =>
        !usedPaths.has(glyph.relativePath) &&
        item.aliases.includes(fileStem(glyph)),
    );
    const glyph =
      matchedGlyph ??
      fallbackGlyphs.find((candidate) => !usedPaths.has(candidate.relativePath));

    if (glyph) {
      usedPaths.add(glyph.relativePath);
    }

    return { ...item, glyph };
  });
}

function fileStem(glyph: ThemeAsset): string {
  return glyph.fileName
    .slice(0, -glyph.extension.length)
    .toLocaleLowerCase();
}

function createGridStyle(
  renderModel: MuxlaunchRenderModel | undefined,
  resolution: ThemeResolution,
): CSSProperties {
  if (!renderModel) {
    return {};
  }

  const { layout, colors } = renderModel;
  const style: CSSProperties = {};

  if (isWithin(layout.columnCount, 1, 8)) {
    style.gridTemplateColumns = `repeat(${layout.columnCount}, minmax(0, 1fr))`;
  }

  if (isWithin(layout.rowCount, 1, 8)) {
    style.gridTemplateRows = `repeat(${layout.rowCount}, minmax(0, 1fr))`;
  }

  if (
    isWithin(layout.locationX, 0, resolution.width) &&
    isWithin(layout.locationY, 0, resolution.height)
  ) {
    style.position = "absolute";
    style.left = `${(layout.locationX / resolution.width) * 100}%`;
    style.top = `${(layout.locationY / resolution.height) * 100}%`;
  }

  if (
    layout.columnWidth !== undefined &&
    layout.cellWidth !== undefined &&
    layout.columnWidth >= layout.cellWidth
  ) {
    style.columnGap = `${
      ((layout.columnWidth - layout.cellWidth) / resolution.width) * 100
    }%`;
  }

  if (
    layout.rowHeight !== undefined &&
    layout.cellHeight !== undefined &&
    layout.rowHeight >= layout.cellHeight
  ) {
    style.rowGap = `${
      ((layout.rowHeight - layout.cellHeight) / resolution.height) * 100
    }%`;
  }

  if (colors.labelText) {
    style.color = colors.labelText;
  }

  return style;
}

function isWithin(
  value: number | undefined,
  minimum: number,
  maximum: number,
): value is number {
  return value !== undefined && value >= minimum && value <= maximum;
}
