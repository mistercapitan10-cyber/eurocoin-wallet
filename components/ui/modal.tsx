"use client";

import type { ReactNode } from "react";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  showCloseButton?: boolean;
}

const sizeMap: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
}: ModalProps): JSX.Element | null {
  const labelledBy = useId();
  const describedBy = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? labelledBy : undefined}
        aria-describedby={description ? describedBy : undefined}
        className={cn(
          "relative w-full rounded-2xl border border-white/10 bg-surface p-6 shadow-xl shadow-black/50",
          sizeMap[size],
        )}
      >
        <div className="flex flex-col gap-1">
          {title ? (
            <h2
              id={labelledBy}
              className="text-xl font-semibold text-white"
            >
              {title}
            </h2>
          ) : null}
          {description ? (
            <p id={describedBy} className="text-sm text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>

        <div className="mt-6">{children}</div>

        {showCloseButton ? (
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute right-4 top-4 text-zinc-500 transition-colors hover:text-zinc-300"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
