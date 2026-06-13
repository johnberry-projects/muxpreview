import type { ThemeInspectionResult } from "../core/model";
import { ThemeInspectionService } from "../core";
import { NodeThemeScanner } from "./node-theme-scanner";

export class ThemeInspectionProvider {
  private inspectionPromise?: Promise<ThemeInspectionResult>;

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
}
