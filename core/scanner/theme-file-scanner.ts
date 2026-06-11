export interface ScannedThemeFile {
  relativePath: string;
  fileName: string;
  extension: string;
  size: number;
}

export interface ThemeScan {
  rootPath: string;
  rootName: string;
  files: ScannedThemeFile[];
}

export interface ThemeFileScanner {
  scan(themePath: string): Promise<ThemeScan>;
}
