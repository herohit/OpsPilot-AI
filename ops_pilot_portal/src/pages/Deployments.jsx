import { useEffect, useMemo, useState } from "react";
import { Clock3, Plus, Rocket, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import DeploymentStatusMenu from "../components/deployments/DeploymentStatusMenu";
import {
  createDeployment,
  getDeployments,
  getEnvironments,
  getProjects,
  getServices,
  updateDeployment,
} from "../api/DashboardtApi";
import ResourceStatusBadge from "../components/resources/ResourceStatusBadge";

const formatRelativeTime = (value) => {
  if (!value) return "Time unavailable";
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
};

const formatDuration = (deployment) => {
  const start = new Date(
    deployment.created_at ?? deployment.deployed_at,
  ).getTime();
  const end = ["running", "pending"].includes(deployment.status?.toLowerCase())
    ? Date.now()
    : new Date(deployment.updated_at ?? deployment.deployed_at).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "—";
  const seconds = Math.max(0, Math.floor((end - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const statuses = ["pending", "running", "success", "failed", "cancelled"];

export default function Deployments() {
  const [deployments, setDeployments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [environmentId, setEnvironmentId] = useState("");
  const [version, setVersion] = useState("");
  const [commitSha, setCommitSha] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const [
        deploymentResult,
        projectResult,
        serviceResult,
        environmentResult,
      ] = await Promise.allSettled([
        getDeployments(),
        getProjects(),
        getServices(),
        getEnvironments(),
      ]);
      if (!isMounted) return;
      if (deploymentResult.status !== "fulfilled") {
        toast.error("Could not load deployments.");
      } else {
        setDeployments(deploymentResult.value);
      }
      setProjects(
        projectResult.status === "fulfilled" ? projectResult.value : [],
      );
      setServices(
        serviceResult.status === "fulfilled" ? serviceResult.value : [],
      );
      setEnvironments(
        environmentResult.status === "fulfilled" ? environmentResult.value : [],
      );
      setIsLoading(false);
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const projectById = useMemo(
    () => new Map(projects.map((item) => [item.id, item])),
    [projects],
  );
  const serviceById = useMemo(
    () => new Map(services.map((item) => [item.id, item])),
    [services],
  );
  const environmentById = useMemo(
    () => new Map(environments.map((item) => [item.id, item])),
    [environments],
  );
  const scopedEnvironments = environments.filter((environment) => {
    const service = serviceById.get(environment.service_id);
    return serviceFilter === "all" || service?.id === serviceFilter;
  });

  const visibleDeployments = deployments
    .filter((deployment) => {
      const environment = environmentById.get(deployment.environment_id);
      const service = environment && serviceById.get(environment.service_id);
      const project = service && projectById.get(service.project_id);
      const matchesSearch =
        `${deployment.version} ${deployment.commit_sha} ${service?.name ?? ""} ${environment?.name ?? ""} ${project?.name ?? ""}`
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());
      return (
        matchesSearch &&
        (serviceFilter === "all" || service?.id === serviceFilter) &&
        (environmentFilter === "all" ||
          environment?.id === environmentFilter) &&
        (statusFilter === "all" ||
          deployment.status?.toLowerCase() === statusFilter)
      );
    })
    .sort(
      (first, second) =>
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime(),
    );

  const handleCreate = async (event) => {
    event.preventDefault();
    const environment = environmentById.get(environmentId);
    if (!environment) return;
    setIsCreating(true);
    try {
      const created = await createDeployment(
        environment.project_id,
        environment.service_id,
        environment.id,
        { version: version.trim(), commit_sha: commitSha.trim() },
      );
      setDeployments((current) => [created, ...current]);
      setIsCreateOpen(false);
      setVersion("");
      setCommitSha("");
      toast.success("Deployment created.");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ?? "Could not create deployment.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const changeStatus = async (deployment, status) => {
    const environment = environmentById.get(deployment.environment_id);
    if (!environment) return;
    setUpdatingId(deployment.id);
    try {
      const updated = await updateDeployment(
        environment.project_id,
        environment.service_id,
        environment.id,
        deployment.id,
        { status },
      );
      setDeployments((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success("Deployment status updated.");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ?? "Could not update deployment.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="space-y-4 pb-8" aria-label="Deployments">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(9rem,0.8fr)_minmax(9rem,0.8fr)_minmax(8rem,0.7fr)_minmax(14rem,1.6fr)_auto]">
        <label className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 shadow-sm">
          <span className="sr-only">Filter by service</span>
          <select
            value={serviceFilter}
            onChange={(event) => {
              setServiceFilter(event.target.value);
              setEnvironmentFilter("all");
            }}
            className="h-full w-full bg-transparent text-sm text-slate-700 outline-none"
          >
            <option value="all">All Services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 shadow-sm">
          <span className="sr-only">Filter by environment</span>
          <select
            value={environmentFilter}
            onChange={(event) => setEnvironmentFilter(event.target.value)}
            className="h-full w-full bg-transparent text-sm text-slate-700 outline-none"
          >
            <option value="all">All Environments</option>
            {scopedEnvironments.map((environment) => (
              <option key={environment.id} value={environment.id}>
                {environment.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 shadow-sm">
          <span className="sr-only">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-full w-full bg-transparent text-sm text-slate-700 outline-none"
          >
            <option value="all">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status[0].toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="relative min-w-0">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search deployments..."
            aria-label="Search deployments"
            className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setEnvironmentId(environments[0]?.id ?? "");
            setIsCreateOpen(true);
          }}
          disabled={!environments.length}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New Deployment
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[minmax(9rem,1.3fr)_minmax(7rem,0.8fr)_minmax(5rem,0.6fr)_minmax(6rem,0.7fr)_minmax(8rem,0.9fr)_minmax(5rem,0.6fr)_2.5rem] items-center gap-3 border-b border-slate-100 px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">
            <span>Service</span>
            <span>Environment</span>
            <span>Version</span>
            <span>Status</span>
            <span>Started at</span>
            <span>Duration</span>
            <span />
          </div>
          {isLoading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-12 animate-pulse rounded-md bg-slate-100"
                />
              ))}
            </div>
          ) : visibleDeployments.length ? (
            <div className="divide-y divide-slate-100">
              {visibleDeployments.map((deployment) => {
                const environment = environmentById.get(
                  deployment.environment_id,
                );
                const service =
                  environment && serviceById.get(environment.service_id);
                const project = service && projectById.get(service.project_id);
                return (
                  <div
                    key={deployment.id}
                    className="grid grid-cols-[minmax(9rem,1.3fr)_minmax(7rem,0.8fr)_minmax(5rem,0.6fr)_minmax(6rem,0.7fr)_minmax(8rem,0.9fr)_minmax(5rem,0.6fr)_2.5rem] items-center gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-600">
                        <Rocket aria-hidden="true" className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {service?.name ?? "Service"}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {project?.name ?? "Project"}
                        </p>
                      </div>
                    </div>
                    <span className="truncate text-xs text-slate-600">
                      {environment?.name ?? "Environment"}
                    </span>
                    <span className="truncate text-xs font-medium text-slate-700">
                      {deployment.version}
                    </span>
                    <ResourceStatusBadge status={deployment.status} />
                    <time className="text-xs text-slate-500">
                      {formatRelativeTime(
                        deployment.created_at ?? deployment.deployed_at,
                      )}
                    </time>
                    <span className="inline-flex items-center gap-1 text-xs tabular-nums text-slate-500">
                      <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                      {formatDuration(deployment)}
                    </span>
                    <DeploymentStatusMenu
                      deployment={deployment}
                      statuses={statuses}
                      isUpdating={updatingId === deployment.id}
                      onChangeStatus={(status) =>
                        changeStatus(deployment, status)
                      }
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-slate-800">
                {deployments.length
                  ? "No deployments match these filters"
                  : "No deployments yet"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {deployments.length
                  ? "Adjust the filters to see other deployments."
                  : "Create a deployment to track a release."}
              </p>
            </div>
          )}
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close new deployment dialog"
            onClick={() => setIsCreateOpen(false)}
            className="absolute inset-0 bg-slate-950/40"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-deployment-title"
            className="relative z-10 w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="new-deployment-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  New deployment
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Record a deployment for an environment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close dialog"
                className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Environment
                <select
                  required
                  value={environmentId}
                  onChange={(event) => setEnvironmentId(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {environments.map((environment) => (
                    <option key={environment.id} value={environment.id}>
                      {projectById.get(environment.project_id)?.name ??
                        "Project"}{" "}
                      /{" "}
                      {serviceById.get(environment.service_id)?.name ??
                        "Service"}{" "}
                      / {environment.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Version
                <input
                  required
                  maxLength={100}
                  value={version}
                  onChange={(event) => setVersion(event.target.value)}
                  placeholder="e.g. v1.2.3"
                  className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Commit SHA
                <input
                  required
                  maxLength={100}
                  value={commitSha}
                  onChange={(event) => setCommitSha(event.target.value)}
                  placeholder="Commit identifier"
                  className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !environments.length}
                  className="h-9 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isCreating ? "Creating..." : "Create deployment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
