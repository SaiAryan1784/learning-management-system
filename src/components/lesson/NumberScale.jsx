/**
 * Clickable numeric rating scale (1..scaleMax). Selecting N fills 1..N.
 * Controlled: pass `value` + `onChange`. Keyboard accessible (radiogroup +
 * arrow keys). Shared by the learner view and the builder preview so the
 * interaction behaves identically in both.
 */
export default function NumberScale({ value = 0, onChange, scaleMax = 5, disabled = false }) {
  const max = Math.max(2, Math.min(10, Number(scaleMax) || 5));
  const selected = Number(value) || 0;

  const pick = (n) => {
    if (disabled) return;
    onChange?.(n === selected ? 0 : n);
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      pick(Math.min(max, (selected || 0) + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      pick(Math.max(0, (selected || 0) - 1));
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      className="flex flex-wrap gap-2"
      onKeyDown={onKeyDown}
    >
      {Array.from({ length: max }).map((_, i) => {
        const n = i + 1;
        const filled = n <= selected;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === selected}
            aria-label={`${n}`}
            disabled={disabled}
            tabIndex={disabled ? -1 : n === (selected || 1) ? 0 : -1}
            onClick={() => pick(n)}
            className={[
              "w-10 h-10 rounded-lg border text-sm font-bold flex items-center justify-center transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-emerald focus:ring-offset-1",
              disabled ? "cursor-default" : "cursor-pointer",
              filled
                ? "border-emerald bg-emerald text-white"
                : "border-brand-border bg-surface text-brand-muted hover:border-emerald/50 hover:text-brand-text",
            ].join(" ")}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
