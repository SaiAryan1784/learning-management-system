export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between bg-charcoal rounded-xl px-5 py-4 mb-5">
      <div>
        <h1 className="text-xl font-semibold text-white uppercase tracking-wide">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-white/60 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  );
}
