export function Spinner({ size = "md", className = "" }) {
  const sizes = { sm: "w-4 h-4 border-[1.5px]", md: "w-6 h-6 border-2", lg: "w-9 h-9 border-[3px]" };
  return (
    <div className={`rounded-full border-solid border-brand-border border-t-emerald animate-spin ${sizes[size]} ${className}`} />
  );
}

export function PageLoader({ label = "" }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <Spinner size="lg" />
      {label && <p className="text-xs text-brand-muted font-medium uppercase tracking-wide">{label}</p>}
    </div>
  );
}

export function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-10">
      <Spinner size="md" />
    </div>
  );
}
