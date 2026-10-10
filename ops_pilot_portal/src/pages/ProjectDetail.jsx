import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Box,
  CheckCircle2,
  Layers,
  Pencil,
  Rocket,
  ScrollText,
  Settings,
  TriangleAlert,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import toast from "react-hot-toast";
import {
  getDeployments,
  getEnvironments,
  getLogSources,
  getProject,
  getServices,
  updateProject,
} from "../api/DashboardtApi";
import { getProjectIconOption } from "../components/projects/projectIconOptions";

const tabs = [
  { key: "overview", label: "Overview", Icon: Activity },
  { key: "services", label: "Services", Icon: Layers },
  { key: "environments", label: "Environments", Icon: Box },
  { key: "deployments", label: "Deployments", Icon: Rocket },
  { key: "logs", label: "Logs", Icon: ScrollText },
  { key: "settings", label: "Settings", Icon: Settings },
];

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const StatusBadge = ({ status }) => {
  const normalizedStatus = (status || "unknown").toLowerCase();
  const isSuccess =
    normalizedStatus === "success" || normalizedStatus === "healthy";
  const isFailure =
    normalizedStatus === "failed" || normalizedStatus === "cancelled";
  const className = isSuccess
    ? "bg-emerald-50 text-emerald-700"
    : isFailure
      ? "bg-rose-50 text-rose-700"
      : "bg-amber-50 text-amber-700";
  const label = normalizedStatus[0].toUpperCase() + normalizedStatus.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

const EmptyPanel = ({ children }) => (
  <div className="flex min-h-40 flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-white px-5 text-center">
    <p className="text-sm text-slate-500">{children}</p>
  </div>
);

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [services, setServices] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [logSources, setLogSources] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProjectDetail = async () => {
      setIsLoading(true);
      setLoadError(false);
      const [
        projectResult,
        servicesResult,
        environmentsResult,
        deploymentsResult,
      ] = await Promise.allSettled([
        getProject(projectId),
        getServices(),
        getEnvironments(),
        getDeployments(),
      ]);

      if (!isMounted) return;
      if (projectResult.status !== "fulfilled") {
        setLoadError(true);
        setIsLoading(false);
        toast.error("Could not load this project.");
        return;
      }

      const projectData = projectResult.value;
      const projectServices =
        servicesResult.status === "fulfilled"
          ? servicesResult.value.filter(
              (service) => service.project_id === projectId,
            )
          : [];
      const projectEnvironments =
        environmentsResult.status === "fulfilled"
          ? environmentsResult.value.filter(
              (environment) => environment.project_id === projectId,
            )
          : [];
      const environmentIds = new Set(
        projectEnvironments.map((environment) => environment.id),
      );
      const projectDeployments =
        deploymentsResult.status === "fulfilled"
          ? deploymentsResult.value
              .filter((deployment) =>
                environmentIds.has(deployment.environment_id),
              )
              .sort(
                (first, second) =>
                  new Date(second.deployed_at).getTime() -
                  new Date(first.deployed_at).getTime(),
              )
          : [];

      setProject(projectData);
      setServices(projectServices);
      setEnvironments(projectEnvironments);
      setDeployments(projectDeployments);

      const serviceById = new Map(
        projectServices.map((service) => [service.id, service]),
      );
      const sourceResults = await Promise.allSettled(
        projectEnvironments.map((environment) => {
          const service = serviceById.get(environment.service_id);
          if (!service) return Promise.resolve([]);
          return getLogSources(projectId, service.id, environment.id);
        }),
      );
      if (!isMounted) return;
      setLogSources(
        sourceResults.flatMap((result) =>
          result.status === "fulfilled" ? result.value : [],
        ),
      );
      setIsLoading(false);
    };

    loadProjectDetail().catch(() => {
      if (!isMounted) return;
      setLoadError(true);
      setIsLoading(false);
      toast.error("Could not load this project.");
    });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const environmentById = useMemo(
    () =>
      new Map(environments.map((environment) => [environment.id, environment])),
    [environments],
  );
  const failedDeployments = deployments.filter((deployment) =>
    ["failed", "cancelled"].includes(deployment.status?.toLowerCase()),
  ).length;
  const projectIcon = getProjectIconOption(project?.icon_key);
  const ProjectIcon = projectIcon.Icon;

  const openEdit = () => {
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setIsEditing(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const updatedProject = await updateProject(projectId, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      setProject(updatedProject);
      setIsEditing(false);
      toast.success("Project updated.");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Could not update project.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section
        className="space-y-5 pb-8"
        aria-label="Loading project details"
        aria-busy="true"
      >
        <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
        <div className="h-24 animate-pulse rounded-md bg-white" />
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-md bg-white"
            />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-64 animate-pulse rounded-md bg-white" />
          <div className="h-64 animate-pulse rounded-md bg-white" />
        </div>
      </section>
    );
  }

  if (loadError || !project) {
    return (
      <section className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center text-center">
        <TriangleAlert aria-hidden="true" className="h-7 w-7 text-amber-500" />
        <h2 className="mt-3 text-base font-semibold text-slate-900">
          Project unavailable
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          This project could not be loaded or may no longer exist.
        </p>
        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to projects
        </button>
      </section>
    );
  }

  const stats = [
    {
      label: "Services",
      value: services.length,
      Icon: Layers,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Environments",
      value: environments.length,
      Icon: Box,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Deployments",
      value: deployments.length,
      Icon: Rocket,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Failed deployments",
      value: failedDeployments,
      Icon: TriangleAlert,
      color: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <section
      className="space-y-5 pb-8"
      aria-label={`${project.name} project details`}
    >
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
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-md ${projectIcon.colorClassName}`}
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
          onClick={openEdit}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
          Edit
        </button>
      </header>

      <nav
        role="tablist"
        aria-label="Project sections"
        className="flex gap-1 overflow-x-auto border-b border-slate-200"
      >
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => setActiveTab(key)}
            className={`inline-flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors ${activeTab === key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
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
                  onClick={() => setActiveTab("deployments")}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  View all
                </button>
              </div>
              {deployments.length ? (
                <div className="divide-y divide-slate-100">
                  {deployments.slice(0, 5).map((deployment) => {
                    const environment = environmentById.get(
                      deployment.environment_id,
                    );
                    return (
                      <div
                        key={deployment.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(5rem,0.6fr)_auto]"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-600">
                            <Rocket
                              aria-hidden="true"
                              className="h-3.5 w-3.5"
                            />
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
                          {environment?.name ?? "Environment"}
                        </span>
                        <StatusBadge status={deployment.status} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8">
                  <EmptyPanel>No deployments for this project yet.</EmptyPanel>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-md border border-slate-200/80 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Services
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Services in this project
                </p>
              </div>
              {services.length ? (
                <ul className="divide-y divide-slate-100">
                  {services.slice(0, 5).map((service) => {
                    const serviceEnvironments = environments.filter(
                      (environment) => environment.service_id === service.id,
                    );
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
                            {serviceEnvironments.length}{" "}
                            {serviceEnvironments.length === 1
                              ? "environment"
                              : "environments"}
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
                  <EmptyPanel>No services have been added yet.</EmptyPanel>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {activeTab === "services" && (
        <section className="overflow-hidden rounded-md border border-slate-200/80 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Project Services
            </h2>
          </div>
          {services.length ? (
            <div className="divide-y divide-slate-100">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Layers
                    aria-hidden="true"
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {service.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {service.description || "No description"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {
                      environments.filter(
                        (environment) => environment.service_id === service.id,
                      ).length
                    }{" "}
                    environments
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyPanel>No services in this project.</EmptyPanel>
            </div>
          )}
        </section>
      )}

      {activeTab === "environments" && (
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
                return (
                  <div
                    key={environment.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Box
                      aria-hidden="true"
                      className="h-4 w-4 text-amber-600"
                    />
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
                      {
                        deployments.filter(
                          (item) => item.environment_id === environment.id,
                        ).length
                      }{" "}
                      deployments
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4">
              <EmptyPanel>No environments in this project.</EmptyPanel>
            </div>
          )}
        </section>
      )}

      {activeTab === "deployments" && (
        <section className="overflow-hidden rounded-md border border-slate-200/80 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Project Deployments
            </h2>
          </div>
          {deployments.length ? (
            <div className="divide-y divide-slate-100">
              {deployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(7rem,0.7fr)_auto_auto]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Rocket
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-indigo-600"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {deployment.version}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {deployment.commit_sha}
                      </p>
                    </div>
                  </div>
                  <span className="hidden truncate text-xs text-slate-500 sm:block">
                    {environmentById.get(deployment.environment_id)?.name ??
                      "Environment"}
                  </span>
                  <time className="hidden text-xs text-slate-400 sm:block">
                    {formatDate(deployment.deployed_at)}
                  </time>
                  <StatusBadge status={deployment.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyPanel>No deployments in this project.</EmptyPanel>
            </div>
          )}
        </section>
      )}

      {activeTab === "logs" && (
        <section className="overflow-hidden rounded-md border border-slate-200/80 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Log Sources
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Configured sources for project environments
            </p>
          </div>
          {logSources.length ? (
            <div className="divide-y divide-slate-100">
              {logSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <ScrollText
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-blue-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {source.stream_url}
                    </p>
                    <p className="text-xs text-slate-500">
                      {source.source_type}
                    </p>
                  </div>
                  <StatusBadge
                    status={source.is_active ? "active" : "inactive"}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyPanel>
                No log sources are configured for this project.
              </EmptyPanel>
            </div>
          )}
        </section>
      )}

      {activeTab === "settings" && (
        <section className="max-w-2xl rounded-md border border-slate-200/80 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Project Settings
          </h2>
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
                {formatDate(project.created_at)}
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
            onClick={openEdit}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            Edit project
          </button>
        </section>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close edit project dialog"
            onClick={() => setIsEditing(false)}
            className="absolute inset-0 bg-slate-950/40"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-project-title"
            className="relative z-10 w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="edit-project-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Edit project
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update this project’s details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                aria-label="Close dialog"
                className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Project name
                <input
                  required
                  maxLength={100}
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Description
                <textarea
                  rows={3}
                  maxLength={255}
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  className="mt-1.5 w-full resize-y rounded-md border border-slate-200 px-3 py-2 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-9 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
