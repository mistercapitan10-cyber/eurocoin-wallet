import { cn } from "@/lib/utils";

export type RequestStatus = "pending" | "processing" | "completed" | "rejected" | "cancelled";

interface RequestStatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    label: "В обработке",
    icon: "⏳",
    colors: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  processing: {
    label: "Выполняется",
    icon: "🔄",
    colors: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  completed: {
    label: "Завершена",
    icon: "✅",
    colors: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  rejected: {
    label: "Отклонена",
    icon: "❌",
    colors: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
  cancelled: {
    label: "Отменена",
    icon: "🚫",
    colors: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  },
};

export function RequestStatusBadge({ status, className }: RequestStatusBadgeProps) {
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
