import { useRef } from "react";
import {
  Box,
  Clock3,
  Layers,
  MoreHorizontal,
  Pencil,
  Rocket,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link } from "react-router";
import { getProjectIconOption } from "./projectIconOptions";

const formatUpdatedDate = (dateValue) => {
  if (!dateValue) return "Recently updated";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return `Updated ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  })}`;
};

export default function ProjectCard({
  project,
  serviceCount,
  environmentCount,
  deploymentCount,
  ownerName,
  ownerInitials,
  onEdit,
  onDelete,
}) {
  const actionsMenu = useRef(null);
  const projectIcon = getProjectIconOption(project.icon_key);
  const ProjectIcon = projectIcon.Icon;

  return (
    <article className="group relative flex min-h-[188px] cursor-pointer flex-col overflow-hidden rounded-md border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <Link
        to={`/projects/${project.id}`}
        aria-label={`Open project ${project.name}`}
        className="absolute inset-0 z-0 rounded-md focus-visible:outline-2 focus-visible:outline-blue-600"
      />
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${projectIcon.colorClassName}`}
          >
            <ProjectIcon
              aria-hidden="true"
              className="h-4 w-4"
              strokeWidth={1.9}
            />
          </span>
          <div className="min-w-0 flex-1 self-center">
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {project.name}
            </h2>
          </div>
        </div>
        <details
          ref={actionsMenu}
          className="pointer-events-auto relative z-20 shrink-0"
        >
          <summary
            aria-label={`Actions for ${project.name}`}
            title="Project actions"
            className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden"
          >
            <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
          </summary>
          <div className="absolute right-0 top-9 z-20 min-w-36 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                actionsMenu.current.open = false;
                onEdit(project);
              }}
              className="flex h-9 w-full items-center gap-2 rounded px-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Pencil aria-hidden="true" className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                actionsMenu.current.open = false;
                onDelete(project);
              }}
              className="flex h-9 w-full items-center gap-2 rounded px-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Delete
            </button>
          </div>
        </details>
      </div>

      <p className="mt-2 line-clamp-1 min-h-5 text-xs leading-5 text-slate-500">
        {project.description || "No project description"}
      </p>

      <div className="mt-3 grid grid-cols-3 border-y border-slate-100 py-2">
        <div className="flex min-w-0 items-center justify-center gap-1.5 px-1">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-600">
            <Layers aria-hidden="true" className="h-3 w-3" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-none tabular-nums text-slate-800">
              {serviceCount}
            </p>
            <p className="mt-1 truncate text-[9px] leading-none text-slate-500">
              {serviceCount === 1 ? "Service" : "Services"}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 items-center justify-center gap-1.5 border-l border-slate-100 px-1">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-600">
            <Box aria-hidden="true" className="h-3 w-3" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-none tabular-nums text-slate-800">
              {environmentCount}
            </p>
            <p className="mt-1 truncate text-[9px] leading-none text-slate-500">
              {environmentCount === 1 ? "Environment" : "Environments"}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 items-center justify-center gap-1.5 border-l border-slate-100 px-1">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-green-50 text-green-600">
            <Rocket aria-hidden="true" className="h-3 w-3" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-none tabular-nums text-slate-800">
              {deploymentCount ?? "—"}
            </p>
            <p className="mt-1 truncate text-[9px] leading-none text-slate-500">
              {deploymentCount === 1 ? "Deployment" : "Deployments"}
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-auto flex items-center justify-between gap-2 pt-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            role="img"
            aria-label={`Owner: ${ownerName}`}
            title={`Owner: ${ownerName}`}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#23365d] text-[10px] font-semibold text-white ring-2 ring-white"
          >
            {ownerInitials || (
              <UserRound aria-hidden="true" className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] leading-none text-slate-400">Owner</p>
            <p className="mt-1 max-w-32 truncate text-xs font-medium text-slate-700">
              {ownerName}
            </p>
          </div>
        </div>
        <time className="flex shrink-0 items-center gap-1.5 text-[11px] text-slate-400">
          <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
          {formatUpdatedDate(project.updated_at)}
        </time>
      </footer>
      </div>
    </article>
  );
}
