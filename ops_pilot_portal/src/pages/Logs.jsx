import { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router";
import {
  createLogSource,
  getEnvironments,
  getLogSources,
  getLogs,
  getServices,
} from "../api/DashboardtApi";
import { streamLogs } from "../api/LogStreamApi";

const levels = ["all", "DEBUG", "INFO", "WARN", "WARNING", "ERROR", "CRITICAL"];
const timeRanges = [
  { hours: 1, label: "Last 1 hour" },
  { hours: 6, label: "Last 6 hours" },
  { hours: 24, label: "Last 24 hours" },
  { hours: 168, label: "Last 7 days" },
];

const levelColors = {
  DEBUG: "bg-blue-600 text-white",
  INFO: "bg-blue-600 text-white",
  WARN: "bg-amber-500 text-white",
  WARNING: "bg-amber-500 text-white",
  ERROR: "bg-rose-600 text-white",
  CRITICAL: "bg-rose-700 text-white",
};

const formatLogTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const getLogContext = (entry) => {
  const payload = entry.payload ?? {};
  const location = [
    payload.module,
    payload.function,
  ].filter(Boolean).join(".");
  const locationWithLine = location && payload.line
    ? `${location}:${payload.line}`
    : location;
  return [payload.event, locationWithLine].filter(Boolean).join(" · ");
};

const getLogMetadata = (payload = {}) =>
  Object.entries(payload)
    .filter(([key]) => !["timestamp", "level", "severity", "logger", "message", "msg", "event", "module", "function", "line"].includes(key))
    .map(([key, value]) => `${key}=${typeof value === "object" ? JSON.stringify(value) : value}`)
    .join(" · ");

export default function Logs() {
  const [services, setServices] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [logSources, setLogSources] = useState([]);
  const [serviceId, setServiceId] = useState("all");
  const [environmentId, setEnvironmentId] = useState("all");
  const [level, setLevel] = useState("all");
  const [hours, setHours] = useState(1);
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [sourceEnvironmentId, setSourceEnvironmentId] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [isSavingSource, setIsSavingSource] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([getServices(), getEnvironments()]).then(
      async (results) => {
        if (!isMounted) return;
        const loadedServices =
          results[0].status === "fulfilled" ? results[0].value : [];
        const loadedEnvironments =
          results[1].status === "fulfilled" ? results[1].value : [];
        setServices(loadedServices);
        setEnvironments(loadedEnvironments);
        const serviceById = new Map(
          loadedServices.map((service) => [service.id, service]),
        );
        const sourceResults = await Promise.allSettled(
          loadedEnvironments.map((environment) => {
            const service = serviceById.get(environment.service_id);
            return service
              ? getLogSources(
                  environment.project_id,
                  service.id,
                  environment.id,
                )
              : Promise.resolve([]);
          }),
        );
        if (!isMounted) return;
        setLogSources(
          sourceResults.flatMap((result) =>
            result.status === "fulfilled" ? result.value : [],
          ),
        );
      },
    );
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isCurrentConnection = true;
    let reconnectTimer;
    let controller;
    const filters = {
      service_id: serviceId === "all" ? undefined : serviceId,
      environment_id: environmentId === "all" ? undefined : environmentId,
      level: level === "all" ? undefined : level,
      search: search.trim() || undefined,
      hours,
      limit: 500,
    };

    const receiveSnapshot = (records) => {
      if (!isCurrentConnection) return;
      setLogs(records);
      setLoadError(false);
      setIsLoading(false);
    };
    const receiveLog = (entry) => {
      if (!isCurrentConnection) return;
      setLogs((current) => {
        if (current.some((log) => log.id === entry.id)) return current;
        return [entry, ...current].slice(0, 500);
      });
    };

    const connect = async () => {
      controller = new AbortController();
      try {
        await streamLogs(filters, {
          signal: controller.signal,
          onSnapshot: receiveSnapshot,
          onLog: receiveLog,
        });
        if (isCurrentConnection && autoRefresh) {
          reconnectTimer = window.setTimeout(connect, 1000);
        }
      } catch (error) {
        if (!isCurrentConnection || error.name === "AbortError") return;
        setLoadError(true);
        setIsLoading(false);
        if (error.status === 401 || error.status === 403) return;
        if (autoRefresh) reconnectTimer = window.setTimeout(connect, 2000);
      }
    };

    const loadSnapshotOnce = async () => {
      try {
        const records = await getLogs(filters);
        receiveSnapshot(records);
      } catch {
        if (!isCurrentConnection) return;
        setLoadError(true);
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    if (autoRefresh) connect();
    else loadSnapshotOnce();

    return () => {
      isCurrentConnection = false;
      controller?.abort();
      window.clearTimeout(reconnectTimer);
    };
  }, [serviceId, environmentId, level, search, hours, autoRefresh]);

  const scopedEnvironments = environments.filter(
    (environment) =>
      serviceId === "all" || environment.service_id === serviceId,
  );

  const updateServiceFilter = (nextServiceId) => {
    setServiceId(nextServiceId);
    setEnvironmentId("all");
  };

  const openSourceDialog = () => {
    setSourceEnvironmentId(
      environmentId !== "all"
        ? environmentId
        : (scopedEnvironments[0]?.id ?? ""),
    );
    setStreamUrl("");
    setIsSourceDialogOpen(true);
  };

  const handleCreateSource = async (event) => {
    event.preventDefault();
    const environment = environments.find(
      (item) => item.id === sourceEnvironmentId,
    );
    const service = services.find(
      (item) => item.id === environment?.service_id,
    );
    if (!environment || !service) return;

    setIsSavingSource(true);
    try {
      const source = await createLogSource(
        environment.project_id,
        service.id,
        environment.id,
        { stream_url: streamUrl.trim(), source_type: "http_stream" },
      );
      setLogSources((current) => [...current, source]);
      setIsSourceDialogOpen(false);
      setStreamUrl("");
      toast.success("Log source saved. Waiting for streamed events.");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Could not save log source.");
    } finally {
      setIsSavingSource(false);
    }
  };

  return (
    <section className="space-y-4 pb-8" aria-label="Logs">
      <div className="flex justify-end">
        <Link to="/logs/history" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          Browse log history
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(9rem,0.8fr)_minmax(9rem,0.8fr)_minmax(7rem,0.6fr)_minmax(8rem,0.7fr)_minmax(14rem,1.5fr)_auto]">
        <label className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 shadow-sm">
          <span className="sr-only">Filter by service</span>
          <select
            value={serviceId}
            onChange={(event) => updateServiceFilter(event.target.value)}
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
            value={environmentId}
            onChange={(event) => setEnvironmentId(event.target.value)}
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
          <span className="sr-only">Filter by log level</span>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="h-full w-full bg-transparent text-sm text-slate-700 outline-none"
          >
            <option value="all">All Levels</option>
            {levels.slice(1).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 shadow-sm">
          <span className="sr-only">Time range</span>
          <select
            value={hours}
            onChange={(event) => setHours(Number(event.target.value))}
            className="h-full w-full bg-transparent text-sm text-slate-700 outline-none"
          >
            {timeRanges.map((range) => (
              <option key={range.hours} value={range.hours}>
                {range.label}
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
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search logs..."
            aria-label="Search logs"
            className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.target.checked)}
            className="peer sr-only"
          />
          <span
            className={`relative h-5 w-9 rounded-full transition-colors ${autoRefresh ? "bg-blue-600" : "bg-slate-300"}`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${autoRefresh ? "translate-x-4" : "translate-x-0"}`}
            />
          </span>
          Auto refresh
        </label>
        <button
          type="button"
          onClick={openSourceDialog}
          disabled={!scopedEnvironments.length}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add log source
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-700 bg-[#101722] shadow-[0_8px_24px_rgba(15,23,42,0.14)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${autoRefresh ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`}
            />
            <span className="text-xs font-medium text-slate-300">
              {autoRefresh
                ? "Live log stream · connected"
                : "Auto refresh paused"}
            </span>
          </div>
          <span className="text-[11px] tabular-nums text-slate-500">
            {logSources.length} active sources · {logs.length} entries
          </span>
        </div>
        <div className="max-h-[min(65vh,680px)] min-h-48 overflow-auto p-3 font-mono text-xs">
          {isLoading && !logs.length ? (
            <p className="px-2 py-4 text-slate-400">Loading log entries...</p>
          ) : loadError ? (
            <p className="px-2 py-4 text-rose-300">
              Log entries could not be loaded.
            </p>
          ) : logs.length ? (
            <div className="space-y-1">
              {logs.map((entry) => {
                const normalizedLevel = entry.level.toUpperCase();
                const levelClass =
                  levelColors[normalizedLevel] ?? "bg-slate-600 text-white";
                const payload = entry.payload ?? {};
                const context = payload.logger ?? `${entry.service_name} / ${entry.environment_name}`;
                const metadata = getLogMetadata(payload);
                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[9.5rem_3.5rem_minmax(0,1fr)] items-start gap-2 rounded px-2 py-1.5 hover:bg-white/[0.04] sm:grid-cols-[10.5rem_3.75rem_10rem_minmax(0,1fr)]"
                  >
                    <time className="whitespace-nowrap text-[11px] text-slate-500">
                      {formatLogTime(payload.timestamp ?? entry.received_at)}
                    </time>
                    <span
                      className={`w-fit rounded px-1.5 py-0.5 text-[10px] font-bold leading-none ${levelClass}`}
                    >
                      {normalizedLevel}
                    </span>
                    <div className="hidden min-w-0 sm:block">
                      <p className="truncate text-[11px] text-cyan-300">{context}</p>
                      <p className="truncate text-[10px] text-slate-500">
                        {getLogContext(entry) || `${entry.service_name} / ${entry.environment_name}`}
                      </p>
                    </div>
                    <div className="col-span-3 min-w-0 break-words leading-5 text-slate-200 sm:col-span-1">
                      <p>{entry.message}</p>
                      {metadata && <p className="truncate text-[10px] text-slate-500">{metadata}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center px-4 text-center">
              <p className="text-sm font-medium text-slate-300">
                {logSources.length
                  ? "Waiting for log events"
                  : "Configure a log source to begin"}
              </p>
              <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">
                {logSources.length
                  ? "A source is configured. New JSON log records will appear here when its stream sends data."
                  : "Save a stream URL for one of your environments. Incoming JSON records will be stored and shown here."}
              </p>
              {!logSources.length && (
                <button
                  type="button"
                  onClick={openSourceDialog}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                  Add log source
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isSourceDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close log source dialog"
            onClick={() => setIsSourceDialogOpen(false)}
            disabled={isSavingSource}
            className="absolute inset-0 bg-slate-950/40"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-source-title"
            className="relative z-10 w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="log-source-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Add log source
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Connect an HTTP stream that sends newline-delimited JSON log
                  records.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setIsSourceDialogOpen(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSource} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Environment
                <select
                  required
                  value={sourceEnvironmentId}
                  onChange={(event) =>
                    setSourceEnvironmentId(event.target.value)
                  }
                  className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {scopedEnvironments.map((environment) => {
                    const service = services.find(
                      (item) => item.id === environment.service_id,
                    );
                    return (
                      <option key={environment.id} value={environment.id}>
                        {service?.name ?? "Service"} / {environment.name}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Stream URL
                <input
                  required
                  type="url"
                  value={streamUrl}
                  onChange={(event) => setStreamUrl(event.target.value)}
                  placeholder="https://host.example/log-stream"
                  className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-normal outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <p className="text-xs leading-5 text-slate-500">
                The source must return newline-delimited JSON objects. The
                server stores each received object as a log event.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSourceDialogOpen(false)}
                  disabled={isSavingSource}
                  className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSource || !scopedEnvironments.length}
                  className="h-9 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSavingSource ? "Saving..." : "Save source"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
