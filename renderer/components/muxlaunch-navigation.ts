import type { MuxlaunchVisualLayerModel } from "../../core/model";

export interface CompositionRegion {
  aliases: string[];
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface NavigationItem {
  aliases: string[];
  label: string;
}

export interface ItemPosition {
  index: number;
  x: number;
  y: number;
}

export const COMPOSITION_REGIONS: CompositionRegion[] = [
  { aliases: ["explore"], left: 0.065, top: 0.19, width: 0.285, height: 0.45 },
  {
    aliases: ["collection", "favourite", "favourites", "favorites"],
    left: 0.355,
    top: 0.19,
    width: 0.285,
    height: 0.45,
  },
  { aliases: ["history"], left: 0.65, top: 0.19, width: 0.285, height: 0.45 },
  {
    aliases: ["apps", "applications", "app"],
    left: 0.065,
    top: 0.69,
    width: 0.315,
    height: 0.16,
  },
  { aliases: ["info", "information"], left: 0.4, top: 0.69, width: 0.12, height: 0.16 },
  {
    aliases: ["config", "configuration", "settings"],
    left: 0.535,
    top: 0.69,
    width: 0.125,
    height: 0.16,
  },
  { aliases: ["reboot"], left: 0.675, top: 0.69, width: 0.125, height: 0.16 },
  { aliases: ["shutdown"], left: 0.81, top: 0.69, width: 0.125, height: 0.16 },
];

export function navigateSelection(
  currentIndex: number,
  key: string,
  positions: ItemPosition[],
): number | undefined {
  const current = positions.find((position) => position.index === currentIndex);

  if (!current) {
    return undefined;
  }

  const direction = navigationDirection(key);

  if (!direction) {
    return undefined;
  }

  return positions
    .filter((position) => {
      const primaryDelta =
        direction.axis === "x"
          ? (position.x - current.x) * direction.sign
          : (position.y - current.y) * direction.sign;

      return primaryDelta > 0.001;
    })
    .map((position) => {
      const primaryDistance =
        direction.axis === "x"
          ? Math.abs(position.x - current.x)
          : Math.abs(position.y - current.y);
      const perpendicularDistance =
        direction.axis === "x"
          ? Math.abs(position.y - current.y)
          : Math.abs(position.x - current.x);

      return {
        index: position.index,
        score: primaryDistance + perpendicularDistance * 2.5,
      };
    })
    .sort((left, right) => left.score - right.score)[0]?.index;
}

export function itemPositions(
  items: NavigationItem[],
  contentMode: MuxlaunchVisualLayerModel["contentMode"],
  columns: number,
): ItemPosition[] {
  if (contentMode === "grid") {
    return items.map((_, index) => ({
      index,
      x: index % columns,
      y: Math.floor(index / columns),
    }));
  }

  return compositionTargets(items).map(({ index, region }) => ({
    index,
    x: region.left + region.width / 2,
    y: region.top + region.height / 2,
  }));
}

export function compositionTargets<T extends NavigationItem>(
  items: T[],
): Array<{ index: number; item: T; region: CompositionRegion }> {
  return COMPOSITION_REGIONS.flatMap((region) => {
    const index = items.findIndex((item) =>
      item.aliases.some((alias) => region.aliases.includes(alias)),
    );

    return index >= 0 ? [{ index, item: items[index], region }] : [];
  });
}

function navigationDirection(key: string):
  | { axis: "x" | "y"; sign: -1 | 1 }
  | undefined {
  switch (key) {
    case "ArrowRight":
      return { axis: "x", sign: 1 };
    case "ArrowLeft":
      return { axis: "x", sign: -1 };
    case "ArrowUp":
      return { axis: "y", sign: -1 };
    case "ArrowDown":
      return { axis: "y", sign: 1 };
    default:
      return undefined;
  }
}
