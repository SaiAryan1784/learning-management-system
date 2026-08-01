import { useEffect, useState } from "react";
import PdfViewer from "./PdfViewer";

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
 *
 * SECURITY: `allowDownload={false}` hides the download and open-in-new-tab links, and
 * the canvas-based PDF viewer gives the browser no download button of its own. It is
 * NOT access control — /uploads is served as unauthenticated static files, so anyone
 * with the URL can still fetch the file. Enforcing that needs an authenticated
 * streaming route, which this component cannot provide.
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

/**
 * Whether an attach_file block should show its download link.
 * Hidden unless explicitly enabled — blocks saved before `hideDownload` existed have no
 * key at all, and those must default to hidden too. Single source of truth for the
 * builder editor, the builder preview tab and the learner view.
 */
export function allowsDownload(config = {}) {
  return config.hideDownload === false;
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
  allowDownload = true,
  className = "",
}) {
  const kind = resolveFileKind({ mimeType, src, fileName });
  // PdfViewer tracks its own loading state, so only the img/video paths need this.
  const [status, setStatus] = useState(() => (src ? "ready" : "empty"));

  useEffect(() => {
    setStatus(src ? "ready" : "empty");
  }, [src, kind]);

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
      {allowDownload && (
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-icon hover:underline"
        >
          <i className="fa-solid fa-download mr-1" />
          Download {fileName || "file"}
        </a>
      )}
    </div>
  );

  // Audio + generic files have no load skeleton worth showing.
  if (kind === "audio") {
    return (
      <div className={`rounded-lg border border-brand-border bg-canvas p-3 ${className}`}>
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-brand-text">
          <i className="fa-solid fa-music text-icon" />
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
            <i className="fa-solid fa-file text-icon" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-text truncate">{fileName || "File"}</p>
            {allowDownload && (
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-icon hover:underline"
              >
                <i className="fa-solid fa-download mr-1" />
                Download
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PdfViewer brings its own bordered container and loading/error states, so it sits
  // outside the shared wrapper below.
  if (kind === "pdf") {
    return (
      <div className={className}>
        <PdfViewer src={src} fileName={fileName} height={height} />
        {allowDownload && (
          <div className="border border-t-0 border-brand-border rounded-b-lg px-3 py-2 bg-surface flex items-center gap-4 -mt-px">
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-icon hover:underline inline-flex items-center gap-1.5"
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
              className="text-xs font-semibold text-icon hover:underline inline-flex items-center gap-1.5"
            >
              <i className="fa-solid fa-download text-[10px]" />
              Download {fileName || "PDF"}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    // overflow-hidden is safe here now that PDFs render in their own container — it
    // only clips the img/video corners to the rounded border, which is intended.
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

    </div>
  );
}
