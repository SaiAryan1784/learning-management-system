import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { invalid = false, className = "", leadingIcon = null, trailingIcon = null, ...rest },
  ref
) {
  const base =
    "w-full bg-surface text-charcoal placeholder:text-brand-muted rounded-lg border px-3 py-2 text-body outline-none transition-shadow transition-colors duration-250 ease-smooth disabled:opacity-60 disabled:cursor-not-allowed";
  const state = invalid
    ? "border-brand-danger focus:shadow-ring-danger focus:border-brand-danger"
    : "border-brand-border focus:border-emerald focus:shadow-ring-emerald hover:border-charcoal-muted";

  if (leadingIcon || trailingIcon) {
    return (
      <div className="relative w-full">
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          className={`${base} ${state} ${leadingIcon ? "pl-9" : ""} ${trailingIcon ? "pr-9" : ""} ${className}`}
          {...rest}
        />
        {trailingIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted">
            {trailingIcon}
          </span>
        )}
      </div>
    );
  }

  return <input ref={ref} className={`${base} ${state} ${className}`} {...rest} />;
});

const Textarea = forwardRef(function Textarea(
  { invalid = false, className = "", rows = 4, ...rest },
  ref
) {
  const base =
    "w-full bg-surface text-charcoal placeholder:text-brand-muted rounded-lg border px-3 py-2 text-body outline-none transition-shadow transition-colors duration-250 ease-smooth disabled:opacity-60 disabled:cursor-not-allowed resize-y";
  const state = invalid
    ? "border-brand-danger focus:shadow-ring-danger focus:border-brand-danger"
    : "border-brand-border focus:border-emerald focus:shadow-ring-emerald hover:border-charcoal-muted";
  return <textarea ref={ref} rows={rows} className={`${base} ${state} ${className}`} {...rest} />;
});

export default Input;
export { Input, Textarea };
