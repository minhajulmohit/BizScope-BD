"use client";

import { useCallback, useEffect, useState } from "react";
import type { StatusData } from "@/lib/api/types";

interface StatusState {
  data: StatusData | null;
  loading: boolean;
  error: boolean;
}

function isStatusData(value: unknown): value is StatusData {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.overall === "string" &&
    Array.isArray(candidate.providers) &&
    typeof candidate.generatedAt === "string"
  );
}

export function useSourceStatus() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<StatusState>({
    data: null,
    loading: true,
    error: false,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadStatus() {
      setState((current) => ({
        ...current,
        loading: true,
        error: false,
      }));

      try {
        const response = await fetch("/api/status", {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Status request failed");
        const payload: unknown = await response.json();
        if (!isStatusData(payload)) throw new Error("Status response failed validation");

        setState({ data: payload, loading: false, error: false });
      } catch {
        if (controller.signal.aborted) return;
        setState({ data: null, loading: false, error: true });
      }
    }

    void loadStatus();

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return { ...state, retry };
}
