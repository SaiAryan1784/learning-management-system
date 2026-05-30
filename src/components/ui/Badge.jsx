const TONES = {
  success: "bg-emerald-light text-emerald-hover",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-brand-danger",
  info: "bg-blue-100 text-brand-info",
  neutral: "bg-canvas text-brand-muted border border-brand-border",
  charcoal: "bg-charcoal text-white",
};

const SIZES = {
  sm: "text-[0.6875rem] px-1.5 py-0.5",
  md: "text-caption px-2 py-0.5",
  lg: "text-caption px-2.5 py-1",
};

export default function Badge({
  tone = "neutral",
  size = "md",
  icon = null,
  dot = false,
  className = "",
  children,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap ${TONES[tone] || TONES.neutral} ${SIZES[size] || SIZES.md} ${className}`}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-current"
          style={{ opacity: 0.85 }}
        />
      )}
      {icon && <span className="inline-flex">{icon}</span>}
      {children}
    </span>
  );
}

export { Badge };
