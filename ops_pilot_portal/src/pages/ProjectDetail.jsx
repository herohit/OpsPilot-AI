import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Box,
  Layers,
  Rocket,
  ScrollText,
  Settings,
  TriangleAlert,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import toast from "react-hot-toast";
import {
  getDeployments,
  getEnvironments,
  getLogSources,
  getProject,
  getServices,
  updateProject,
} from "../api/DashboardtApi";
import EditProjectDialog from "../components/projects/detail/EditProjectDialog";
import ProjectDeploymentsTab from "../components/projects/detail/ProjectDeploymentsTab";
import ProjectDetailHeader from "../components/projects/detail/ProjectDetailHeader";
import ProjectEnvironmentsTab from "../components/projects/detail/ProjectEnvironmentsTab";
import ProjectLogsTab from "../components/projects/detail/ProjectLogsTab";
import ProjectOverviewTab from "../components/projects/detail/ProjectOverviewTab";
import ProjectServicesTab from "../components/projects/detail/ProjectServicesTab";
import ProjectSettingsTab from "../components/projects/detail/ProjectSettingsTab";

const tabs = [
  { key: "overview", label: "Overview", Icon: Activity },
  { key: "services", label: "Services", Icon: Layers },
  { key: "environments", label: "Environments", Icon: Box },
  { key: "deployments", label: "Deployments", Icon: Rocket },
  { key: "logs", label: "Logs", Icon: ScrollText },
  { key: "settings", label: "Settings", Icon: Settings },
];

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
      <ProjectDetailHeader project={project} onEdit={openEdit} />

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
        <ProjectOverviewTab
          stats={stats}
          deployments={deployments}
          environmentById={environmentById}
          services={services}
          environments={environments}
          onViewDeployments={() => setActiveTab("deployments")}
        />
      )}

      {activeTab === "services" && (
        <ProjectServicesTab services={services} environments={environments} />
      )}

      {activeTab === "environments" && (
        <ProjectEnvironmentsTab
          environments={environments}
          services={services}
          deployments={deployments}
        />
      )}

      {activeTab === "deployments" && (
        <ProjectDeploymentsTab
          deployments={deployments}
          environmentById={environmentById}
        />
      )}

      {activeTab === "logs" && <ProjectLogsTab logSources={logSources} />}

      {activeTab === "settings" && (
        <ProjectSettingsTab project={project} onEdit={openEdit} />
      )}

      {isEditing && (
        <EditProjectDialog
          name={editName}
          description={editDescription}
          isSaving={isSaving}
          onNameChange={setEditName}
          onDescriptionChange={setEditDescription}
          onClose={() => setIsEditing(false)}
          onSubmit={handleSave}
        />
      )}
    </section>
  );
}
