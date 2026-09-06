"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./Button";

export function Sheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-navy/50 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[28px] bg-canvas pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl",
          "md:inset-auto md:right-0 md:top-0 md:h-full md:w-[min(520px,100%)] md:rounded-none"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />
            <h2 className="text-lg font-bold text-ink">{title}</h2>
          </div>
          <Button variant="secondary" size="sm" className="rounded-full px-3" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
