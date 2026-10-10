import {
  Box,
  BriefcaseBusiness,
  FileText,
  House,
  Layers,
  Rocket,
  Settings,
  X,
} from "lucide-react";
import { NavLink } from "react-router";
import OpsPilotLogo from "./OpsPilotLogo";

const navigation = [
  { label: "Dashboard", Icon: House, to: "/dashboard" },
  { label: "Projects", Icon: BriefcaseBusiness, to: "/projects" },
  { label: "Services", Icon: Layers, to: "/services" },
  { label: "Environments", Icon: Box, to: "/environments" },
  { label: "Deployments", Icon: Rocket, to: "/deployments" },
  { label: "Logs", Icon: FileText, to: "/logs" },
  { label: "Settings", Icon: Settings, to: "/settings" },
];

export default function Sidebar({ isOpen, onClose, searchQuery = "" }) {
  const items = navigation.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  return (
    <aside
      id="app-sidebar"
      aria-label="Main navigation"
      className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-56 shrink-0 flex-col border-r border-white/5 bg-[#111827] text-white transition-transform duration-200 lg:visible lg:sticky lg:top-0 lg:translate-x-0 ${isOpen ? "visible translate-x-0" : "invisible -translate-x-full"}`}
    >
      <div className="flex items-center justify-between px-5 py-6">
        <OpsPilotLogo />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          title="Close navigation"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400 lg:hidden"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
        {items.map(({ label, Icon, to }) =>
          to ? (
            <NavLink
              key={label}
              to={to}
              end={to === "/dashboard"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-400 ${isActive ? "bg-[#23365d] text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`
              }
            >
              <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
              {label}
            </NavLink>
          ) : (
            <button
              key={label}
              type="button"
              disabled
              title={`${label} is not available yet`}
              className="flex h-11 w-full cursor-not-allowed items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-slate-400"
            >
              <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
              {label}
            </button>
          ),
        )}
        {items.length === 0 && (
          <p className="px-3 py-4 text-sm text-slate-400">No matching pages</p>
        )}
      </nav>
    </aside>
  );
}
