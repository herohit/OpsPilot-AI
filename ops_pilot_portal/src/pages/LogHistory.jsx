import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import { getEnvironments, getLogHistory, getServices } from "../api/DashboardtApi";

const controlClass = "h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";

export default function LogHistory() {
  const [filters, setFilters] = useState({ service_id: "", environment_id: "", page: 1, page_size: 50 });
  const [refresh, setRefresh] = useState(0);
  const [options, setOptions] = useState({ services: [], environments: [], error: "" });
  const [optionsRetry, setOptionsRetry] = useState(0);
  const [result, setResult] = useState(null);
  const requestKey = JSON.stringify([filters, refresh]);
  const isLoading = result?.key !== requestKey;
  const data = !isLoading ? result?.data : null;
  const error = !isLoading ? result?.error : "";

  useEffect(() => {
    let active = true;
    Promise.all([getServices(), getEnvironments()])
      .then(([services, environments]) => {
        if (active) setOptions({ services, environments, error: "" });
      })
      .catch(() => {
        if (active) setOptions({ services: [], environments: [], error: "Could not load service and environment filters." });
      });
    return () => { active = false; };
  }, [optionsRetry]);

  useEffect(() => {
    const controller = new AbortController();
    getLogHistory({
      ...filters,
      service_id: filters.service_id || undefined,
      environment_id: filters.environment_id || undefined,
    }, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        if (filters.page > Math.max(1, response.total_pages)) {
          setFilters((current) => ({ ...current, page: Math.max(1, response.total_pages) }));
          return;
        }
        setResult({ key: requestKey, data: response });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setResult({ key: requestKey, error: requestError.response?.data?.detail || "Log history could not be loaded. Please try again." });
        }
      });
    return () => controller.abort();
  }, [filters, requestKey]);

  const environments = options.environments.filter(
    (environment) => !filters.service_id || environment.service_id === filters.service_id,
  );
  const updateFilter = (name, value) => {
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === "service_id" ? { environment_id: "" } : {}),
      page: 1,
    }));
  };
  const firstEntry = data?.total ? (data.page - 1) * data.page_size + 1 : 0;
  const lastEntry = data?.total ? firstEntry + data.items.length - 1 : 0;

  return (
    <section className="space-y-4 pb-8" aria-label="Log history">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Stored database logs, newest first. Refresh to load new entries.</p>
        <Link to="/logs" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View live logs</Link>
      </div>
      {options.error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-rose-700">
          {options.error}
          <button type="button" className="font-semibold underline" onClick={() => setOptionsRetry((current) => current + 1)}>Retry filters</button>
        </div>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-600">
          Service
          <select className={controlClass} value={filters.service_id} onChange={(event) => updateFilter("service_id", event.target.value)}>
            <option value="">All services</option>
            {options.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </select>
        </label>
        <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-600">
          Environment
          <select className={controlClass} value={filters.environment_id} onChange={(event) => updateFilter("environment_id", event.target.value)}>
            <option value="">All environments</option>
            {environments.map((environment) => <option key={environment.id} value={environment.id}>{environment.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Entries per page
          <select className={controlClass} value={filters.page_size} onChange={(event) => updateFilter("page_size", Number(event.target.value))}>
            {[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <button type="button" disabled={isLoading} onClick={() => setRefresh((current) => current + 1)} className={`${controlClass} inline-flex items-center gap-2`}>
          <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-700 bg-[#101722] shadow-lg" aria-busy={isLoading}>
        {isLoading ? (
          <p role="status" className="p-6 text-sm text-slate-300">Loading log history...</p>
        ) : error ? (
          <div role="alert" className="space-y-3 p-6 text-sm text-rose-300">
            <p>{error}</p>
            <button type="button" onClick={() => setRefresh((current) => current + 1)} className="font-semibold underline">Retry</button>
          </div>
        ) : !data?.items.length ? (
          <p className="p-8 text-center text-sm text-slate-300">No stored logs match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <caption className="sr-only">Stored logs, ordered by received time, newest first</caption>
              <thead className="border-b border-white/10 text-slate-400">
                <tr>{["Received at", "Level", "Service / Environment", "Message"].map((title) => <th key={title} scope="col" className="px-4 py-3 font-medium">{title}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {data.items.map((entry) => (
                  <tr key={entry.id} className="align-top hover:bg-white/[0.04]">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400"><time dateTime={entry.received_at}>{new Date(entry.received_at).toLocaleString()}</time></td>
                    <td className="px-4 py-3"><span className={`rounded px-1.5 py-0.5 font-bold ${["ERROR", "CRITICAL"].includes(entry.level) ? "bg-rose-700 text-white" : ["WARN", "WARNING"].includes(entry.level) ? "bg-amber-500 text-white" : "bg-blue-600 text-white"}`}>{entry.level}</span></td>
                    <td className="px-4 py-3 text-cyan-300">{entry.service_name}<p className="mt-1 text-slate-500">{entry.environment_name}</p></td>
                    <td className="min-w-64 max-w-2xl px-4 py-3">
                      <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{entry.message}</p>
                      <details className="mt-2 text-slate-400">
                        <summary className="w-fit cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-400">View payload</summary>
                        <pre className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{JSON.stringify(entry.payload, null, 2)}</pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <nav aria-label="Log history pagination" className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm tabular-nums text-slate-500">
          {data ? `Showing ${firstEntry}-${lastEntry} of ${data.total} entries` : isLoading ? "Loading entries..." : "Entries unavailable"}
        </p>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Previous page" className={controlClass} disabled={!data || data.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
          <span className="text-sm tabular-nums text-slate-600">{data ? `Page ${data.total_pages ? data.page : 0} of ${data.total_pages}` : "Page -"}</span>
          <button type="button" aria-label="Next page" className={controlClass} disabled={!data || data.page >= data.total_pages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </nav>
    </section>
  );
}
