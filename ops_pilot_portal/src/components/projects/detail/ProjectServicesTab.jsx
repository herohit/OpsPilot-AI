import { Layers } from "lucide-react";
import { ProjectEmptyState } from "./ProjectDetailPrimitives";

export default function ProjectServicesTab({ services, environments }) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200/80 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Project Services
        </h2>
      </div>
      {services.length ? (
        <div className="divide-y divide-slate-100">
          {services.map((service) => {
            const count = environments.filter(
              (environment) => environment.service_id === service.id,
            ).length;
            return (
              <div
                key={service.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Layers aria-hidden="true" className="h-4 w-4 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {service.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {service.description || "No description"}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {count} environments
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4">
          <ProjectEmptyState>No services in this project.</ProjectEmptyState>
        </div>
      )}
    </section>
  );
}
