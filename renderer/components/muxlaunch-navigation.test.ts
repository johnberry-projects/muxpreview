import { describe, expect, it } from "vitest";

import {
  itemPositions,
  navigateSelection,
  type NavigationItem,
} from "./muxlaunch-navigation";

const ITEMS: NavigationItem[] = [
  { label: "Explore", aliases: ["explore"] },
  { label: "Favourites", aliases: ["collection", "favourites"] },
  { label: "Applications", aliases: ["apps", "applications"] },
  { label: "Configuration", aliases: ["config", "configuration"] },
  { label: "History", aliases: ["history"] },
  { label: "Information", aliases: ["info", "information"] },
  { label: "Reboot", aliases: ["reboot"] },
  { label: "Shutdown", aliases: ["shutdown"] },
];

describe("muxlaunch focus navigation", () => {
  it("moves geometrically through generated grids", () => {
    const positions = itemPositions(ITEMS, "grid", 4);

    expect(navigateSelection(0, "ArrowRight", positions)).toBe(1);
    expect(navigateSelection(0, "ArrowDown", positions)).toBe(4);
    expect(navigateSelection(3, "ArrowRight", positions)).toBeUndefined();
    expect(navigateSelection(7, "ArrowDown", positions)).toBeUndefined();
  });

  it("follows the observed static composition geometry", () => {
    const positions = itemPositions(ITEMS, "static", 4);

    expect(navigateSelection(0, "ArrowRight", positions)).toBe(1);
    expect(navigateSelection(0, "ArrowDown", positions)).toBe(2);
    expect(navigateSelection(1, "ArrowRight", positions)).toBe(4);
    expect(navigateSelection(1, "ArrowDown", positions)).toBe(5);
    expect(navigateSelection(4, "ArrowDown", positions)).toBe(6);
  });
});
