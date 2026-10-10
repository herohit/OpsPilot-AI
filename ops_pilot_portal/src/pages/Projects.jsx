import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  getDeployments,
  getEnvironments,
  getProjects,
  getServices,
} from "../api/DashboardtApi";
import { useAuthStore } from "../store/authStore";
import useProjectStore from "../store/projectStore";
import ProjectCard from "../components/projects/ProjectCard";

export default function Projects() {
  const navigate = useNavigate();
  const projects = useProjectStore((state) => state.projects);
  const setProjects = useProjectStore((state) => state.setProjects);
  const user = useAuthStore((state) => state.user);
  const [services, setServices] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [deployments, setDeployments] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const ownerName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    "Project owner";
  const ownerInitials = ownerName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      const [projectResult, serviceResult, environmentResult, deploymentResult] =
        await Promise.allSettled([
          getProjects(),
          getServices(),
          getEnvironments(),
          getDeployments(),
        ]);

      if (!isMounted) return;
      if (projectResult.status === "fulfilled") {
        setProjects(projectResult.value);
      } else {
        toast.error("Could not load projects.");
      }
      setServices(serviceResult.status === "fulfilled" ? serviceResult.value : []);
      setEnvironments(
        environmentResult.status === "fulfilled" ? environmentResult.value : [],
      );
      if (deploymentResult.status === "fulfilled") {
        setDeployments(deploymentResult.value);
      } else {
        setDeployments(null);
        toast.error("Could not load deployment counts.");
      }
      setIsLoading(false);
    };

    loadProjects();
    return () => {
      isMounted = false;
    };
  }, [setProjects]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = `${project.name} ${project.description ?? ""}`
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
    const serviceCount = services.filter(
      (service) => service.project_id === project.id,
    ).length;
    const matchesFilter =
      projectFilter === "all" ||
      (projectFilter === "with-services" && serviceCount > 0) ||
      (projectFilter === "without-services" && serviceCount === 0);
    return matchesSearch && matchesFilter;
  });

  return (
    <section className="space-y-5 pb-6" aria-label="Projects">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="relative flex h-10 items-center rounded-md border border-slate-200 bg-white shadow-sm sm:w-44">
          <SlidersHorizontal
            aria-hidden="true"
            className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500"
          />
          <span className="sr-only">Filter projects</span>
          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="h-full w-full appearance-none rounded-md bg-transparent pl-9 pr-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All projects</option>
            <option value="with-services">With services</option>
            <option value="without-services">Without services</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => navigate("/projects/new")}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New Project
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-lg border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : filteredProjects.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredProjects.map((project) => {
            const serviceCount = services.filter(
              (service) => service.project_id === project.id,
            ).length;
            const projectEnvironments = environments.filter(
              (environment) => environment.project_id === project.id,
            );
            const environmentIds = new Set(
              projectEnvironments.map((environment) => environment.id),
            );
            const deploymentCount = deployments
              ? deployments.filter((deployment) =>
                  environmentIds.has(deployment.environment_id),
                ).length
              : null;
            return (
              <ProjectCard
                key={project.id}
                project={project}
                serviceCount={serviceCount}
                environmentCount={projectEnvironments.length}
                deploymentCount={deploymentCount}
                ownerName={ownerName}
                ownerInitials={ownerInitials}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-5 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-slate-900">
            {projects.length ? "No projects match your search" : "No projects yet"}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {projects.length
              ? "Try another name or change the project filter."
              : "Create a project to start organizing its services and environments."}
          </p>
          {!projects.length && (
            <button
              type="button"
              onClick={() => navigate("/projects/new")}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              New Project
            </button>
          )}
        </div>
      )}

    </section>
  );
}