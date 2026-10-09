import { TrendingDown, TrendingUp } from "lucide-react";

const DashboardStatCard = ({
  count,
  title,
  Icon,
  iconClassName,
  trendLabel,
  trendDirection,
}) => {
  const TrendIcon = trendDirection === "down" ? TrendingDown : TrendingUp;
  const trendColor = trendDirection === "down" ? "text-rose-600" : "text-emerald-600";

  return (
    <div className="flex min-h-[84px] items-center gap-3 rounded-lg border border-slate-200/80 bg-white px-4 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${iconClassName}`}
      >
        <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-xs font-medium text-slate-500">{title}</h2>
        <p className="mt-1 text-2xl font-semibold leading-none tabular-nums text-slate-900">
          {count}
        </p>
      </div>
      {trendLabel && (
        <span className={`mt-auto flex shrink-0 items-center gap-0.5 text-[11px] font-semibold tabular-nums ${trendColor}`}>
          <TrendIcon aria-hidden="true" className="h-3 w-3" />
          {trendLabel}
        </span>
      )}
    </div>
  )
}

export default DashboardStatCard;