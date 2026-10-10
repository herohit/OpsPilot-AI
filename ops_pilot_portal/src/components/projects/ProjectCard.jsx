import {
  Box,
  Clock3,
  Layers,
  Rocket,
  UserRound,
} from "lucide-react";
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
}) {
  const projectIcon = getProjectIconOption(project.icon_key);
  const ProjectIcon = projectIcon.Icon;

  return (
    <article className="group relative flex min-h-[228px] flex-col overflow-hidden rounded-md border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${projectIcon.colorClassName}`}
        >
          <ProjectIcon aria-hidden="true" className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[10px] font-semibold uppercase text-slate-400">
            Project
          </p>
          <h2 className="mt-0.5 truncate text-base font-semibold text-slate-900">
            {project.name}
          </h2>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
        {project.description || "No project description"}
      </p>

      <div className="mt-4 grid grid-cols-3 border-y border-slate-100 py-3">
        <div className="flex min-w-0 flex-col items-center justify-center gap-1.5 px-1">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-blue-50 text-blue-600">
            <Layers aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 text-center">
            <p className="text-sm font-semibold leading-none tabular-nums text-slate-800">
              {serviceCount}
            </p>
            <p className="mt-1 truncate text-[10px] text-slate-500">
              {serviceCount === 1 ? "Service" : "Services"}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-col items-center justify-center gap-1.5 border-l border-slate-100 px-1">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-amber-50 text-amber-600">
            <Box aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 text-center">
            <p className="text-sm font-semibold leading-none tabular-nums text-slate-800">
              {environmentCount}
            </p>
            <p className="mt-1 truncate text-[10px] text-slate-500">
              {environmentCount === 1 ? "Environment" : "Environments"}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-col items-center justify-center gap-1.5 border-l border-slate-100 px-1">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-green-50 text-green-600">
            <Rocket aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 text-center">
            <p className="text-sm font-semibold leading-none tabular-nums text-slate-800">
              {deploymentCount ?? "—"}
            </p>
            <p className="mt-1 truncate text-[10px] text-slate-500">
              {deploymentCount === 1 ? "Deployment" : "Deployments"}
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-auto flex items-center justify-between gap-3 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            role="img"
            aria-label={`Owner: ${ownerName}`}
            title={`Owner: ${ownerName}`}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#23365d] text-[10px] font-semibold text-white ring-2 ring-white"
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
    </article>
  );
}
