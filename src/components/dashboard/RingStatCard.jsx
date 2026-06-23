import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, useState } from "react";

// Dashboard-only KPI card: solid colored background, small uppercase label up top,
// and a large SVG ring with the stat number in white bold at its center. Mirrors the
// client's reference screenshot. The shared monochrome StatCard (used in compliance
// reports) is intentionally left untouched.

function useCountUp(target) {
  const numeric = Number(target);
  const isNumeric = Number.isFinite(numeric);
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(isNumeric ? 0 : target);

  useEffect(() => {
    if (!isNumeric) {
      setDisplay(target);
      return;
    }
    const controls = animate(mv, numeric, {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [numeric, isNumeric, target, mv]);

  return display;
}

export default function RingStatCard({ label, value, color, size = 104, stroke = 9 }) {
  const animated = useCountUp(value);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div
      className="rounded-2xl px-4 py-5 flex flex-col items-center text-center shadow-soft"
      style={{ backgroundColor: color }}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/85 mb-3 leading-tight break-words">
        {label}
      </p>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            stroke="rgba(255,255,255,0.25)"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke="#ffffff"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-extrabold text-white tabular-nums">{animated}</span>
        </div>
      </div>
    </div>
  );
}
