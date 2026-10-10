import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  deleteProject,
  getDeployments,
  getEnvironments,
  getProjects,
  getServices,
  updateProject,
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
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

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
      const [
        projectResult,
        serviceResult,
        environmentResult,
        deploymentResult,
      ] = await Promise.allSettled([
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
      setServices(
        serviceResult.status === "fulfilled" ? serviceResult.value : [],
      );
      setEnvironments(
        environmentResult.status === "fulfilled" ? environmentResult.value : [],
      );
      if (deploymentResult.status === "fulfilled") {
        setDeployments(deploymentResult.value);
      } else {
        setDeployments(null);
        toast.error("Could not load deployment");
      }
      setIsLoading(false);
    };

    loadProjects();
    return () => {
      isMounted = false;
    };
  }, [setProjects]);

  useEffect(() => {
    if (!editingProject && !projectToDelete) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !isSavingProject && !isDeletingProject) {
        setEditingProject(null);
        setProjectToDelete(null);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [editingProject, projectToDelete, isSavingProject, isDeletingProject]);

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

  const openEditProject = (project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description ?? "");
  };

  const handleUpdateProject = async (event) => {
    event.preventDefault();
    setIsSavingProject(true);
    try {
      const updatedProject = await updateProject(editingProject.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      setProjects(
        projects.map((project) =>
          project.id === updatedProject.id ? updatedProject : project,
        ),
      );
      setEditingProject(null);
      toast.success("Project updated.");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Could not update project.");
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeletingProject(true);
    try {
      await deleteProject(projectToDelete.id);
      setProjects(
        projects.filter((project) => project.id !== projectToDelete.id),
      );
      setProjectToDelete(null);
      toast.success("Project deleted.");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Could not delete project.");
    } finally {
      setIsDeletingProject(false);
    }
  };

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
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
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
                onEdit={openEditProject}
                onDelete={setProjectToDelete}
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
            {projects.length
              ? "No projects match your search"
              : "No projects yet"}
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

      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close edit project dialog"
            disabled={isSavingProject}
            onClick={() => setEditingProject(null)}
            className="absolute inset-0 bg-slate-950/40 disabled:cursor-wait"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-project-title"
            className="relative z-10 w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="edit-project-title"
              className="text-lg font-semibold text-slate-900"
            >
              Edit project
            </h2>
            <form onSubmit={handleUpdateProject} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Project name
                <input
                  autoFocus
                  required
                  maxLength={100}
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Description{" "}
                <span className="font-normal text-slate-400">(optional)</span>
                <textarea
                  rows={3}
                  maxLength={255}
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  className="mt-1.5 w-full resize-y rounded-md border border-slate-200 px-3 py-2 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSavingProject}
                  onClick={() => setEditingProject(null)}
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProject}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                >
                  <Save aria-hidden="true" className="h-4 w-4" />
                  {isSavingProject ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close delete project dialog"
            disabled={isDeletingProject}
            onClick={() => setProjectToDelete(null)}
            className="absolute inset-0 bg-slate-950/40 disabled:cursor-wait"
          />
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            aria-describedby="delete-project-description"
            className="relative z-10 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-project-title"
              className="text-base font-semibold text-slate-900"
            >
              Delete project?
            </h2>
            <p
              id="delete-project-description"
              className="mt-2 text-sm leading-5 text-slate-600"
            >
              “{projectToDelete.name}” will be permanently removed. This cannot
              be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={() => setProjectToDelete(null)}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={handleDeleteProject}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-rose-600 px-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                {isDeletingProject ? "Deleting..." : "Delete project"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
