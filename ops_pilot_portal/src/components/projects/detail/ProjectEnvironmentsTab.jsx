import { Box } from "lucide-react";
import { ProjectEmptyState } from "./ProjectDetailPrimitives";

export default function ProjectEnvironmentsTab({
  environments,
  services,
  deployments,
}) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200/80 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Project Environments
        </h2>
      </div>
      {environments.length ? (
        <div className="divide-y divide-slate-100">
          {environments.map((environment) => {
            const service = services.find(
              (item) => item.id === environment.service_id,
            );
            const count = deployments.filter(
              (deployment) => deployment.environment_id === environment.id,
            ).length;
            return (
              <div
                key={environment.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Box aria-hidden="true" className="h-4 w-4 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {environment.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {service?.name ?? "Service"} ·{" "}
                    {environment.description || "No description"}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {count} deployments
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4">
          <ProjectEmptyState>
            No environments in this project.
          </ProjectEmptyState>
        </div>
      )}
    </section>
  );
}
