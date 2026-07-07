"use client";

/**
 * useWebShare — Web Share API hook with feature detection.
 *
 * Never assumes navigator.share or file-sharing support.
 * Gracefully falls back: if sharing is unavailable, returns canShare=false
 * so the caller can hide the Share button and show only the Download button.
 *
 * Privacy: the share payload is constructed from user-supplied data only.
 * No server call is made; the PNG is built client-side from the DOM element.
 */

import { useState, useCallback } from "react";

export type WebShareStatus =
  | { state: "idle" }
  | { state: "sharing" }
  | { state: "success" }
  | { state: "error"; message: string }
  | { state: "unsupported" };

export interface UseWebShareResult {
  /** True when navigator.share + File sharing are both available. */
  canShare: boolean;
  status: WebShareStatus;
  /**
   * Attempt to share a PNG via the native share sheet.
   * Resolves with true on success, false if cancelled or unavailable.
   */
  shareImage(pngDataUrl: string, fileName: string, title: string): Promise<boolean>;
  reset(): void;
}

export function useWebShare(): UseWebShareResult {
  const [status, setStatus] = useState<WebShareStatus>({ state: "idle" });

  // Feature detection — runs only on the client
  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function";

  const shareImage = useCallback(
    async (pngDataUrl: string, fileName: string, title: string): Promise<boolean> => {
      if (!canShare) {
        setStatus({ state: "unsupported" });
        return false;
      }

      // Convert base64 data URL to File
      const res = await fetch(pngDataUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      const shareData: ShareData = { title, files: [file] };

      // Check if the browser can share this specific data
      if (!navigator.canShare(shareData)) {
        setStatus({ state: "unsupported" });
        return false;
      }

      try {
        setStatus({ state: "sharing" });
        await navigator.share(shareData);
        setStatus({ state: "success" });
        return true;
      } catch (err) {
        // AbortError = user cancelled the share sheet — not an error
        if (err instanceof Error && err.name === "AbortError") {
          setStatus({ state: "idle" });
          return false;
        }
        setStatus({ state: "error", message: "Sharing failed." });
        return false;
      }
    },
    [canShare]
  );

  const reset = useCallback(() => setStatus({ state: "idle" }), []);

  return { canShare, status, shareImage, reset };
}
