import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge, RequestStatus } from "./request-status-badge";
import { cn } from "@/lib/utils";

interface RequestCardProps {
  id: string;
  type: "exchange" | "internal";
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  details: {
    title: string;
    subtitle: string;
    amount?: string;
  };
  onDetailsClick: () => void;
  className?: string;
}

export function RequestCard({
  id,
  type,
  status,
  createdAt,
  updatedAt,
  details,
  onDetailsClick,
  className,
}: RequestCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="dark:text-dark-foreground font-mono text-sm font-semibold text-foreground">
                {id}
              </span>
              <span className="dark:bg-dark-surfaceAlt rounded-full bg-surfaceAlt px-2 py-0.5 text-xs">
                {type === "exchange" ? "💱 Обмен" : "📝 Внутренняя"}
              </span>
            </div>

            <h3 className="dark:text-dark-foreground text-base font-semibold text-foreground">
              {details.title}
            </h3>

            <p className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
              {details.subtitle}
            </p>

            {details.amount && (
              <p className="dark:text-dark-foreground text-lg font-medium text-foreground">
                {details.amount}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-foregroundMuted">
              <span>📅 {formattedDate}</span>
            </div>
          </div>

          {/* Right side - Status and Action */}
          <div className="flex flex-col items-end gap-3">
            <RequestStatusBadge status={status} />
            <Button onClick={onDetailsClick} variant="outline" size="sm">
              Детали
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
