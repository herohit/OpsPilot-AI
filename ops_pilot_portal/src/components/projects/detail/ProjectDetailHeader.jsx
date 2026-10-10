import { Pencil } from "lucide-react";
import { Link } from "react-router";
import { getProjectIconOption } from "../projectIconOptions";

export default function ProjectDetailHeader({ project, onEdit }) {
  const iconOption = getProjectIconOption(project.icon_key);
  const ProjectIcon = iconOption.Icon;

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-2 text-xs text-slate-500"
      >
        <Link to="/projects" className="shrink-0 hover:text-blue-700">
          Projects
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate font-medium text-slate-700">
          {project.name}
        </span>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-md ${iconOption.colorClassName}`}
          >
            <ProjectIcon aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-slate-900">
              {project.name}
            </h1>
            <p className="mt-1 truncate text-sm text-slate-500">
              {project.description || "No project description"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
          Edit
        </button>
      </header>
    </>
  );
}
