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

  /* pdf.js fetches a PDF in HTTP byte-range requests, and out of the box that is
     64KB per request WITH eager prefetch of the whole document. Measured against
     this backend, ONE 7.8 MB PDF was 63 requests; these options bring it to 4.
     63 is most of a 100/min budget, so two PDFs on a page 429'd partway through
     and the file uploaded fine but refused to preview. 1 MB chunks with autofetch
     off means the xref tail plus only the pages actually scrolled to, which is
     already how PdfPage renders.

     Do NOT "simplify" this to disableRange: true. A PDF's xref table lives at the
     END of the file, so with ranges off pdf.js must download the entire document
     before the load promise resolves, and a big file on a slow line would blow
     LOAD_TIMEOUT_MS instead. */
  rangeChunkSize: 1024 * 1024,
  disableAutoFetch: true,
};

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const LOAD_TIMEOUT_MS = 20000;

/**
 * Turn a pdf.js failure into one plain sentence for the learner.
 *
 * Worth distinguishing: a transport failure points at the server or the link,
 * "isn't a readable PDF" points at the document. Without this the only report we
 * ever get back is "the PDF doesn't work" — and for months that is exactly what
 * happened, because the cases below were written against pdf.js v3 names
 * (MissingPDFException / UnexpectedResponseException) that v5 replaced with a
 * single ResponseException. Every HTTP failure fell through to "" and the user
 * saw a bare "Couldn't show a preview of X.pdf." with no cause at all.
 *
 * These are pdf.js's own exception names — re-check them against
 * pdfjs-dist/build/pdf.mjs on any major upgrade.
 */
function describeLoadError(err) {
  switch (err?.name) {
    case "ResponseException":
      if (err.missing) return "The file could not be found on the server.";
      if (err.status === 429) return "The server is busy — try again in a minute.";
      return `The file could not be reached (HTTP ${err.status || "error"}).`;
    case "InvalidPDFException":
      return "The file isn’t a readable PDF.";
    case "PasswordException":
      return "The file is password-protected.";
    case "UnknownErrorException":
      return "The viewer couldn’t open this file.";
    default:
      return "";
  }
}
const PAGE_GAP = 16; // px between page cards, must match the wrapper's space-y

/** A single page: reserves its layout box immediately, rasterises only once near the viewport. */
function PdfPage({ pdf, pageNumber, containerWidth, zoom, root, onVisible }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [dims, setDims] = useState(null); // unscaled page size, CSS px at scale 1
  const [rendered, setRendered] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Page metadata is cheap relative to rasterising, and we need the real aspect ratio
  // up front or the scroll height jumps around as pages paint in.
  useEffect(() => {
    let cancelled = false;
    pdf.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const vp = page.getViewport({ scale: 1 });
      setDims({ width: vp.width, height: vp.height });
    }).catch((err) => {
      // This used to swallow the error on the theory that the parent's document
      // load would report it. It does not: by the time a page fails, that promise
      // has already resolved, so the only visible effect was a spinner that never
      // stopped and nothing in the console to explain it.
      if (cancelled) return;
      console.error("[PdfViewer] page", pageNumber, "metadata failed", err);
      setFailed(true);
    });
    return () => { cancelled = true; };
  }, [pdf, pageNumber]);

  // Render when the page is anywhere near this viewer's own scroll box, and
  // re-render on zoom/resize.
  //
  // `root` MUST be that scroll box, not the viewport. rootMargin only ever grows
  // the ROOT's rectangle — intersection is still clipped by every scrolling
  // ancestor in between. With root:null this component sits behind two of them
  // (the lesson builder's pane and this viewer's own 480px box), so the 400px
  // prefetch bought nothing at all: a page only rendered once it was physically
  // on screen, and pages 2+ needed the user to find and scroll an inner
  // container they could not see. Every page past the first showed a spinner
  // forever, which is exactly what "the PDF won't preview" turned out to be.
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
      { root, rootMargin: "400px 0px", threshold: [0, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pageNumber, onVisible, root]);

  const scale = dims && containerWidth ? (containerWidth / dims.width) * zoom : 0;

  useLayoutEffect(() => {
    if (!visible || !dims || !scale) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let task = null;
    let cancelled = false;

    // A rejection is not the only way this goes wrong: a page whose content
    // stream is damaged can leave pdf.js's worker running forever, so render()
    // neither resolves nor rejects. The document load has LOAD_TIMEOUT_MS for
    // exactly this; without the same guard here a single bad page sits on a
    // spinner for the rest of the session with nothing in the console.
    const stall = setTimeout(() => {
      if (cancelled) return;
      console.error("[PdfViewer] page", pageNumber, "timed out while rendering");
      setFailed(true);
    }, LOAD_TIMEOUT_MS);

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
        () => {
          clearTimeout(stall);
          if (!cancelled) setRendered(true);
        },
        (err) => {
          clearTimeout(stall);
          // Cancelling on zoom/resize/unmount is normal control flow here.
          // Anything else is a real failure and must not vanish silently.
          if (cancelled || err?.name === "RenderingCancelledException") return;
          console.error("[PdfViewer] page", pageNumber, "render failed", err);
          setFailed(true);
        },
      );
    }).catch((err) => {
      clearTimeout(stall);
      if (cancelled) return;
      console.error("[PdfViewer] page", pageNumber, "failed", err);
      setFailed(true);
    });

    return () => {
      cancelled = true;
      clearTimeout(stall);
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
          {failed ? (
            <span className="px-3 text-center">
              <i className="fa-solid fa-triangle-exclamation text-amber-500" />{" "}
              Page {pageNumber} couldn’t be drawn.
            </span>
          ) : (
            <i className="fa-solid fa-spinner fa-spin" />
          )}
        </div>
      )}
    </div>
  );
}

export default function PdfViewer({ src, fileName, height = 480, className = "" }) {
  const scrollRef = useRef(null);
  // Also kept in state: PdfPage needs this node as its IntersectionObserver root,
  // and a plain ref would not re-run the child's effect once the node attaches.
  const [scrollEl, setScrollEl] = useState(null);
  const setScrollNode = useCallback((node) => {
    scrollRef.current = node;
    setScrollEl(node);
  }, []);
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
        // The on-screen sentence is deliberately non-technical, so keep the raw
        // failure somewhere a screen-share of DevTools can reach it.
        console.error("[PdfViewer] load failed", src, err);
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
    const el = scrollEl;
    if (!el) return;
    const measure = () => {
      const available = el.clientWidth;
      // A zero width means layout has not settled (or an ancestor is collapsed).
      // Committing it would clamp to the 120px floor below and rasterise every
      // page as a thumbnail, which is not recoverable without another resize.
      // Skipping leaves the previous width in place; the ResizeObserver fires
      // again as soon as there is a real box to measure.
      if (available <= 0) return;
      // 32px = the horizontal padding on the scroll container.
      setWidth(Math.max(available - 32, 120));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollEl]);

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
        ref={setScrollNode}
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
                root={scrollEl}
                onVisible={setPage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
