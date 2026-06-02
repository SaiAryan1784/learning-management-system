import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { invalid = false, className = "", leadingIcon = null, trailingIcon = null, ...rest },
  ref
) {
  const base =
    "w-full bg-surface text-charcoal placeholder:text-brand-muted rounded-lg border py-2 text-body outline-none transition-shadow transition-colors duration-250 ease-smooth disabled:opacity-60 disabled:cursor-not-allowed";
  const state = invalid
    ? "border-brand-danger focus:shadow-ring-danger focus:border-brand-danger"
    : "border-brand-border focus:border-emerald focus:shadow-ring-emerald hover:border-charcoal-muted";

  if (leadingIcon || trailingIcon) {
    return (
      <div className="relative w-full">
        {leadingIcon && (
          <span className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-brand-muted pointer-events-none z-10">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          className={`${base} ${state} ${leadingIcon ? "pl-10" : "pl-3"} ${trailingIcon ? "pr-10" : "pr-3"} ${className}`}
          {...rest}
        />
        {trailingIcon && (
          <span className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-brand-muted z-10">
            {trailingIcon}
          </span>
        )}
      </div>
    );
  }

  return <input ref={ref} className={`${base} ${state} px-3 ${className}`} {...rest} />;
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
