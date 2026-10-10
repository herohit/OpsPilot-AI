import { Pencil } from "lucide-react";
import { formatProjectDate } from "./ProjectDetailPrimitives";

export default function ProjectSettingsTab({ project, onEdit }) {
  return (
    <section className="max-w-2xl rounded-md border border-slate-200/80 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Project Settings</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">Project name</dt>
          <dd className="mt-1 truncate text-sm font-medium text-slate-800">
            {project.name}
          </dd>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">Created</dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">
            {formatProjectDate(project.created_at)}
          </dd>
        </div>
        <div className="rounded-md bg-slate-50 p-3 sm:col-span-2">
          <dt className="text-xs text-slate-500">Description</dt>
          <dd className="mt-1 text-sm text-slate-800">
            {project.description || "No description"}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onEdit}
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
        Edit project
      </button>
    </section>
  );
}
