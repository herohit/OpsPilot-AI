import { Rocket, Server } from "lucide-react";
import { formatTimeAgo, getDeploymentStatus } from "./dashboardUtils";

export default function DeploymentsPanel({ deployments, environmentNames }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.035)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Deployments</h2>
          <p className="mt-0.5 text-xs text-slate-500">Latest release activity</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-600">
          {deployments.length} total
        </span>
      </div>
      {deployments.length ? (
        <div className="divide-y divide-slate-100">
          {deployments.slice(0, 4).map((deployment) => {
            const status = getDeploymentStatus(deployment.status);
            const StatusIcon = status.Icon;
            const environmentName =
              environmentNames.get(deployment.environment_id) ??
              `env-${deployment.environment_id?.slice(0, 6) ?? "unknown"}`;
            return (
              <div
                key={deployment.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Server aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {deployment.version}
                    </p>
                    <p className="truncate text-xs text-slate-500">{environmentName}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${status.className}`}>
                  <StatusIcon aria-hidden="true" className="h-3 w-3" />
                  {status.label}
                </span>
                <time className="col-start-2 text-right text-[11px] text-slate-400 sm:col-start-auto">
                  {formatTimeAgo(deployment.deployed_at)}
                </time>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-36 flex-col items-center justify-center px-4 text-center">
          <Rocket aria-hidden="true" className="h-5 w-5 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-600">No deployments yet</p>
          <p className="mt-1 text-xs text-slate-400">New releases will appear here.</p>
        </div>
      )}
    </div>
  );
}