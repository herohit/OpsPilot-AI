import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { pathname } = useLocation();
  const isProjectsPage = pathname === "/projects";
  const isCreateProjectPage = pathname === "/projects/new";
  const isProjectDetailPage =
    pathname.startsWith("/projects/") && !isCreateProjectPage;

  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-[#f8faff]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        searchQuery={searchQuery}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          title={
            isCreateProjectPage
              ? "Create a new project"
              : isProjectsPage
                ? "Projects"
                : "Dashboard"
          }
          description={
            isCreateProjectPage
              ? "Set up a new project to organise your services and environments."
              : isProjectsPage
                ? "Manage your projects and their infrastructure"
                : "Overview of your infrastructure and deployments"
          }
          showDateRange={!isProjectsPage && !isCreateProjectPage}
          showPageHeading={!isProjectDetailPage}
        />
        <main className="flex flex-1 flex-col py-1 sm:px-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
