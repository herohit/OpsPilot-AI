import { useEffect, useMemo, useState } from "react";
import { Box, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import {
  createEnvironment,
  deleteEnvironment,
  getDeployments,
  getEnvironments,
  getProjects,
  getServices,
  updateEnvironment,
} from "../api/DashboardtApi";
import ResourceActionsMenu from "../components/resources/ResourceActionsMenu";
import ResourceDeleteDialog from "../components/resources/ResourceDeleteDialog";
import ResourceFormDialog from "../components/resources/ResourceFormDialog";
import ResourceStatusBadge from "../components/resources/ResourceStatusBadge";

const formatRelativeTime = (value) => {
  if (!value) return "No deployments";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Date unavailable";
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} ${elapsedHours === 1 ? "hour" : "hours"} ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} ${elapsedDays === 1 ? "day" : "days"} ago`;
};

function getLatestDeployment(environment, deployments) {
  return deployments
    .filter((deployment) => deployment.environment_id === environment.id)
    .sort(
      (first, second) =>
        new Date(second.deployed_at).getTime() -
        new Date(first.deployed_at).getTime(),
    )[0] ?? null;
}

export default function Environments() {
  const [environments, setEnvironments] = useState([]);
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedName, setSelectedName] = useState("all");
  const [editingEnvironment, setEditingEnvironment] = useState(null);
  const [environmentToDelete, setEnvironmentToDelete] = useState(null);
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const [environmentResult, serviceResult, projectResult, deploymentResult] =
        await Promise.allSettled([
          getEnvironments(),
          getServices(),
          getProjects(),
          getDeployments(),
        ]);
      if (!isMounted) return;
      if (environmentResult.status !== "fulfilled") {
        toast.error("Could not load environments.");
        setIsLoading(false);
        return;
      }
      setEnvironments(environmentResult.value);
      setServices(serviceResult.status === "fulfilled" ? serviceResult.value : []);
      setProjects(projectResult.status === "fulfilled" ? projectResult.value : []);
      setDeployments(deploymentResult.status === "fulfilled" ? deploymentResult.value : []);
      setIsLoading(false);
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const serviceById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  );
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const names = [...new Set(environments.map((environment) => environment.name))]
    .sort((first, second) => first.localeCompare(second));
  const filteredEnvironments = environments.filter((environment) => {
    const service = serviceById.get(environment.service_id);
    const project = projectById.get(environment.project_id);
    const searchable = `${environment.name} ${environment.description ?? ""} ${service?.name ?? ""} ${project?.name ?? ""}`;
    const matchesSearch = searchable.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const matchesName = selectedName === "all" || environment.name === selectedName;
    return matchesSearch && matchesName;
  });

  const openCreate = () => {
    setEditingEnvironment(null);
    setName("");
    setDescription("");
    setServiceId(services[0]?.id ?? "");
  };

  const openEdit = (environment) => {
    setEditingEnvironment(environment);
    setName(environment.name);
    setDescription(environment.description ?? "");
    setServiceId(environment.service_id);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      let savedEnvironment;
      if (editingEnvironment) {
        savedEnvironment = await updateEnvironment(
          editingEnvironment.project_id,
          editingEnvironment.service_id,
          editingEnvironment.id,
          { name: name.trim(), description: description.trim() || null },
        );
        setEnvironments((current) => current.map((environment) => environment.id === savedEnvironment.id ? savedEnvironment : environment));
        toast.success("Environment updated.");
      } else {
        const service = serviceById.get(serviceId);
        if (!service) throw new Error("Choose a service for this environment.");
        savedEnvironment = await createEnvironment(service.project_id, service.id, {
          name: name.trim(),
          description: description.trim() || null,
        });
        setEnvironments((current) => [...current, savedEnvironment]);
        toast.success("Environment created.");
      }
      setEditingEnvironment(null);
      setServiceId("");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? error.message ?? "Could not save environment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEnvironment(
        environmentToDelete.project_id,
        environmentToDelete.service_id,
        environmentToDelete.id,
      );
      setEnvironments((current) => current.filter((environment) => environment.id !== environmentToDelete.id));
      setDeployments((current) => current.filter((deployment) => deployment.environment_id !== environmentToDelete.id));
      setEnvironmentToDelete(null);
      toast.success("Environment deleted.");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Could not delete environment.");
    } finally {
      setIsDeleting(false);
    }
  };

  const contextOptions = services.map((service) => ({
    id: service.id,
    label: `${projectById.get(service.project_id)?.name ?? "Project"} / ${service.name}`,
  }));

  return (
    <section className="space-y-5 pb-8" aria-label="Environments">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search environments..." aria-label="Search environments" className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </label>
        <button type="button" onClick={openCreate} disabled={!services.length} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Plus aria-hidden="true" className="h-4 w-4" />
          New Environment
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {["all", ...names].map((tabName) => {
          const count = tabName === "all"
            ? environments.length
            : environments.filter((environment) => environment.name === tabName).length;
          const selected = selectedName === tabName;
          return (
            <button key={tabName} type="button" onClick={() => setSelectedName(tabName)} className={`inline-flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors ${selected ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              {tabName === "all" ? "All" : tabName}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${selected ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-visible rounded-md border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(7rem,0.8fr)_minmax(7rem,0.7fr)_minmax(8rem,0.8fr)_3rem] items-center gap-4 border-b border-slate-100 px-4 py-3 text-[11px] font-semibold uppercase text-slate-400 md:grid">
          <span>Name</span><span>Status</span><span>Service</span><span>Last deployment</span><span />
        </div>
        {isLoading ? (
          <div className="space-y-2 p-3">{[0, 1, 2].map((item) => <div key={item} className="h-[62px] animate-pulse rounded-md bg-slate-100" />)}</div>
        ) : filteredEnvironments.length ? (
          <div className="divide-y divide-slate-100">
            {filteredEnvironments.map((environment) => {
              const service = serviceById.get(environment.service_id);
              const latestDeployment = getLatestDeployment(environment, deployments);
              const deploymentStatus = latestDeployment?.status?.toLowerCase();
              const status = deploymentStatus === "success"
                ? "active"
                : ["failed", "cancelled"].includes(deploymentStatus)
                  ? "failed"
                  : latestDeployment
                    ? "pending"
                    : "no deployments";
              return (
                <div key={environment.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:grid-cols-[minmax(0,1.3fr)_minmax(7rem,0.8fr)_minmax(7rem,0.7fr)_minmax(8rem,0.8fr)_3rem] md:gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-600"><Box aria-hidden="true" className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{environment.name}</p>
                      <p className="truncate text-xs text-slate-500">{projectById.get(environment.project_id)?.name ?? "Project"}</p>
                    </div>
                  </div>
                  <span className="hidden md:block"><ResourceStatusBadge status={status} /></span>
                  <span className="hidden truncate text-xs text-slate-600 md:block">{service?.name ?? "Service"}</span>
                  <time className="hidden text-xs text-slate-500 md:block">{formatRelativeTime(latestDeployment?.deployed_at)}</time>
                  <div className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto">
                    <ResourceActionsMenu label={environment.name} onEdit={() => openEdit(environment)} onDelete={() => setEnvironmentToDelete(environment)} />
                  </div>
                  <div className="col-span-2 flex items-center justify-between md:hidden">
                    <ResourceStatusBadge status={status} />
                    <span className="truncate text-xs text-slate-500">{service?.name ?? "Service"} · {formatRelativeTime(latestDeployment?.deployed_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-slate-800">{environments.length ? "No environments match these filters" : "No environments yet"}</p>
            <p className="mt-1 text-xs text-slate-500">{environments.length ? "Try another search or environment tab." : "Create a service before adding its first environment."}</p>
          </div>
        )}
      </div>

      {(editingEnvironment || serviceId !== "") && (
        <ResourceFormDialog
          title={editingEnvironment ? "Edit environment" : "New environment"}
          name={name}
          description={description}
          contextLabel={editingEnvironment ? undefined : "Service"}
          contextOptions={contextOptions}
          contextId={serviceId}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onContextChange={setServiceId}
          onClose={() => { setEditingEnvironment(null); setServiceId(""); }}
          onSubmit={handleSave}
          isSubmitting={isSaving}
        />
      )}

      {environmentToDelete && (
        <ResourceDeleteDialog
          name={environmentToDelete.name}
          isDeleting={isDeleting}
          onClose={() => setEnvironmentToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  );
}