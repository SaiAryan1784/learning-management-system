export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between bg-charcoal rounded-xl px-6 py-5 mb-5">
      <div>
        <h1 className="text-3xl font-extrabold text-pink-400 uppercase tracking-wide leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm font-medium text-white/80 mt-1">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  );
}
