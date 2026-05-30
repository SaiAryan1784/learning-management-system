import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Spinner } from "./Spinner";

const VARIANTS = {
  primary:
    "bg-emerald text-white border border-emerald hover:bg-emerald-hover hover:border-emerald-hover shadow-soft hover:shadow-elevated focus-visible:shadow-ring-emerald",
  secondary:
    "bg-surface text-charcoal border border-brand-border hover:bg-canvas hover:border-charcoal-muted shadow-soft focus-visible:shadow-ring-emerald",
  ghost:
    "bg-transparent text-charcoal border border-transparent hover:bg-canvas focus-visible:shadow-ring-emerald",
  danger:
    "bg-brand-danger text-white border border-brand-danger hover:bg-brand-danger-hover hover:border-brand-danger-hover shadow-soft hover:shadow-elevated focus-visible:shadow-ring-danger",
  outline:
    "bg-transparent text-emerald border border-emerald hover:bg-emerald-muted focus-visible:shadow-ring-emerald",
  link:
    "bg-transparent text-emerald border border-transparent underline-offset-2 hover:underline px-0 py-0 shadow-none",
};

const SIZES = {
  sm: "text-caption px-3 py-1.5 gap-1.5 rounded-md",
  md: "text-body px-4 py-2 gap-2 rounded-lg",
  lg: "text-body px-5 py-2.5 gap-2 rounded-lg",
};

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    type = "button",
    loading = false,
    disabled = false,
    leadingIcon = null,
    trailingIcon = null,
    fullWidth = false,
    className = "",
    children,
    onClick,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;
  const base =
    "inline-flex items-center justify-center font-semibold select-none outline-none transition-colors transition-shadow duration-250 ease-smooth disabled:opacity-60 disabled:cursor-not-allowed";
  const classes = [
    base,
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { y: -1 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={classes}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" className="!border-white/40 !border-t-white" />
      ) : (
        leadingIcon && <span className="inline-flex">{leadingIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && trailingIcon && <span className="inline-flex">{trailingIcon}</span>}
    </motion.button>
  );
});

export default Button;
export { Button };
