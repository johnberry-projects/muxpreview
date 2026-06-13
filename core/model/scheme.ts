export interface ThemeSchemeEntry {
  key: string;
  value: string;
  rawValue: string;
  line: number;
}

export interface ThemeSchemeSection {
  name: string;
  line: number;
  entries: ThemeSchemeEntry[];
}

export interface ThemeSchemeParseIssue {
  line: number;
  content: string;
  message: string;
}

export interface ParsedThemeScheme {
  relativePath: string;
  fileName: string;
  resolution?: string;
  screenId?: string;
  sections: ThemeSchemeSection[];
  issues: ThemeSchemeParseIssue[];
}

export interface ThemeSchemeSource {
  relativePath: string;
  fileName: string;
  resolution?: string;
  screenId?: string;
}
