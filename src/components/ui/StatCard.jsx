import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

function useCountUp(target) {
  const isNumeric =
    typeof target === "number" ||
    (typeof target === "string" && /^-?\d+(\.\d+)?$/.test(target.trim()));
  const numeric = isNumeric ? Number(target) : null;
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(isNumeric ? 0 : target);

  useEffect(() => {
    if (!isNumeric) {
      setDisplay(target);
      return;
    }
    const controls = animate(mv, numeric, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        const isInt = Number.isInteger(numeric);
        setDisplay(isInt ? Math.round(v) : v.toFixed(1));
      },
    });
    return controls.stop;
  }, [numeric, isNumeric, target, mv]);

  return display;
}

// `tone` / `danger` are still accepted so existing callers don't break, but the card is
// intentionally monochrome now (mirrors the course-card look the client liked — no colour).
export function StatCard({ icon, label, value, danger = false, tone = "default", trend = null }) {
  const animated = useCountUp(value);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
      className="h-full min-w-0 bg-surface border border-brand-border rounded-xl overflow-hidden shadow-soft hover:shadow-elevated transition-shadow duration-250 ease-smooth"
    >
      {/* Neutral grey top strip — same silhouette as the course card, without the colour */}
      <div className="h-1 w-full bg-brand-border" />
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-canvas border border-brand-border flex items-center justify-center flex-shrink-0">
          <i className={`fa-solid ${icon} text-sm text-brand-muted`}></i>
        </div>
        <div className="min-w-0">
          <p className="text-caption text-brand-muted uppercase tracking-wide break-words">{label}</p>
          <p className="text-2xl font-bold text-brand-text leading-tight tabular-nums">{animated}</p>
          {trend != null && (
            <p
              className={`text-caption mt-0.5 font-semibold ${
                Number(trend) >= 0 ? "text-emerald-hover" : "text-brand-danger"
              }`}
            >
              {Number(trend) >= 0 ? "↑" : "↓"} {Math.abs(Number(trend))}%
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
