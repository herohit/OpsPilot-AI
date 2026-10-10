import {
  Bell,
  Building2,
  ChevronDown,
  Menu,
  Search,
  UserRound,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function Header({
  onOpenSidebar,
  searchQuery,
  onSearchChange,
  workspaceName = "OpsPilot",
  title = "Dashboard",
  description = "Overview of your infrastructure and deployments",
  showDateRange = true,
  showPageHeading = true,
}) {
  const user = useAuthStore((state) => state.user);
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ");
  const displayName = fullName || user?.email?.split("@")[0] || "Account";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <header className="border-b border-slate-200/70 bg-[#f8faff] px-5 pb-4 pt-3 text-slate-900 sm:px-8">
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          aria-controls="app-sidebar"
          title="Open navigation"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <label className="relative flex h-10 max-w-44 items-center rounded-md border border-slate-200 bg-white shadow-sm">
          <Building2
            aria-hidden="true"
            className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500"
          />
          <span className="sr-only">Workspace</span>
          <select
            className="h-full w-full appearance-none rounded-md bg-transparent pl-9 pr-8 text-sm font-semibold focus:outline-2 focus:outline-blue-600"
            defaultValue={workspaceName}
          >
            <option value={workspaceName}>{workspaceName}</option>
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-slate-500"
          />
        </label>

        <div className="relative order-last w-full sm:order-none sm:mx-auto sm:w-auto sm:max-w-[480px] sm:flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search navigation"
            placeholder="Search navigation..."
            className="h-10 w-full rounded-full border border-transparent bg-slate-100 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-500 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
          <details className="group relative">
            <summary
              aria-label="Notifications"
              title="Notifications"
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md text-[#334786] hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden"
            >
              <Bell aria-hidden="true" className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 top-12 z-30 w-56 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
              <h2 className="text-sm font-semibold">Notifications</h2>
              <p className="mt-2 text-sm text-slate-500">No notifications</p>
            </div>
          </details>

          <details className="relative">
            <summary
              aria-label="Account details"
              className="flex cursor-pointer list-none items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#334786] text-sm font-semibold text-white">
                {initials}
              </span>
              <span className="hidden min-w-0 md:block">
                <span className="block max-w-40 truncate text-sm font-semibold">
                  {displayName}
                </span>
                <span className="mt-0.5 block max-w-40 truncate text-xs text-slate-500">
                  {user?.email}
                </span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className="hidden h-3.5 w-3.5 text-slate-500 sm:block"
              />
            </summary>
            <div className="absolute right-0 top-14 z-30 w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UserRound
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-slate-500"
                />
                <span className="break-words">{displayName}</span>
              </div>
              <p className="mt-2 break-all text-xs text-slate-500">
                {user?.email}
              </p>
            </div>
          </details>
        </div>
      </div>

      {showPageHeading && <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight tracking-normal sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
        {showDateRange && (
          <label className="relative flex h-10 shrink-0 items-center rounded-md border border-slate-200 bg-white shadow-sm">
            <span className="sr-only">Date range</span>
            <select
              defaultValue="7"
              className="h-full appearance-none rounded-md bg-transparent pl-4 pr-10 text-sm font-medium text-slate-600 focus:outline-2 focus:outline-blue-600"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400"
            />
          </label>
        )}
      </div>}
    </header>
  );
}
