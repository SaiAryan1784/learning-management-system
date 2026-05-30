import { motion } from "framer-motion";

export default function EmptyState({
  icon = null,
  title = "Nothing here yet",
  description = "",
  action = null,
  className = "",
  compact = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center justify-center text-center ${compact ? "py-8" : "py-16"} px-6 ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-emerald-muted text-emerald flex items-center justify-center mb-4 text-2xl">
          {icon}
        </div>
      )}
      <h3 className="text-subheading text-charcoal mb-1">{title}</h3>
      {description && (
        <p className="text-body text-brand-muted max-w-md mb-4">{description}</p>
      )}
      {action}
    </motion.div>
  );
}

export { EmptyState };
