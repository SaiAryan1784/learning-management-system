import { motion } from "framer-motion";
import { forwardRef } from "react";

const Card = forwardRef(function Card(
  {
    as = "div",
    interactive = false,
    padded = true,
    className = "",
    children,
    onClick,
    ...rest
  },
  ref
) {
  const base = "bg-surface border border-brand-border rounded-xl shadow-soft";
  const pad = padded ? "p-4" : "";
  const hover = interactive
    ? "cursor-pointer hover:shadow-elevated hover:border-charcoal-muted/30"
    : "";

  const MotionTag = motion[as] || motion.div;

  return (
    <MotionTag
      ref={ref}
      onClick={onClick}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`${base} ${pad} ${hover} transition-shadow transition-colors duration-250 ease-smooth ${className}`}
      {...rest}
    >
      {children}
    </MotionTag>
  );
});

export default Card;
export { Card };
