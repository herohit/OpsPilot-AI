import { useEffect, useState } from "react";
import { Box, BriefcaseBusiness, Layers, Rocket } from "lucide-react";
import DashboardStatCard from "../components/dashboard/DashboardStatCard";
import DeploymentsPanel from "../components/dashboard/DeploymentsPanel";
import InfrastructureHealthPanel from "../components/dashboard/InfrastructureHealthPanel";
import RecentLogsPanel from "../components/dashboard/RecentLogsPanel";
import ResourceUsagePanel from "../components/dashboard/ResourceUsagePanel";
import useProjectStore from "../store/projectStore";
import {
  getProjects,
  getServices,
  getEnvironments,
  getDeployments,
} from "../api/DashboardtApi";

const Dashboard = () => {
  const projects = useProjectStore((state) => state.projects);
  const setProjects = useProjectStore((state) => state.setProjects);
  const [serviceStats, setServiceStats] = useState(null);
  const [environmentStats, setEnvironmentStats] = useState(null);
  const [deploymentStats, setDeploymentStats] = useState(null);
  const [environments, setEnvironments] = useState([]);
  useEffect(() => {
    const load_dashboard = async () => {
      try {
        const result = await Promise.allSettled([
          getProjects(),
          getServices(),
          getEnvironments(),
          getDeployments(),
        ]);
        if (result[0].status === "fulfilled") {
          setProjects(result[0].value);
        }
        setServiceStats(
          result[1].status === "fulfilled" ? result[1].value : null,
        );
        setEnvironmentStats(
          result[2].status === "fulfilled" ? result[2].value : null,
        );
        setEnvironments(
          result[2].status === "fulfilled" ? result[2].value : [],
        );
        setDeploymentStats(
          result[3].status === "fulfilled" ? result[3].value : [],
        );
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };
    load_dashboard();
  }, [setProjects]);
  const deployments = [...(deploymentStats ?? [])].sort(
    (first, second) =>
      new Date(second.deployed_at).getTime() -
      new Date(first.deployed_at).getTime(),
  );
  const environmentNames = new Map(
    environments.map((environment) => [environment.id, environment.name]),
  );
  const healthCounts = deployments.reduce(
    (counts, deployment) => {
      const status = deployment.status?.toLowerCase();
      if (status === "success") counts.healthy += 1;
      else if (status === "failed" || status === "cancelled") counts.unhealthy += 1;
      else counts.degraded += 1;
      return counts;
    },
    { healthy: 0, degraded: 0, unhealthy: 0 },
  );

  const stats = [
    {
      title: "Total Projects",
      count: projects?.length ?? 0,
      Icon: BriefcaseBusiness,
      iconClassName: "bg-blue-100 text-blue-600",
      trendLabel: "+20%",
      trendDirection: "up",
    },
    {
      title: "Services",
      count: serviceStats?.length ?? 0,
      Icon: Layers,
      iconClassName: "bg-amber-100 text-amber-600",
      trendLabel: "+12%",
      trendDirection: "up",
    },
    {
      title: "Environments",
      count: environmentStats?.length ?? 0,
      Icon: Box,
      iconClassName: "bg-emerald-100 text-emerald-600",
      trendLabel: "+8%",
      trendDirection: "up",
    },
    {
      title: "Deployments",
      count: deploymentStats?.length ?? 0,
      Icon: Rocket,
      iconClassName: "bg-rose-100 text-rose-600",
      trendLabel: "-4%",
      trendDirection: "down",
    },
  ];

  return (
    <div className="flex flex-col gap-3 pb-2 xl:grid xl:flex-1 xl:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]">
      <section aria-label="Dashboard statistics">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {stats.map(({ title, count, Icon, iconClassName, trendLabel, trendDirection }) => (
            <DashboardStatCard
              key={title}
              count={count}
              title={title}
              Icon={Icon}
              iconClassName={iconClassName}
              trendLabel={trendLabel}
              trendDirection={trendDirection}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]" aria-label="Deployment and infrastructure overview">
        <DeploymentsPanel deployments={deployments} environmentNames={environmentNames} />
        <InfrastructureHealthPanel healthCounts={healthCounts} />
      </section>

      <section className="grid gap-3 xl:grid-cols-2" aria-label="Recent activity and resource usage">
        <RecentLogsPanel
          deployments={deployments}
          environmentNames={environmentNames}
        />
        <ResourceUsagePanel />
      </section>
    </div>
  );
};

export default Dashboard;
