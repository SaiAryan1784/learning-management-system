export function Modal({ isOpen, onClose, title, children, footer, maxWidth = "max-w-md" }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-charcoal/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={[
          "bg-surface rounded-2xl border border-brand-border w-full shadow-card",
          maxWidth,
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-base font-semibold text-brand-text uppercase tracking-wide">
            {title}
          </h2>
          <button
            className="w-7 h-7 rounded-md hover:bg-canvas text-brand-muted transition-colors flex items-center justify-center"
            onClick={onClose}
          >
            <i className="fa-solid fa-close text-xs"></i>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-brand-border flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
