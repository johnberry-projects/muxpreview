import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  MuxlaunchRenderModel,
  MuxlaunchVisualLayerModel,
  ParsedThemeScheme,
  ThemeCompositionReport,
  ThemeInspectionResult,
  ThemeSchemeFile
} from "../core/model";
import {
  analyzeThemeComposition,
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

  async getThemeCompositionReport(): Promise<ThemeCompositionReport> {
    return analyzeThemeComposition(await this.getInspection());
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
    const baseSchemeFiles = inspection.schemeFiles.filter(
      (candidate) =>
        candidate.resolution === resolution &&
        candidate.fileName.toLowerCase() === "default.ini",
    );
    const schemeFile = inspection.schemeFiles.find(
      (candidate) =>
        candidate.resolution === resolution &&
        candidate.screenId?.toLowerCase() === "muxlaunch",
    );

    if (!schemeFile) {
      return undefined;
    }

    const parsedSchemes = await Promise.all(
      [...baseSchemeFiles, schemeFile].map((candidate) =>
        this.getScheme(candidate),
      ),
    );

    return mapMuxlaunchScheme(
      combineSchemes(parsedSchemes, {
        relativePath: parsedSchemes
          .map((scheme) => scheme.relativePath)
          .join(" + "),
        fileName: schemeFile.fileName,
        resolution,
        screenId: "muxlaunch",
      }),
    );
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

function combineSchemes(
  schemes: ParsedThemeScheme[],
  source: Pick<
    ParsedThemeScheme,
    "fileName" | "relativePath" | "resolution" | "screenId"
  >,
): ParsedThemeScheme {
  return {
    ...source,
    sections: schemes.flatMap((scheme) => scheme.sections),
    issues: schemes.flatMap((scheme) => scheme.issues),
  };
}
