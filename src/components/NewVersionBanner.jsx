import { useEffect, useState } from "react";

/**
 * Tells a long-lived tab that the app has been redeployed under it.
 *
 * Why this exists: Vite fingerprints every chunk, and the SPA only fetches
 * index.html once. A tab left open across a deploy keeps requesting chunk
 * hashes that no longer exist on the server, so every lazy route and every
 * dynamic import (the PDF viewer especially) fails with nothing visible to
 * explain it. That has been reported three separate times as a broken feature.
 *
 * `__BUILD_ID__` is baked into this bundle at build time; `build.json` is
 * written unhashed next to it. If the two disagree, this bundle is stale.
 *
 * It NEVER reloads on its own — someone could be halfway through writing a
 * lesson. The refresh is always the user's choice.
 */

const POLL_MS = 5 * 60 * 1000;

// Defined by the `lms-build-id` plugin in vite.config.js. Guarded so the
// component is harmless if it is ever rendered outside that build.
const CURRENT = typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : "";

export default function NewVersionBanner() {
  const [stale, setStale] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!CURRENT) return;
    let cancelled = false;

    const check = async () => {
      // Once we know it's stale there is nothing left to learn — stop asking.
      if (cancelled || stale) return;
      try {
        const res = await fetch(`${import.meta.env.BASE_URL || "/"}build.json`, {
          cache: "no-store",
        });
        if (!res.ok) return; // dev server, or mid-deploy — not evidence of anything
        const data = await res.json();
        if (!cancelled && data?.buildId && data.buildId !== CURRENT) {
          setStale(true);
        }
      } catch {
        // Offline or a blip. Staying quiet is right: a failed check is not a
        // new version, and a false banner trains people to ignore the real one.
      }
    };

    check();
    const timer = setInterval(check, POLL_MS);
    // Coming back to a tab after a while is exactly when it is most likely to
    // be stale, and the cheapest moment to find out.
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [stale]);

  if (!stale || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl bg-charcoal text-white shadow-elevated border border-white/10 max-w-[calc(100vw-2rem)]"
    >
      <i className="fa-solid fa-arrows-rotate text-icon text-sm flex-shrink-0" />
      <span className="text-xs sm:text-sm">
        A new version of the LMS is available.
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white text-charcoal text-xs font-semibold hover:bg-white/90 transition-colors"
      >
        Refresh
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="flex-shrink-0 text-white/50 hover:text-white transition-colors"
      >
        <i className="fa-solid fa-xmark text-xs" />
      </button>
    </div>
  );
}
