import { ScrollText } from "lucide-react";
import {
  ProjectEmptyState,
  ProjectStatusBadge,
} from "./ProjectDetailPrimitives";

export default function ProjectLogsTab({ logSources }) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200/80 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Log Sources</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Configured sources for project environments
        </p>
      </div>
      {logSources.length ? (
        <div className="divide-y divide-slate-100">
          {logSources.map((source) => (
            <div key={source.id} className="flex items-center gap-3 px-4 py-3">
              <ScrollText
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-blue-600"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {source.stream_url}
                </p>
                <p className="text-xs text-slate-500">{source.source_type}</p>
              </div>
              <ProjectStatusBadge
                status={source.is_active ? "active" : "inactive"}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <ProjectEmptyState>
            No log sources are configured for this project.
          </ProjectEmptyState>
        </div>
      )}
    </section>
  );
}
