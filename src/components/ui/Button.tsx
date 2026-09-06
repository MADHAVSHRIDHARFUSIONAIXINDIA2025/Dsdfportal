import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-10 px-3 text-sm",
        size === "md" && "h-12 px-4 text-sm",
        size === "lg" && "h-14 px-5 text-base",
        variant === "primary" && "bg-brand text-white shadow-card hover:bg-blue-700",
        variant === "secondary" && "bg-white text-ink border border-line hover:bg-slate-50",
        variant === "ghost" && "bg-transparent text-ink hover:bg-white/10",
        variant === "danger" && "bg-danger text-white hover:bg-red-700",
        className
      )}
      {...props}
    />
  );
}
