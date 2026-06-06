"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocale } from "@/components/ui/LocaleProvider";

export type ToastType = "success" | "error" | "info";

export interface ToastInput {
  message?: string;
  title: string;
  type: ToastType;
}

interface ToastMessage extends ToastInput {
  id: number;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => number;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => 0,
});

const toastStyles: Record<ToastType, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100",
  error:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100",
  info:
    "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-100",
};

let nextToastId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = nextToastId++;

      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 5000);

      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
      >
        {toasts.map((toast) => (
          <div
            className={`rounded-lg border px-4 py-3 shadow-lg ${toastStyles[toast.type]}`}
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.message ? (
                  <p className="mt-1 text-sm opacity-90">{toast.message}</p>
                ) : null}
              </div>
              <button
                aria-label={`${t("dismiss")} ${toast.title}`}
                className="rounded px-1 text-sm font-semibold opacity-70 hover:opacity-100"
                onClick={() => dismiss(toast.id)}
                type="button"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
