import { motion } from "framer-motion";

export function ProgressBar({ percent = 0, size = "md", showLabel = false, label = "" }) {
  const clamped = Math.max(0, Math.min(100, percent));

  const heights = { xs: "h-1", sm: "h-1.5", md: "h-2", lg: "h-2.5" };
  const h = heights[size] ?? heights.md;

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label ? <span className="text-xs text-brand-muted">{label}</span> : <span />}
          {showLabel && (
            <span className="text-xs font-semibold text-brand-text tabular-nums">{clamped}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-brand-border/60 rounded-full overflow-hidden ${h}`}>
        <motion.div
          className="h-full bg-emerald rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
