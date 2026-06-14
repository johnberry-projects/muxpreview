import { useEffect, useMemo, useState } from "react";

import type { ThemeAsset, ThemeResolution } from "../../core/model";
import { VirtualDisplayCanvas } from "./VirtualDisplayCanvas";

interface StaticMuxlaunchPreviewProps {
  glyphs: ThemeAsset[];
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
  resolution,
}: StaticMuxlaunchPreviewProps) {
  const [wallpaperFailed, setWallpaperFailed] = useState(false);
  const items = useMemo(
    () => selectStaticItems(glyphs, resolution.name),
    [glyphs, resolution.name],
  );

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
        <div className="muxlaunch-static-grid">
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
        Static muxpreview fixture. Positions and labels are temporary and do
        not come from the selected scheme.
      </figcaption>
    </figure>
  );
}

function selectStaticItems(
  glyphs: ThemeAsset[],
  resolutionName: string,
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
  const muxlaunchGlyphs = availableGlyphs.filter((glyph) =>
    glyph.relativePath.toLowerCase().includes("glyph/muxlaunch/"),
  );
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
