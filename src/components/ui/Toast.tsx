"use client";

import { createContext, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string; tone: "ok" | "error" };

const ToastContext = createContext<{
  push: (message: string, tone?: Toast["tone"]) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const api = useMemo(
    () => ({
      push(message: string, tone: Toast["tone"] = "ok") {
        const id = Date.now();
        setItems((current) => [...current, { id, message, tone }]);
        setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3200);
      },
    }),
    []
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[70] flex flex-col items-center gap-2 px-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${
              item.tone === "ok" ? "bg-navy" : "bg-danger"
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}
