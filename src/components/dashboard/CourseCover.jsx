import { useState } from "react";
import api from "../../api/api";
import { getCourseColor } from "../../utils/courseColor";

const FILE_BASE_URL =
  import.meta.env.VITE_FILE_BASE_URL ||
  (api.defaults.baseURL || "").replace(/\/api$/, "");

const toAbsoluteUrl = (u) =>
  !u ? "" : u.startsWith("http") ? u : `${FILE_BASE_URL}${u}`;

/**
 * The banner strip at the top of a course card.
 *
 * One component for every surface that draws a course (admin grid, drafts,
 * My Courses, the staff dashboard) so a course looks the same everywhere.
 *
 * Two states, and the fallback is not a placeholder to be tidied away later:
 * most courses have no cover, and the brand-coloured band with initials is the
 * intended look for them. A broken image URL falls back to exactly the same
 * band rather than an empty box with a torn-image glyph.
 */
export default function CourseCover({ title, coverImageUrl, className = "" }) {
  const [failed, setFailed] = useState(false);
  const src = toAbsoluteUrl(coverImageUrl);
  const color = getCourseColor();
  const initials = (title || "CO").slice(0, 2).toUpperCase();

  if (src && !failed) {
    return (
      <div className={`relative w-full aspect-[16/9] overflow-hidden bg-canvas ${className}`}>
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full aspect-[16/9] overflow-hidden flex items-center justify-center ${className}`}
      style={{ backgroundColor: color }}
    >
      <span className="text-white/90 text-3xl font-bold tracking-wide">{initials}</span>
    </div>
  );
}
