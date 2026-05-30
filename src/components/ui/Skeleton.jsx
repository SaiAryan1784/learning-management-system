const SHIMMER =
  "relative overflow-hidden bg-canvas before:content-[''] before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:animate-[shimmer_1.6s_linear_infinite]";

function Skeleton({ className = "", style }) {
  return (
    <div
      className={`${SHIMMER} rounded-md ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, #EEF2F7 0px, #F5F7FA 40px, #EEF2F7 80px)",
        backgroundSize: "400px 100%",
        animation: "shimmer 1.6s linear infinite",
        ...style,
      }}
    />
  );
}

function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{
            width: `${100 - i * 8}%`,
            backgroundImage:
              "linear-gradient(90deg, #EEF2F7 0px, #F5F7FA 40px, #EEF2F7 80px)",
            backgroundSize: "400px 100%",
            animation: "shimmer 1.6s linear infinite",
          }}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className = "" }) {
  return (
    <div className={`rounded-xl border border-brand-border bg-surface p-4 shadow-soft ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

function SkeletonRow({ cols = 5, className = "" }) {
  return (
    <tr className={className}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="rounded-xl border border-brand-border bg-surface overflow-hidden">
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Skeleton;
export { Skeleton, SkeletonText, SkeletonCard, SkeletonRow, SkeletonTable };
