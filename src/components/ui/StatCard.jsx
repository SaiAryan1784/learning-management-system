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

const TONE_CLASSES = {
  default: { bg: "bg-emerald-muted", text: "text-emerald" },
  info:    { bg: "bg-blue-100",       text: "text-blue-500" },
  warning: { bg: "bg-amber-100",      text: "text-amber-500" },
  danger:  { bg: "bg-brand-danger/10",text: "text-brand-danger" },
  neutral: { bg: "bg-canvas",         text: "text-brand-muted" },
};

export function StatCard({ icon, label, value, danger = false, tone = "default", trend = null }) {
  const animated = useCountUp(value);
  const { bg, text } = danger ? TONE_CLASSES.danger : (TONE_CLASSES[tone] ?? TONE_CLASSES.default);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
      className="h-full min-w-0 bg-surface border border-brand-border rounded-xl p-5 flex items-center gap-4 shadow-soft hover:shadow-elevated transition-shadow duration-250 ease-smooth"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <i className={`fa-solid ${icon} text-base ${text}`}></i>
      </div>
      <div className="min-w-0">
        <p className="text-caption text-brand-muted uppercase tracking-wide break-words">{label}</p>
        <p className="text-2xl font-bold text-brand-text mt-0.5 tabular-nums">{animated}</p>
        {trend != null && (
          <p
            className={`text-caption mt-1 font-semibold ${
              Number(trend) >= 0 ? "text-emerald-hover" : "text-brand-danger"
            }`}
          >
            {Number(trend) >= 0 ? "↑" : "↓"} {Math.abs(Number(trend))}%
          </p>
        )}
      </div>
    </motion.div>
  );
}
