import { useState } from "react";
import { onFilePick } from "../../utils/fileInput";

/**
 * Click-anywhere / drag-and-drop upload target for the lesson builder.
 *
 * Deliberately NOT folded into FilePreview's empty state: that component also
 * renders in the builder's preview tab and in the learner view, where the box
 * must stay inert. Authoring affordances live here instead.
 *
 * The whole box is a <label> wrapping the hidden input, so a click anywhere
 * inside it opens the picker with no handler, no ref and no keyboard trap —
 * the label is focusable through the input it owns.
 */
export default function UploadDropzone({
  accept,
  onFile,
  label = "Upload a file",
  hint = "",
  icon = "fa-arrow-up-from-bracket",
  disabled = false,
}) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) onFile(file);
  };

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={[
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
        disabled
          ? "border-brand-border bg-canvas cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-emerald hover:bg-emerald/5",
        dragging ? "border-emerald bg-emerald/10" : "border-brand-border bg-canvas",
      ].join(" ")}
    >
      <i className={`fa-solid ${icon} text-icon text-lg`} />
      <span className="text-xs font-semibold text-brand-text">
        {label}
        <span className="text-brand-muted font-normal"> or drag and drop</span>
      </span>
      {hint && <span className="text-[11px] text-brand-muted">{hint}</span>}
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={onFilePick((file) => onFile(file))}
      />
    </label>
  );
}
