export function formatProjectDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ProjectStatusBadge({ status }) {
  const normalizedStatus = (status || "unknown").toLowerCase();
  const isSuccess =
    normalizedStatus === "success" || normalizedStatus === "healthy";
  const isFailure =
    normalizedStatus === "failed" || normalizedStatus === "cancelled";
  const className = isSuccess
    ? "bg-emerald-50 text-emerald-700"
    : isFailure
      ? "bg-rose-50 text-rose-700"
      : "bg-amber-50 text-amber-700";
  const label = normalizedStatus[0].toUpperCase() + normalizedStatus.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function ProjectEmptyState({ children }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-white px-5 text-center">
      <p className="text-sm text-slate-500">{children}</p>
    </div>
  );
}
