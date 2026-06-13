import type {
  ParsedThemeScheme,
  ThemeSchemeSection,
  ThemeSchemeSource
} from "../model";

const SECTION_PATTERN = /^\s*\[([^\]]+)\]\s*$/;

export function parseThemeScheme(
  content: string,
  source: ThemeSchemeSource
): ParsedThemeScheme {
  const sections: ThemeSchemeSection[] = [];
  const issues: ParsedThemeScheme["issues"] = [];
  let currentSection: ThemeSchemeSection | undefined;
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    if (
      trimmedLine.length === 0 ||
      trimmedLine.startsWith(";") ||
      trimmedLine.startsWith("#")
    ) {
      return;
    }

    const sectionMatch = SECTION_PATTERN.exec(line);

    if (sectionMatch) {
      currentSection = {
        name: sectionMatch[1].trim(),
        line: lineNumber,
        entries: []
      };
      sections.push(currentSection);
      return;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex < 0) {
      issues.push({
        line: lineNumber,
        content: line,
        message: "Expected a section header or key/value assignment."
      });
      return;
    }

    if (!currentSection) {
      issues.push({
        line: lineNumber,
        content: line,
        message: "Assignment appears before the first section."
      });
      return;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1);

    if (!key) {
      issues.push({
        line: lineNumber,
        content: line,
        message: "Assignment key is empty."
      });
      return;
    }

    currentSection.entries.push({
      key,
      value: rawValue.trim(),
      rawValue,
      line: lineNumber
    });
  });

  return {
    ...source,
    sections,
    issues
  };
}
