const stylesByStatus = {
  healthy: "bg-emerald-50 text-emerald-700",
  active: "bg-emerald-50 text-emerald-700",
  degraded: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-rose-50 text-rose-700",
  "no deployments": "bg-slate-100 text-slate-600",
  "needs setup": "bg-slate-100 text-slate-600",
};

export default function ResourceStatusBadge({ status }) {
  const normalizedStatus = (status || "unknown").toLowerCase();
  const className = stylesByStatus[normalizedStatus] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalizedStatus.replace(/\b\w/g, (character) => character.toUpperCase())}
    </span>
  );
}