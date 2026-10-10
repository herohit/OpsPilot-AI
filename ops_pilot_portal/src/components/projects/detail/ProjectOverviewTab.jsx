import { CheckCircle2, Layers, Rocket } from "lucide-react";
import {
  ProjectEmptyState,
  ProjectStatusBadge,
} from "./ProjectDetailPrimitives";

export default function ProjectOverviewTab({
  stats,
  deployments,
  environmentById,
  services,
  environments,
  onViewDeployments,
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map(({ label, value, Icon, color }) => (
          <div
            key={label}
            className="flex min-h-[76px] items-center gap-3 rounded-md border border-slate-200/80 bg-white px-3 py-2 shadow-[0_2px_10px_rgba(15,23,42,0.03)]"
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${color}`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-0.5 text-lg font-semibold leading-none tabular-nums text-slate-900">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-md border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Recent Deployments
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Latest releases across this project
              </p>
            </div>
            <button
              type="button"
              onClick={onViewDeployments}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              View all
            </button>
          </div>
          {deployments.length ? (
            <div className="divide-y divide-slate-100">
              {deployments.slice(0, 5).map((deployment) => (
                <div
                  key={deployment.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(5rem,0.6fr)_auto]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-600">
                      <Rocket aria-hidden="true" className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {deployment.version}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {deployment.commit_sha?.slice(0, 7)}
                      </p>
                    </div>
                  </div>
                  <span className="hidden truncate text-xs text-slate-500 sm:block">
                    {environmentById.get(deployment.environment_id)?.name ??
                      "Environment"}
                  </span>
                  <ProjectStatusBadge status={deployment.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <ProjectEmptyState>
                No deployments for this project yet.
              </ProjectEmptyState>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-md border border-slate-200/80 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Services</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Services in this project
            </p>
          </div>
          {services.length ? (
            <ul className="divide-y divide-slate-100">
              {services.slice(0, 5).map((service) => {
                const count = environments.filter(
                  (environment) => environment.service_id === service.id,
                ).length;
                return (
                  <li
                    key={service.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-indigo-50 text-indigo-600">
                      <Layers aria-hidden="true" className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {service.name}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {count} {count === 1 ? "environment" : "environments"}
                      </p>
                    </div>
                    <CheckCircle2
                      aria-label="Service configured"
                      className="h-4 w-4 shrink-0 text-emerald-500"
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4">
              <ProjectEmptyState>
                No services have been added yet.
              </ProjectEmptyState>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
