import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = "max-w-md" }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-charcoal/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={[
              "bg-surface rounded-2xl border border-brand-border w-full shadow-floating",
              maxWidth,
            ].join(" ")}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <h2 className="text-base font-semibold text-brand-text uppercase tracking-wide">
                {title}
              </h2>
              <button
                className="w-7 h-7 rounded-md hover:bg-canvas text-brand-muted transition-colors flex items-center justify-center"
                onClick={onClose}
                aria-label="Close"
              >
                <i className="fa-solid fa-close text-xs"></i>
              </button>
            </div>

            <div className="px-6 py-5">{children}</div>

            {footer && (
              <div className="px-6 py-4 border-t border-brand-border flex gap-3 justify-end">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
