export function StatCard({ icon, label, value, danger = false }) {
  return (
    <div className="bg-surface border border-brand-border rounded-xl p-5 flex items-center gap-4">
      <div
        className={[
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          danger ? "bg-brand-danger/10" : "bg-emerald/10",
        ].join(" ")}
      >
        <i
          className={[
            `fa-solid ${icon} text-sm`,
            danger ? "text-brand-danger" : "text-emerald",
          ].join(" ")}
        ></i>
      </div>
      <div>
        <p className="text-xs text-brand-muted uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-brand-text mt-0.5">{value}</p>
      </div>
    </div>
  );
}
