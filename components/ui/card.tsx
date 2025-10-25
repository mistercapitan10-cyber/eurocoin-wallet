import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export function Card({
  className,
  inset = false,
  ...props
}: CardProps): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-3xl border border-outline bg-surface shadow-card",
        inset && "p-0",
        !inset && "p-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div className={cn("flex flex-col gap-2 pb-4", className)} {...props} />
  );
}

export function CardTitle({
  className,
  children,
}: HTMLAttributes<HTMLHeadingElement> & { children: ReactNode }): JSX.Element {
  return (
    <h2 className={cn("text-lg font-semibold text-foreground", className)}>
      {children}
    </h2>
  );
}

export function CardDescription({
  className,
  children,
}: HTMLAttributes<HTMLParagraphElement> & { children: ReactNode }): JSX.Element {
  return (
    <p className={cn("text-sm text-foregroundMuted", className)}>{children}</p>
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn("pt-4", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn("mt-6 pt-4", className)} {...props} />;
}
