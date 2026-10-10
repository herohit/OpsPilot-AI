import { Clock3 } from "lucide-react";
import { formatTimeAgo, getDeploymentStatus } from "./dashboardUtils";

function RecentLogsPanel({ deployments, environmentNames }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.035)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Recent Logs</h2>
          <p className="mt-0.5 text-xs text-slate-500">Latest deployment logs</p>
        </div>
        <Clock3 aria-hidden="true" className="h-4 w-4 text-slate-400" />
      </div>
      {deployments.length ? (
        <ul className="divide-y divide-slate-100">
          {deployments.slice(0, 3).map((deployment) => {
            const status = getDeploymentStatus(deployment.status);
            const StatusIcon = status.Icon;
            const environmentName =
              environmentNames.get(deployment.environment_id) ?? "environment";
            return (
              <li key={deployment.id} className="flex items-center gap-3 px-3 py-2">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${status.className}`}>
                  <StatusIcon aria-hidden="true" className="h-3 w-3" />
                </span>
                <p className="min-w-0 flex-1 truncate text-xs text-slate-700">
                  <span className="font-medium">{status.label}</span>
                  <span className="text-slate-500"> · {deployment.version} in {environmentName}</span>
                </p>
                <time className="shrink-0 text-[11px] text-slate-400">
                  {formatTimeAgo(deployment.deployed_at)}
                </time>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-8 text-center text-xs text-slate-400">
          No recent logs to show.
        </p>
      )}
    </div>
  );
}

export default RecentLogsPanel;