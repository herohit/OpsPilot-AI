import { Rocket } from "lucide-react";
import {
  ProjectEmptyState,
  ProjectStatusBadge,
  formatProjectDate,
} from "./ProjectDetailPrimitives";

export default function ProjectDeploymentsTab({
  deployments,
  environmentById,
}) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200/80 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Project Deployments
        </h2>
      </div>
      {deployments.length ? (
        <div className="divide-y divide-slate-100">
          {deployments.map((deployment) => (
            <div
              key={deployment.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(7rem,0.7fr)_auto_auto]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Rocket
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-indigo-600"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {deployment.version}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {deployment.commit_sha}
                  </p>
                </div>
              </div>
              <span className="hidden truncate text-xs text-slate-500 sm:block">
                {environmentById.get(deployment.environment_id)?.name ??
                  "Environment"}
              </span>
              <time className="hidden text-xs text-slate-400 sm:block">
                {formatProjectDate(deployment.deployed_at)}
              </time>
              <ProjectStatusBadge status={deployment.status} />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <ProjectEmptyState>No deployments in this project.</ProjectEmptyState>
        </div>
      )}
    </section>
  );
}
