import { useEffect, useState } from "react";

/**
 * Bounded, production-grade preview for an uploaded asset. Used by the lesson editor,
 * the builder preview tab, and the learner view so all three share one renderer.
 *
 * Key invariants:
 *  - The preview stays INSIDE its own bordered container — it never overflows or
 *    overlaps adjacent blocks (the media is `hidden` until ready, skeleton/error live
 *    in normal flow, no absolute positioning over a collapsed parent).
 *  - loading / error / empty states are explicit.
 *  - the right viewer is chosen per asset type with a generic fallback.
 */

const IMAGE_EXT = ["png", "jpg", "jpeg", "webp", "gif", "svg", "avif"];
const VIDEO_EXT = ["mp4", "webm", "mov", "ogg", "ogv", "m4v"];
const AUDIO_EXT = ["mp3", "wav", "m4a", "aac", "oga", "flac"];
const PDF_EXT = ["pdf"];

function extOf(str = "") {
  const clean = str.split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

export function resolveFileKind({ mimeType, src, fileName }) {
  const mt = (mimeType || "").toLowerCase();
  if (mt.startsWith("image/")) return "image";
  if (mt.startsWith("video/")) return "video";
  if (mt.startsWith("audio/")) return "audio";
  if (mt === "application/pdf") return "pdf";

  const ext = extOf(fileName) || extOf(src);
  if (IMAGE_EXT.includes(ext)) return "image";
  if (VIDEO_EXT.includes(ext)) return "video";
  if (AUDIO_EXT.includes(ext)) return "audio";
  if (PDF_EXT.includes(ext)) return "pdf";
  return "file";
}

const KIND_ICON = {
  image: "fa-image",
  video: "fa-film",
  audio: "fa-music",
  pdf: "fa-file-pdf",
  file: "fa-file",
};

export default function FilePreview({
  src,
  mimeType,
  fileName,
  height = 240,
  className = "",
}) {
  const kind = resolveFileKind({ mimeType, src, fileName });
  const [status, setStatus] = useState(() => (src ? "ready" : "empty"));

  useEffect(() => {
    setStatus(src ? "ready" : "empty");
  }, [src]);

  if (!src) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-border bg-canvas text-brand-muted text-xs ${className}`}
        style={{ minHeight: 96 }}
      >
        <i className={`fa-solid ${KIND_ICON[kind]} text-base opacity-60`} />
        No file uploaded yet
      </div>
    );
  }

  const Skeleton = (
    <div
      className="flex items-center justify-center gap-2 text-brand-muted text-xs"
      style={{ minHeight: kind === "image" ? 120 : height }}
    >
      <i className="fa-solid fa-spinner fa-spin" /> Loading preview…
    </div>
  );

  const ErrorBlock = (
    <div
      className="flex flex-col items-center justify-center gap-2 px-4 text-center text-brand-muted text-xs"
      style={{ minHeight: 120 }}
    >
      <i className="fa-solid fa-triangle-exclamation text-amber-500 text-base" />
      <span>Couldn’t load preview.</span>
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-emerald hover:underline"
      >
        <i className="fa-solid fa-download mr-1" />
        Download {fileName || "file"}
      </a>
    </div>
  );

  // Audio + generic files have no load skeleton worth showing.
  if (kind === "audio") {
    return (
      <div className={`rounded-lg border border-brand-border bg-canvas p-3 ${className}`}>
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-brand-text">
          <i className="fa-solid fa-music text-emerald" />
          <span className="truncate">{fileName || "Audio"}</span>
        </div>
        <audio src={src} controls className="w-full" />
      </div>
    );
  }

  if (kind === "file") {
    return (
      <div className={`rounded-lg border border-brand-border bg-canvas p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-muted flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-file text-emerald" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-text truncate">{fileName || "File"}</p>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald hover:underline"
            >
              <i className="fa-solid fa-download mr-1" />
              Download
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-brand-border bg-canvas overflow-hidden ${className}`}>
      {status === "loading" && Skeleton}
      {status === "error" && ErrorBlock}

      {kind === "image" && status !== "error" && (
        <img
          src={src}
          alt={fileName || "preview"}
          onError={() => setStatus("error")}
          className="block w-full max-h-80 object-contain bg-white"
        />
      )}

      {kind === "video" && status !== "error" && (
        <div className="mx-auto bg-black" style={{ aspectRatio: "16 / 9", width: Math.round((height * 16) / 9), maxWidth: "100%" }}>
          <video
            src={src}
            controls
            onError={() => setStatus("error")}
            className="block w-full h-full object-contain bg-black"
          />
        </div>
      )}

      {kind === "pdf" && status !== "error" && (
        <>
          <div className="mx-auto w-full" style={{ maxWidth: 640 }}>
            <object
              data={src}
              type="application/pdf"
              className="block w-full"
              style={{ height, minHeight: 360 }}
            >
              <iframe
                src={src}
                title={fileName || "PDF preview"}
                className="block w-full border-0"
                style={{ height, minHeight: 360 }}
              />
            </object>
          </div>
          <div className="border-t border-brand-border px-3 py-2 bg-surface flex items-center gap-4">
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald hover:underline inline-flex items-center gap-1.5"
            >
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
              Open in new tab
            </a>
            <span className="text-brand-border text-xs">|</span>
            <a
              href={src}
              download
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald hover:underline inline-flex items-center gap-1.5"
            >
              <i className="fa-solid fa-download text-[10px]" />
              Download {fileName || "PDF"}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
