import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("dark:bg-dark-outline/50 animate-pulse rounded-md bg-outline/50", className)}
    />
  );
}
