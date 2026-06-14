import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  MuxlaunchRenderModel,
  MuxlaunchVisualLayerModel,
  ParsedThemeScheme,
  ThemeInspectionResult,
  ThemeSchemeFile
} from "../core/model";
import {
  mapMuxlaunchScheme,
  parseThemeScheme,
  resolveMuxlaunchVisualLayers,
  ThemeInspectionService
} from "../core";
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

  async getMuxlaunchRenderModel(
    schemeFile: ThemeSchemeFile,
  ): Promise<MuxlaunchRenderModel> {
    return mapMuxlaunchScheme(await this.getScheme(schemeFile));
  }

  async getMuxlaunchRenderModelForResolution(
    resolution: string,
  ): Promise<MuxlaunchRenderModel | undefined> {
    const inspection = await this.getInspection();
    const schemeFile = inspection.schemeFiles.find(
      (candidate) =>
        candidate.resolution === resolution &&
        candidate.screenId?.toLowerCase() === "muxlaunch",
    );

    return schemeFile
      ? this.getMuxlaunchRenderModel(schemeFile)
      : undefined;
  }

  async getMuxlaunchVisualLayers(
    resolutionName: string,
  ): Promise<MuxlaunchVisualLayerModel | undefined> {
    const inspection = await this.getInspection();
    const resolution = inspection.resolutions.find(
      (candidate) => candidate.name === resolutionName,
    );

    if (!resolution) {
      return undefined;
    }

    const renderModel =
      await this.getMuxlaunchRenderModelForResolution(resolutionName);

    return resolveMuxlaunchVisualLayers(inspection, resolution, renderModel);
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
