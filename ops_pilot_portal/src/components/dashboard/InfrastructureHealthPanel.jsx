import { Activity } from "lucide-react";

export default function InfrastructureHealthPanel({ healthCounts }) {
  const healthTotal =
    healthCounts.healthy + healthCounts.degraded + healthCounts.unhealthy;
  const healthyEnd = healthTotal
    ? (healthCounts.healthy / healthTotal) * 100
    : 0;
  const degradedEnd = healthTotal
    ? healthyEnd + (healthCounts.degraded / healthTotal) * 100
    : 0;
  const healthItems = [
    { label: "Healthy", count: healthCounts.healthy, color: "bg-emerald-500" },
    { label: "Degraded", count: healthCounts.degraded, color: "bg-amber-400" },
    { label: "Unhealthy", count: healthCounts.unhealthy, color: "bg-rose-500" },
  ];

  return (
    <div className="flex flex-col rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.035)]">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Infrastructure Health
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Deployment status overview
          </p>
        </div>
        <Activity aria-hidden="true" className="h-4 w-4 text-emerald-600" />
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:justify-around">
        <div
          role="img"
          aria-label={`${healthCounts.healthy} healthy, ${healthCounts.degraded} degraded, ${healthCounts.unhealthy} unhealthy deployments`}
          className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full"
          style={{
            background:
              healthTotal > 0
                ? `conic-gradient(#10b981 0% ${healthyEnd}%, #fbbf24 ${healthyEnd}% ${degradedEnd}%, #f43f5e ${degradedEnd}% 100%)`
                : "conic-gradient(#e2e8f0 0% 100%)",
          }}
        >
          <div className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-white text-center">
            <div>
              <p className="text-xl font-semibold leading-none tabular-nums text-slate-900">
                {healthTotal}
              </p>
              <p className="mt-1 whitespace-nowrap text-[9px] leading-3 text-slate-500">
                Deployments
              </p>
            </div>
          </div>
        </div>
        <ul className="min-w-36 space-y-2">
          {healthItems.map(({ label, count, color }) => (
            <li key={label} className="flex items-center gap-2 text-xs">
              <span className={`h-2 w-2 rounded-full ${color}`} />
              <span className="flex-1 text-slate-500">{label}</span>
              <span className="font-semibold tabular-nums text-slate-700">
                {count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
