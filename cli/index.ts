#!/usr/bin/env node

import { ThemeInspectionService } from "../core";
import { NodeThemeScanner } from "../server/node-theme-scanner";
import { formatInspectionSummary } from "./format-inspection-summary";

async function main(args: string[]): Promise<number> {
  const [command, themePath] = args;

  if (command !== "inspect" || !themePath) {
    printUsage();
    return 1;
  }

  try {
    const service = new ThemeInspectionService(new NodeThemeScanner());
    const inspection = await service.inspect(themePath);
    console.log(formatInspectionSummary(inspection));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Unable to inspect theme: ${message}`);
    return 1;
  }
}

function printUsage(): void {
  console.error("Usage: muxpreview inspect <path-to-theme>");
}

void main(process.argv.slice(2)).then((exitCode) => {
  process.exitCode = exitCode;
});
