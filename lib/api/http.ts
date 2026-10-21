import { REQUEST_TIMEOUT_MS } from "@/lib/api/config";

/**
 * A deliberately sanitised error type. Raw upstream response bodies and
 * headers are never forwarded to the UI or the public API.
 */
export class UpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpstreamError";
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function fetchJson(
  url: string,
  options: { timeoutMs?: number; accept?: string } = {},
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: options.accept ?? "application/json",
      },
      signal: AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new UpstreamError(
      "The upstream service could not be reached within the allowed time.",
    );
  }

  if (!response.ok) {
    throw new UpstreamError(
      `The upstream service returned an unsuccessful response (HTTP ${response.status}).`,
    );
  }

  try {
    return (await response.json()) as unknown;
  } catch {
    throw new UpstreamError("The upstream service returned malformed JSON.");
  }
}

export function safeErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof UpstreamError ? error.message : fallback;
}
