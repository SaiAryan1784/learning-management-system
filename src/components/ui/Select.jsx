import { forwardRef } from "react";

const Select = forwardRef(function Select(
  { invalid = false, className = "", children, ...rest },
  ref
) {
  const base =
    "w-full bg-surface text-charcoal rounded-lg border px-3 py-2 text-body outline-none transition-shadow transition-colors duration-250 ease-smooth disabled:opacity-60 disabled:cursor-not-allowed appearance-none pr-9";
  const state = invalid
    ? "border-brand-danger focus:shadow-ring-danger focus:border-brand-danger"
    : "border-brand-border focus:border-emerald focus:shadow-ring-emerald hover:border-charcoal-muted";

  return (
    <div className="relative w-full">
      <select ref={ref} className={`${base} ${state} ${className}`} {...rest}>
        {children}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-muted">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
});

export default Select;
export { Select };
