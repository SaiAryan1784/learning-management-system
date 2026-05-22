export function TableContainer({ children, className = "" }) {
  return (
    <div
      className={[
        "bg-surface border border-brand-border rounded-xl overflow-hidden",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
