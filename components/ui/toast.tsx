"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error" | "warning";

export interface ToastItem {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  show: (toast: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const defaultDuration = 5000;

const variantStyles: Record<ToastVariant, string> = {
  default: "border-white/10 bg-surface/95 text-foreground shadow-lg shadow-black/40",
  success:
    "border-emerald-500/40 bg-emerald-500/15 text-emerald-100 shadow-lg shadow-emerald-500/30",
  error: "border-red-500/40 bg-red-500/15 text-red-100 shadow-lg shadow-red-500/30",
  warning: "border-amber-500/40 bg-amber-500/15 text-amber-50 shadow-lg shadow-amber-500/30",
};

let toastIdCounter = 0;

const generateToastId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Use counter instead of Math.random() to avoid hydration issues
  return `toast-${++toastIdCounter}`;
};

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = generateToastId();
      const duration = toast.duration ?? defaultDuration;

      setToasts((current) => [...current, { ...toast, id }]);

      if (duration > 0 && typeof window !== "undefined") {
        window.setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss],
  );

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      dismiss,
      show,
      clear,
    }),
    [toasts, dismiss, show, clear],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

function ToastViewport({ toasts, onDismiss }: ToastViewportProps): JSX.Element | null {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-3 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto w-full max-w-sm rounded-xl border px-5 py-4 transition-opacity",
            variantStyles[toast.variant ?? "default"],
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              {toast.title ? (
                <p className="text-sm font-semibold leading-5">{toast.title}</p>
              ) : null}
              {toast.description ? (
                <p className="text-inherit/80 text-sm">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-inherit/70 text-sm transition-colors hover:text-inherit"
              aria-label="Закрыть уведомление"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
