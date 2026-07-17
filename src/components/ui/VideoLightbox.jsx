import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

export default function VideoLightbox({ isOpen, youtubeId, title, onClose }) {
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
      {isOpen && youtubeId && (
        <motion.div
          key="video-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-charcoal/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            key="video-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-3xl"
          >
            <button
              onClick={onClose}
              aria-label="Close video"
              className="absolute -top-3 -right-3 md:-top-4 md:-right-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-brand-text shadow-floating hover:bg-canvas transition-colors z-[61]"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>

            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-floating bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                title={title || "Tutorial video"}
                className="absolute inset-0 h-full w-full"
                frameBorder="0"
                allow="accelerated-download; autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>

            {title && (
              <p className="mt-3 text-center text-sm text-white/90">{title}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
