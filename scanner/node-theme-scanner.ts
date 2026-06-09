import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import type {
  ScannedThemeFile,
  ThemeFileScanner,
  ThemeScan
} from "../core/theme-file-scanner";

const IGNORED_FILE_PREFIXES = ["._"];
const IGNORED_FILE_NAMES = new Set([".DS_Store", "Thumbs.db"]);

export class NodeThemeScanner implements ThemeFileScanner {
  async scan(themePath: string): Promise<ThemeScan> {
    const rootPath = path.resolve(themePath);
    const rootStats = await stat(rootPath);

    if (!rootStats.isDirectory()) {
      throw new Error(`Theme path is not a directory: ${rootPath}`);
    }

    const files: ScannedThemeFile[] = [];
    await this.scanDirectory(rootPath, rootPath, files);

    files.sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath)
    );

    return {
      rootPath,
      rootName: path.basename(rootPath),
      files
    };
  }

  private async scanDirectory(
    rootPath: string,
    directoryPath: string,
    files: ScannedThemeFile[]
  ): Promise<void> {
    const entries = await readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      if (this.shouldIgnore(entry.name)) {
        continue;
      }

      const absolutePath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        await this.scanDirectory(rootPath, absolutePath, files);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const fileStats = await stat(absolutePath);
      files.push({
        relativePath: path.relative(rootPath, absolutePath).replaceAll("\\", "/"),
        fileName: entry.name,
        extension: path.extname(entry.name).toLowerCase(),
        size: fileStats.size
      });
    }
  }

  private shouldIgnore(fileName: string): boolean {
    return (
      IGNORED_FILE_NAMES.has(fileName) ||
      IGNORED_FILE_PREFIXES.some((prefix) => fileName.startsWith(prefix))
    );
  }
}
