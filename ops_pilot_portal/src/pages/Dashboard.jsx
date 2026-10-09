import { useEffect, useState } from "react";
import { Box, BriefcaseBusiness, Layers, Rocket } from "lucide-react";
import DashboardStatCard from "../components/DashboardStatCard";
import useProjectStore from "../store/projectStore";
import {
  getProjects,
  getServices,
  getEnvironments,
  getDeployments,
} from "../api/DashboardtApi";

const Dashboard = () => {
  // Access projects from the store
  const projects = useProjectStore((state) => state.projects);
  const setProjects = useProjectStore((state) => state.setProjects);
  const [serviceStats, setServiceStats] = useState(null);
  const [environmentStats, setEnvironmentStats] = useState(null);
  const [deploymentStats, setDeploymentStats] = useState(null);
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
        setDeploymentStats(
          result[3].status === "fulfilled" ? result[3].value : [],
        );
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };
    load_dashboard();
  }, [setProjects]);

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
    <section aria-label="Dashboard statistics">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
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
  );
};

export default Dashboard;
