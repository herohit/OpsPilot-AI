import { TriangleAlert } from "lucide-react";

const resourceUsage = [
  { label: "CPU", value: 42, color: "bg-blue-500" },
  { label: "Memory", value: 68, color: "bg-emerald-500" },
  { label: "Storage", value: 35, color: "bg-amber-500" },
];

export default function ResourceUsagePanel() {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.035)]">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Resource Usage</h2>
          <p className="mt-0.5 text-xs text-slate-500">Sample telemetry</p>
        </div>
        <TriangleAlert aria-hidden="true" className="h-4 w-4 text-amber-500" />
      </div>
      <div className="mt-4 space-y-3">
        {resourceUsage.map(({ label, value, color }) => (
          <div key={label} className="grid grid-cols-[3.25rem_minmax(0,1fr)_2.5rem] items-center gap-3">
            <span className="text-xs font-medium text-slate-600">{label}</span>
            <div
              role="progressbar"
              aria-label={`${label} usage`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
              className="h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
            </div>
            <span className="text-right text-xs font-semibold tabular-nums text-slate-600">{value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}