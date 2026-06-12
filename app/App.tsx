import { useEffect, useState } from "react";

import type { ThemeInspectionResult } from "../core/model";
import { LandingScreen } from "../renderer/screens/LandingScreen";
import { ThemeInspectionScreen } from "../renderer/screens/ThemeInspectionScreen";

export function App() {
  const [inspection, setInspection] = useState<ThemeInspectionResult>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();

    async function loadInspection() {
      try {
        const response = await fetch("/api/theme-inspection", {
          signal: controller.signal,
        });
        const body = (await response.json()) as
          | ThemeInspectionResult
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in body && body.error
              ? body.error
              : "Unable to load theme inspection.",
          );
        }

        setInspection(body as ThemeInspectionResult);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load theme inspection.",
        );
      }
    }

    void loadInspection();

    return () => controller.abort();
  }, []);

  if (error) {
    return <LandingScreen title="Inspection unavailable" message={error} />;
  }

  if (!inspection) {
    return (
      <LandingScreen
        title="Inspecting theme"
        message="Loading the configured muOS theme from the local server."
      />
    );
  }

  return <ThemeInspectionScreen inspection={inspection} />;
}
