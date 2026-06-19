import { useRef, useEffect, useCallback } from "react";

/**
 * Clean, bounded signature field: labelled signing area with a dashed baseline and
 * Undo + Clear controls. Strokes are tracked so Undo removes the last stroke. The
 * captured signature is emitted as a PNG data URL via onChange. Shared by the learner
 * view and the builder preview.
 */
export default function SignaturePad({ label = "Sign below", value, onChange }) {
  const canvasRef = useRef(null);
  const strokes = useRef([]); // [[{x,y}, ...], ...]
  const current = useRef(null);
  const drawing = useRef(false);

  const ctxOf = () => canvasRef.current.getContext("2d");

  const scalePoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxOf();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    strokes.current.forEach((stroke) => {
      ctx.beginPath();
      stroke.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    });
  }, []);

  // Restore a previously captured signature image (e.g. when revisiting the lesson).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (value && strokes.current.length === 0) {
      const img = new Image();
      img.onload = () => ctxOf().drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => {
    onChange?.(strokes.current.length ? canvasRef.current.toDataURL("image/png") : "");
  };

  const start = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    current.current = [scalePoint(e)];
  };
  const move = (e) => {
    if (!drawing.current) return;
    current.current.push(scalePoint(e));
    redraw();
    const ctx = ctxOf();
    ctx.beginPath();
    current.current.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (current.current && current.current.length > 1) strokes.current.push(current.current);
    current.current = null;
    redraw();
    emit();
  };

  const undo = () => {
    strokes.current.pop();
    redraw();
    emit();
  };
  const clear = () => {
    strokes.current = [];
    redraw();
    emit();
  };

  return (
    <div className="rounded-xl border border-brand-border bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-brand-text">{label}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={undo}
            className="text-xs font-semibold text-brand-muted hover:text-brand-text"
          >
            <i className="fa-solid fa-rotate-left mr-1" /> Undo
          </button>
          <button
            type="button"
            onClick={clear}
            className="text-xs font-semibold text-brand-muted hover:text-brand-danger"
          >
            <i className="fa-solid fa-eraser mr-1" /> Clear
          </button>
        </div>
      </div>
      <div className="relative rounded-lg border-2 border-dashed border-brand-border bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="block w-full touch-none cursor-crosshair"
          style={{ height: 180 }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
        {/* signature baseline */}
        <div className="pointer-events-none absolute left-6 right-6 bottom-9 border-b border-brand-border" />
        <span className="pointer-events-none absolute left-6 bottom-3 text-[10px] uppercase tracking-wide text-brand-muted">
          Signature
        </span>
      </div>
    </div>
  );
}
