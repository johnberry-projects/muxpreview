import { useEffect, useMemo, useState } from "react";

import type { ThemeAsset, ThemeResolution } from "../../core/model";
import { VirtualDisplayCanvas } from "./VirtualDisplayCanvas";

interface GlyphExplorerProps {
  glyphs: ThemeAsset[];
  resolution: ThemeResolution;
}

export function GlyphExplorer({ glyphs, resolution }: GlyphExplorerProps) {
  const visibleGlyphs = useMemo(
    () =>
      glyphs
        .filter(
          (glyph) =>
            !glyph.resolution || glyph.resolution === resolution.name,
        )
        .sort((left, right) =>
          left.relativePath.localeCompare(right.relativePath),
        ),
    [glyphs, resolution.name],
  );
  const [selectedPath, setSelectedPath] = useState(
    visibleGlyphs[0]?.relativePath ?? "",
  );
  const [wallpaperFailed, setWallpaperFailed] = useState(false);
  const selectedGlyph =
    visibleGlyphs.find((glyph) => glyph.relativePath === selectedPath) ??
    visibleGlyphs[0];

  useEffect(() => {
    if (
      !visibleGlyphs.some((glyph) => glyph.relativePath === selectedPath)
    ) {
      setSelectedPath(visibleGlyphs[0]?.relativePath ?? "");
    }
  }, [selectedPath, visibleGlyphs]);

  useEffect(() => {
    setWallpaperFailed(false);
  }, [resolution.name, resolution.wallpaper?.relativePath]);

  const wallpaperUrl =
    resolution.wallpaper && !wallpaperFailed
      ? `/api/theme-wallpaper?resolution=${encodeURIComponent(resolution.name)}`
      : undefined;

  return (
    <section className="inspection-section glyph-explorer">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Glyph Explorer</p>
          <h2>Virtual display assets</h2>
        </div>
        <span className="glyph-count">{visibleGlyphs.length} glyphs</span>
      </div>

      {visibleGlyphs.length === 0 ? (
        <p className="empty-state">
          No shared or {resolution.name} glyphs were detected.
        </p>
      ) : (
        <div className="glyph-explorer-layout">
          <VirtualDisplayCanvas
            className="glyph-display"
            resolution={resolution}
            wallpaperUrl={wallpaperUrl}
            wallpaperAlt=""
            onWallpaperError={() => setWallpaperFailed(true)}
          >
            <div className="glyph-grid">
              {visibleGlyphs.map((glyph) => {
                const glyphUrl = `/api/theme-glyph?path=${encodeURIComponent(
                  glyph.relativePath,
                )}`;
                const isSelected =
                  glyph.relativePath === selectedGlyph?.relativePath;

                return (
                  <button
                    className={`glyph-card${isSelected ? " is-selected" : ""}`}
                    type="button"
                    key={glyph.relativePath}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedPath(glyph.relativePath)}
                  >
                    <span className="glyph-image">
                      <img src={glyphUrl} alt="" loading="lazy" />
                    </span>
                    <span className="glyph-name">{glyph.fileName}</span>
                    <span className="glyph-path">{glyph.relativePath}</span>
                  </button>
                );
              })}
            </div>
          </VirtualDisplayCanvas>

          {selectedGlyph && (
            <aside className="glyph-metadata" aria-label="Selected glyph">
              <p className="eyebrow">Selected glyph</p>
              <h3>{selectedGlyph.fileName}</h3>
              <img
                src={`/api/theme-glyph?path=${encodeURIComponent(
                  selectedGlyph.relativePath,
                )}`}
                alt={selectedGlyph.fileName}
              />
              <dl>
                <div>
                  <dt>Source</dt>
                  <dd>
                    {selectedGlyph.resolution
                      ? selectedGlyph.resolution
                      : "Shared theme asset"}
                  </dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{selectedGlyph.extension.slice(1).toUpperCase()}</dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{formatBytes(selectedGlyph.size)}</dd>
                </div>
                <div>
                  <dt>Path</dt>
                  <dd>{selectedGlyph.relativePath}</dd>
                </div>
              </dl>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}

function formatBytes(size: number): string {
  if (size < 1_024) {
    return `${size} B`;
  }

  return `${(size / 1_024).toFixed(1)} KB`;
}
