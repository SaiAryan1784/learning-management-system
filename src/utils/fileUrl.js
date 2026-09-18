import api from "../api/api";

/**
 * Where uploaded files are served from, and how to resolve one.
 *
 * Four screens each derived this themselves with
 * `api.defaults.baseURL.replace("/api", "")`, which is unanchored: the FIRST
 * "/api" in "https://api.learningopts.com/api" is the one inside "//api...",
 * so it produced "https:/.learningopts.com/api" and every image on those pages
 * rendered as a broken icon — the organization logo, the certificate template,
 * course covers and issued certificate designs.
 *
 * One definition, anchored to the end, with the explicit env var winning.
 */
export const FILE_BASE_URL =
  import.meta.env.VITE_FILE_BASE_URL ||
  (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

/** Absolute URL for a stored file. Already-absolute URLs pass through. */
export const toAbsoluteUrl = (u) =>
  !u ? "" : /^https?:\/\//i.test(u) ? u : `${FILE_BASE_URL}${u}`;
