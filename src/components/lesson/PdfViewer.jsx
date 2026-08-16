import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

/**
 * PDF viewer that renders pages to <canvas> with pdf.js.
 *
 * We do NOT use `<object type="application/pdf">` / `<iframe>` here. Those hand the
 * file to the browser's built-in viewer, which paints its own dark grey surround and
 * its own toolbar (download + print included). None of that chrome is styleable, and
 * the toolbar cannot be reliably suppressed across browsers. Rendering the pages
 * ourselves is the only way the preview can look like the rest of the site and the
 * only way "hide download" means anything in the UI.
 *
 * Note this is presentation, not access control — see the security note in FilePreview.
 */

/* pdf.js is ~350KB gzipped. Load it on first use so lessons without a PDF never pay
   for it, and memoise the promise so N blocks on one page share a single import. */
let pdfjsPromise = null;
function loadPdfjs() {
  pdfjsPromise ??= import("pdfjs-dist").then((mod) => {
    mod.GlobalWorkerOptions.workerSrc = workerUrl;
    return mod;
  });
  return pdfjsPromise;
}

const BASE = import.meta.env.BASE_URL || "/";
const DOC_OPTIONS = {
  cMapUrl: `${BASE}pdfjs/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${BASE}pdfjs/standard_fonts/`,
};

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const LOAD_TIMEOUT_MS = 20000;

/**
 * Turn a pdf.js failure into one plain sentence for the learner.
 *
 * Worth distinguishing: "could not be reached" points at the link or the
 * server, "isn't a readable PDF" points at the document. Without this the only
 * report we ever get back is "the PDF doesn't work".
 */
function describeLoadError(err) {
  switch (err?.name) {
    case "MissingPDFException":
    case "UnexpectedResponseException":
      return "The file could not be reached.";
    case "InvalidPDFException":
      return "The file isn’t a readable PDF.";
    default:
      return "";
  }
}
const PAGE_GAP = 16; // px between page cards, must match the wrapper's space-y

/** A single page: reserves its layout box immediately, rasterises only once near the viewport. */
function PdfPage({ pdf, pageNumber, containerWidth, zoom, onVisible }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [dims, setDims] = useState(null); // unscaled page size, CSS px at scale 1
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);

  // Page metadata is cheap relative to rasterising, and we need the real aspect ratio
  // up front or the scroll height jumps around as pages paint in.
  useEffect(() => {
    let cancelled = false;
    pdf.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const vp = page.getViewport({ scale: 1 });
      setDims({ width: vp.width, height: vp.height });
    }).catch(() => { /* page-level failure is reported by the parent's doc load */ });
    return () => { cancelled = true; };
  }, [pdf, pageNumber]);

  // Render when the page is anywhere near the viewport, and re-render on zoom/resize.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (entry.intersectionRatio > 0.5) onVisible?.(pageNumber);
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: [0, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pageNumber, onVisible]);

  const scale = dims && containerWidth ? (containerWidth / dims.width) * zoom : 0;

  useLayoutEffect(() => {
    if (!visible || !dims || !scale) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let task = null;
    let cancelled = false;

    pdf.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      // Draw at device resolution, lay out at CSS resolution, or text looks fuzzy on HiDPI.
      // The scaling goes through render's `transform` rather than ctx.setTransform —
      // pdf.js owns the context's transform once it starts rendering.
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      task = page.render({
        canvas,
        viewport,
        transform: dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0],
      });
      task.promise.then(
        () => { if (!cancelled) setRendered(true); },
        () => { /* cancelled mid-render — expected on zoom/unmount */ },
      );
    }).catch(() => { /* handled by the parent */ });

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, pageNumber, scale, visible, dims]);

  const boxHeight = dims && scale ? dims.height * scale : 400;
  const boxWidth = dims && scale ? dims.width * scale : "100%";

  return (
    <div
      ref={wrapRef}
      data-page={pageNumber}
      className="relative mx-auto rounded-lg bg-white shadow-soft overflow-hidden"
      style={{ width: boxWidth, height: boxHeight }}
    >
      <canvas ref={canvasRef} className="block" />
      {!rendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-white text-brand-muted text-xs">
          <i className="fa-solid fa-spinner fa-spin" />
        </div>
      )}
    </div>
  );
}

export default function PdfViewer({ src, fileName, height = 480, className = "" }) {
  const scrollRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorDetail, setErrorDetail] = useState("");
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(0);

  /* ── document ── */
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    let task = null;

    setStatus("loading");
    setErrorDetail("");
    setPdf(null);
    setNumPages(0);
    setPage(1);

    // A stalled fetch never rejects, so without this the viewer spins forever
    // and the learner is left staring at a spinner with no way forward. Time it
    // out into the error state, which offers an escape hatch.
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setErrorDetail("It took too long to load.");
        setStatus("error");
      }
    }, LOAD_TIMEOUT_MS);

    loadPdfjs()
      .then((pdfjs) => {
        if (cancelled) return null;
        task = pdfjs.getDocument({ url: src, ...DOC_OPTIONS });
        return task.promise;
      })
      .then((loaded) => {
        if (!loaded || cancelled) return; // cleanup already destroyed the loading task
        clearTimeout(timeout);
        setPdf(loaded);
        setNumPages(loaded.numPages);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        clearTimeout(timeout);
        setErrorDetail(describeLoadError(err));
        setStatus("error");
      });

    // Lesson navigation mounts and unmounts these constantly; without this each one
    // leaves a live pdf.js worker behind. Destroying the loading task tears down the
    // document it produced too, so there is nothing else to clean up.
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      task?.destroy?.();
    };
  }, [src]);

  /* ── available width drives fit-to-width scale ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      // 32px = the horizontal padding on the scroll container.
      setWidth(Math.max(el.clientWidth - 32, 120));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [status]);

  const goTo = useCallback((n) => {
    const target = Math.min(Math.max(n, 1), numPages);
    const el = scrollRef.current?.querySelector(`[data-page="${target}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setPage(target);
  }, [numPages]);

  const stepZoom = (dir) => {
    const i = ZOOM_STEPS.indexOf(zoom);
    const next = i === -1 ? 1 : ZOOM_STEPS[Math.min(Math.max(i + dir, 0), ZOOM_STEPS.length - 1)];
    setZoom(next);
  };

  const viewportHeight = Math.max(height, 480);

  if (status === "error") {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-brand-border bg-canvas px-4 py-6 text-center text-brand-muted text-xs ${className}`}
        style={{ minHeight: 160 }}
      >
        <i className="fa-solid fa-triangle-exclamation text-amber-500 text-base" />
        <span>
          Couldn’t show a preview of {fileName || "this PDF"}.
          {errorDetail ? ` ${errorDetail}` : ""}
        </span>
        {/* Deliberately offered even when the block hides downloads. Hiding the
            download link is a presentation preference; leaving a learner with a
            broken preview and no way to read the document at all is a dead end.
            Do not "tidy this up" behind the allowDownload flag. */}
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-icon hover:underline inline-flex items-center gap-1.5"
          >
            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
            Open in a new tab instead
          </a>
        )}
      </div>
    );
  }

  const toolBtn =
    "w-7 h-7 rounded-md flex items-center justify-center text-brand-muted hover:text-icon hover:bg-canvas disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-brand-muted transition-colors";

  return (
    <div className={`rounded-lg border border-brand-border bg-surface ${className}`}>
      {/* Our toolbar — deliberately no download and no print control. */}
      <div className="flex items-center justify-between gap-3 border-b border-brand-border px-3 py-2">
        <div className="flex items-center gap-1">
          <button type="button" className={toolBtn} onClick={() => goTo(page - 1)} disabled={page <= 1} title="Previous page">
            <i className="fa-solid fa-chevron-left text-[11px]" />
          </button>
          <span className="text-xs font-semibold text-brand-text tabular-nums px-1">
            {numPages ? `${page} / ${numPages}` : "—"}
          </span>
          <button type="button" className={toolBtn} onClick={() => goTo(page + 1)} disabled={!numPages || page >= numPages} title="Next page">
            <i className="fa-solid fa-chevron-right text-[11px]" />
          </button>
        </div>

        {fileName && (
          <span className="hidden sm:block min-w-0 flex-1 truncate text-center text-xs text-brand-muted" title={fileName}>
            {fileName}
          </span>
        )}

        <div className="flex items-center gap-1">
          <button type="button" className={toolBtn} onClick={() => stepZoom(-1)} disabled={zoom <= ZOOM_STEPS[0]} title="Zoom out">
            <i className="fa-solid fa-minus text-[11px]" />
          </button>
          <span className="text-xs font-semibold text-brand-text tabular-nums w-11 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" className={toolBtn} onClick={() => stepZoom(1)} disabled={zoom >= ZOOM_STEPS.at(-1)} title="Zoom in">
            <i className="fa-solid fa-plus text-[11px]" />
          </button>
          <button type="button" className={toolBtn} onClick={() => setZoom(1)} disabled={zoom === 1} title="Fit to width">
            <i className="fa-solid fa-arrows-left-right-to-line text-[11px]" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative overflow-y-auto overflow-x-auto bg-canvas px-4 py-4"
        style={{ height: viewportHeight }}
      >
        {status === "loading" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-canvas text-brand-muted text-xs">
            <i className="fa-solid fa-spinner fa-spin" /> Loading preview…
          </div>
        )}

        {pdf && (
          <div className="flex flex-col items-center" style={{ gap: PAGE_GAP }}>
            {Array.from({ length: numPages }, (_, i) => (
              <PdfPage
                key={i + 1}
                pdf={pdf}
                pageNumber={i + 1}
                containerWidth={width}
                zoom={zoom}
                onVisible={setPage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
