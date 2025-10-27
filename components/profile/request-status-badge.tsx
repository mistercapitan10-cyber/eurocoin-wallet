import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

export type RequestStatus = "pending" | "processing" | "completed" | "rejected" | "cancelled";

interface RequestStatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export function RequestStatusBadge({ status, className }: RequestStatusBadgeProps) {
  const t = useTranslation();

  const statusConfig = {
    pending: {
      label: t("profile.status.pending"),
      icon: "⏳",
      colors: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    },
    processing: {
      label: t("profile.status.processing"),
      icon: "🔄",
      colors: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
    completed: {
      label: t("profile.status.completed"),
      icon: "✅",
      colors: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    },
    rejected: {
      label: t("profile.status.rejected"),
      icon: "❌",
      colors: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    },
    cancelled: {
      label: t("profile.status.cancelled"),
      icon: "🚫",
      colors: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        config.colors,
        className,
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
