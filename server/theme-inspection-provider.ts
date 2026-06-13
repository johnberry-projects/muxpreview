import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  ParsedThemeScheme,
  ThemeInspectionResult,
  ThemeSchemeFile
} from "../core/model";
import { parseThemeScheme, ThemeInspectionService } from "../core";
import { NodeThemeScanner } from "./node-theme-scanner";

export class ThemeInspectionProvider {
  private inspectionPromise?: Promise<ThemeInspectionResult>;
  private readonly schemePromises = new Map<
    string,
    Promise<ParsedThemeScheme>
  >();

  constructor(readonly themePath?: string) {}

  getInspection(): Promise<ThemeInspectionResult> {
    if (!this.themePath) {
      return Promise.reject(new Error("No theme path is configured."));
    }

    this.inspectionPromise ??= new ThemeInspectionService(
      new NodeThemeScanner(),
    ).inspect(this.themePath);

    return this.inspectionPromise;
  }

  getScheme(schemeFile: ThemeSchemeFile): Promise<ParsedThemeScheme> {
    const existing = this.schemePromises.get(schemeFile.relativePath);

    if (existing) {
      return existing;
    }

    const schemePromise = this.readScheme(schemeFile);
    this.schemePromises.set(schemeFile.relativePath, schemePromise);
    return schemePromise;
  }

  private async readScheme(
    schemeFile: ThemeSchemeFile,
  ): Promise<ParsedThemeScheme> {
    if (!this.themePath) {
      throw new Error("No theme path is configured.");
    }

    const resolvedRoot = path.resolve(this.themePath);
    const resolvedFile = path.resolve(
      resolvedRoot,
      ...schemeFile.relativePath.split("/"),
    );
    const rootPrefix = `${resolvedRoot}${path.sep}`;

    if (!resolvedFile.startsWith(rootPrefix)) {
      throw new Error("Scheme path escaped the configured theme root.");
    }

    const content = await readFile(resolvedFile, "utf8");
    return parseThemeScheme(content, schemeFile);
  }
}
