import { CircleAlert, CircleCheck, Clock3 } from "lucide-react";

export const getDeploymentStatus = (status = "pending") => {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "success") {
    return {
      label: "Success",
      className: "bg-emerald-50 text-emerald-700",
      Icon: CircleCheck,
    };
  }
  if (normalizedStatus === "failed" || normalizedStatus === "cancelled") {
    return {
      label: normalizedStatus[0].toUpperCase() + normalizedStatus.slice(1),
      className: "bg-rose-50 text-rose-700",
      Icon: CircleAlert,
    };
  }
  return {
    label: normalizedStatus[0].toUpperCase() + normalizedStatus.slice(1),
    className: "bg-amber-50 text-amber-700",
    Icon: Clock3,
  };
};

export const formatTimeAgo = (value) => {
  if (!value) return "Time unavailable";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Time unavailable";

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} ${elapsedHours === 1 ? "hour" : "hours"} ago`;
  }
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} ${elapsedDays === 1 ? "day" : "days"} ago`;
};