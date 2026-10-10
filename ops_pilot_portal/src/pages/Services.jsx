import { useEffect, useMemo, useState } from "react";
import { Layers, Plus, Search, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import {
  createService,
  deleteService,
  getDeployments,
  getEnvironments,
  getProjects,
  getServices,
  updateService,
} from "../api/DashboardtApi";
import ResourceActionsMenu from "../components/resources/ResourceActionsMenu";
import ResourceDeleteDialog from "../components/resources/ResourceDeleteDialog";
import ResourceFormDialog from "../components/resources/ResourceFormDialog";
import ResourceStatusBadge from "../components/resources/ResourceStatusBadge";

const iconColors = [
  "bg-blue-50 text-blue-600",
  "bg-emerald-50 text-emerald-600",
  "bg-violet-50 text-violet-600",
  "bg-amber-50 text-amber-600",
];

function getServiceHealth(service, environments, deployments) {
  const serviceEnvironments = environments.filter(
    (environment) => environment.service_id === service.id,
  );
  if (!serviceEnvironments.length) {
    return { status: "needs setup", coverage: "0/0" };
  }

  let successfulEnvironments = 0;
  let hasFailure = false;
  let hasPending = false;

  for (const environment of serviceEnvironments) {
    const latestDeployment = deployments
      .filter((deployment) => deployment.environment_id === environment.id)
      .sort(
        (first, second) =>
          new Date(second.deployed_at).getTime() -
          new Date(first.deployed_at).getTime(),
      )[0];
    if (!latestDeployment) {
      hasPending = true;
    } else if (latestDeployment.status?.toLowerCase() === "success") {
      successfulEnvironments += 1;
    } else if (["failed", "cancelled"].includes(latestDeployment.status?.toLowerCase())) {
      hasFailure = true;
    } else {
      hasPending = true;
    }
  }

  return {
    status: hasFailure ? "degraded" : hasPending ? "pending" : "healthy",
    coverage: `${successfulEnvironments}/${serviceEnvironments.length}`,
  };
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingService, setEditingService] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadServices = async () => {
    const [serviceResult, projectResult, environmentResult, deploymentResult] =
      await Promise.allSettled([
        getServices(),
        getProjects(),
        getEnvironments(),
        getDeployments(),
      ]);
    if (serviceResult.status !== "fulfilled") {
      toast.error("Could not load services.");
      setIsLoading(false);
      return;
    }
    setServices(serviceResult.value);
    setProjects(projectResult.status === "fulfilled" ? projectResult.value : []);
    setEnvironments(environmentResult.status === "fulfilled" ? environmentResult.value : []);
    setDeployments(deploymentResult.status === "fulfilled" ? deploymentResult.value : []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const servicesWithHealth = useMemo(
    () => services.map((service) => ({
      service,
      ...getServiceHealth(service, environments, deployments),
    })),
    [services, environments, deployments],
  );
  const visibleServices = servicesWithHealth.filter(({ service, status }) => {
    const projectName = projectById.get(service.project_id)?.name ?? "";
    const matchesSearch = `${service.name} ${service.description ?? ""} ${projectName}`
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      status === statusFilter ||
      (statusFilter === "attention" && ["pending", "needs setup"].includes(status));
    return matchesSearch && matchesStatus;
  });
  const filterOptions = [
    { value: "all", label: `All services ${services.length}` },
    { value: "healthy", label: `Healthy ${servicesWithHealth.filter((item) => item.status === "healthy").length}` },
    { value: "degraded", label: `Degraded ${servicesWithHealth.filter((item) => item.status === "degraded").length}` },
    { value: "attention", label: `Needs attention ${servicesWithHealth.filter((item) => ["pending", "needs setup"].includes(item.status)).length}` },
  ];

  const openCreate = () => {
    setEditingService(null);
    setName("");
    setDescription("");
    setProjectId(projects[0]?.id ?? "");
  };

  const openEdit = (service) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description ?? "");
    setProjectId(service.project_id);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingService) {
        const updated = await updateService(editingService.project_id, editingService.id, {
          name: name.trim(),
          description: description.trim() || null,
        });
        setServices((current) => current.map((service) => service.id === updated.id ? updated : service));
        toast.success("Service updated.");
      } else {
        const created = await createService(projectId, {
          name: name.trim(),
          description: description.trim() || null,
        });
        setServices((current) => [...current, created]);
        toast.success("Service created.");
      }
      setEditingService(null);
      setProjectId("");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Could not save service.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteService(serviceToDelete.project_id, serviceToDelete.id);
      const removedEnvironmentIds = new Set(
        environments
          .filter((environment) => environment.service_id === serviceToDelete.id)
          .map((environment) => environment.id),
      );
      setServices((current) => current.filter((service) => service.id !== serviceToDelete.id));
      setEnvironments((current) => current.filter((environment) => environment.service_id !== serviceToDelete.id));
      setDeployments((current) => current.filter((deployment) => !removedEnvironmentIds.has(deployment.environment_id)));
      setServiceToDelete(null);
      toast.success("Service deleted.");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Could not delete service.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-5 pb-8" aria-label="Services">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search services..." aria-label="Search services" className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="relative flex h-10 items-center rounded-md border border-slate-200 bg-white shadow-sm sm:w-48">
          <SlidersHorizontal aria-hidden="true" className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
          <span className="sr-only">Filter services by health</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-full w-full appearance-none rounded-md bg-transparent pl-9 pr-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100">
            {filterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={openCreate} disabled={!projects.length} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Plus aria-hidden="true" className="h-4 w-4" />
          New Service
        </button>
      </div>

      <div className="overflow-visible rounded-md border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(8rem,1fr)_minmax(8rem,0.8fr)_3rem] items-center gap-4 border-b border-slate-100 px-4 py-3 text-[11px] font-semibold uppercase text-slate-400 md:grid">
          <span>Service</span><span>Project</span><span>Health</span><span />
        </div>
        {isLoading ? (
          <div className="space-y-2 p-3">{[0, 1, 2].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-md bg-slate-100" />)}</div>
        ) : visibleServices.length ? (
          <div className="divide-y divide-slate-100">
            {visibleServices.map(({ service, status, coverage }, index) => {
              const project = projectById.get(service.project_id);
              return (
                <div key={service.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:grid-cols-[minmax(0,1.5fr)_minmax(8rem,1fr)_minmax(8rem,0.8fr)_3rem] md:gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${iconColors[index % iconColors.length]}`}><Layers aria-hidden="true" className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{service.name}</p>
                      <p className="truncate text-xs text-slate-500">{service.description || "No description"}</p>
                    </div>
                  </div>
                  <span className="hidden truncate text-xs text-slate-600 md:block">{project?.name ?? "Project"}</span>
                  <div className="flex items-center justify-between gap-3 md:justify-start">
                    <ResourceStatusBadge status={status} />
                    <span className="text-xs tabular-nums text-slate-500">{coverage}</span>
                  </div>
                  <div className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto">
                    <ResourceActionsMenu label={service.name} onEdit={() => openEdit(service)} onDelete={() => setServiceToDelete(service)} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-slate-800">{services.length ? "No services match these filters" : "No services yet"}</p>
            <p className="mt-1 text-xs text-slate-500">{services.length ? "Try a different search or health filter." : "Create a service inside one of your projects."}</p>
          </div>
        )}
      </div>

      {(editingService || projectId !== "") && (
        <ResourceFormDialog
          title={editingService ? "Edit service" : "New service"}
          name={name}
          description={description}
          contextLabel={editingService ? undefined : "Project"}
          contextOptions={projects.map((project) => ({ id: project.id, label: project.name }))}
          contextId={projectId}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onContextChange={setProjectId}
          onClose={() => { setEditingService(null); setProjectId(""); }}
          onSubmit={handleSave}
          isSubmitting={isSaving}
        />
      )}

      {serviceToDelete && (
        <ResourceDeleteDialog
          name={serviceToDelete.name}
          isDeleting={isDeleting}
          onClose={() => setServiceToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  );
}