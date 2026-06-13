import { useEffect, useMemo, useState } from "react";

import type {
  ParsedThemeScheme,
  ThemeResolution,
  ThemeSchemeFile
} from "../../core/model";

interface SchemeExplorerProps {
  resolution: ThemeResolution;
  schemeFiles: ThemeSchemeFile[];
}

export function SchemeExplorer({
  resolution,
  schemeFiles,
}: SchemeExplorerProps) {
  const availableSchemes = useMemo(
    () =>
      schemeFiles
        .filter(
          (scheme) =>
            !scheme.resolution || scheme.resolution === resolution.name,
        )
        .sort((left, right) => left.fileName.localeCompare(right.fileName)),
    [resolution.name, schemeFiles],
  );
  const [selectedPath, setSelectedPath] = useState(
    availableSchemes[0]?.relativePath ?? "",
  );
  const [scheme, setScheme] = useState<ParsedThemeScheme>();
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (
      !availableSchemes.some(
        (candidate) => candidate.relativePath === selectedPath,
      )
    ) {
      setSelectedPath(availableSchemes[0]?.relativePath ?? "");
    }
  }, [availableSchemes, selectedPath]);

  useEffect(() => {
    if (!selectedPath) {
      setScheme(undefined);
      setError(undefined);
      return;
    }

    const controller = new AbortController();
    setScheme(undefined);
    setError(undefined);

    async function loadScheme() {
      try {
        const response = await fetch(
          `/api/theme-scheme?path=${encodeURIComponent(selectedPath)}`,
          { signal: controller.signal },
        );
        const body = (await response.json()) as
          | ParsedThemeScheme
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in body && body.error
              ? body.error
              : "Unable to load scheme file.",
          );
        }

        setScheme(body as ParsedThemeScheme);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load scheme file.",
          );
        }
      }
    }

    void loadScheme();
    return () => controller.abort();
  }, [selectedPath]);

  const filteredSections = useMemo(() => {
    if (!scheme) {
      return [];
    }

    const query = search.trim().toLocaleLowerCase();

    if (!query) {
      return scheme.sections;
    }

    return scheme.sections
      .map((section) => {
        if (section.name.toLocaleLowerCase().includes(query)) {
          return section;
        }

        return {
          ...section,
          entries: section.entries.filter(
            (entry) =>
              entry.key.toLocaleLowerCase().includes(query) ||
              entry.value.toLocaleLowerCase().includes(query),
          ),
        };
      })
      .filter((section) => section.entries.length > 0);
  }, [scheme, search]);

  return (
    <section className="inspection-section scheme-explorer">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Scheme Explorer</p>
          <h2>Raw configuration</h2>
        </div>

        {availableSchemes.length > 0 && (
          <label className="scheme-file-selector">
            <span>Scheme file</span>
            <select
              value={selectedPath}
              onChange={(event) => setSelectedPath(event.target.value)}
            >
              {availableSchemes.map((schemeFile) => (
                <option
                  key={schemeFile.relativePath}
                  value={schemeFile.relativePath}
                >
                  {schemeFile.fileName}
                  {!schemeFile.resolution ? " (shared)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {availableSchemes.length === 0 ? (
        <p className="empty-state">
          No scheme files were detected for {resolution.name}.
        </p>
      ) : (
        <>
          <label className="scheme-search">
            <span>Filter sections, keys, or values</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search scheme"
            />
          </label>

          {error && <p className="scheme-message scheme-error">{error}</p>}
          {!error && !scheme && (
            <p className="scheme-message">Loading scheme file...</p>
          )}

          {scheme && (
            <>
              <div className="scheme-metadata">
                <span>{scheme.relativePath}</span>
                <span>
                  {scheme.sections.length} sections,{" "}
                  {scheme.sections.reduce(
                    (total, section) => total + section.entries.length,
                    0,
                  )}{" "}
                  keys
                </span>
              </div>

              {filteredSections.length === 0 ? (
                <p className="scheme-message">
                  No sections or assignments match this filter.
                </p>
              ) : (
                <div className="scheme-sections">
                  {filteredSections.map((section) => (
                    <article
                      className="scheme-section"
                      key={`${section.name}-${section.line}`}
                    >
                      <h3>[{section.name}]</h3>
                      <dl>
                        {section.entries.map((entry) => (
                          <div key={`${entry.key}-${entry.line}`}>
                            <dt>{entry.key}</dt>
                            <dd>{entry.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  ))}
                </div>
              )}

              {scheme.issues.length > 0 && (
                <div className="scheme-issues">
                  <h3>Unparsed lines</h3>
                  <ul>
                    {scheme.issues.map((issue) => (
                      <li key={`${issue.line}-${issue.content}`}>
                        Line {issue.line}: {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
