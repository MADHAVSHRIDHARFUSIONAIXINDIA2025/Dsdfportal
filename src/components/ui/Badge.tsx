import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  default: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  navy: "bg-navy text-white",
};

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: keyof typeof tones }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide", tones[tone])}>
      {children}
    </span>
  );
}

export function statusTone(status?: string | null) {
  if (!status) return "default" as const;
  if (["Closed", "MET", "OK", "Present", "Active", "active"].includes(status)) return "green" as const;
  if (["Open", "Assigned", "In Progress", "Pending", "invited", "LOW"].includes(status)) return "amber" as const;
  if (["BREACHED", "Critical", "Absent", "Not OK", "disabled"].includes(status)) return "red" as const;
  if (["Implementation", "ISSUE"].includes(status)) return "blue" as const;
  return "default" as const;
}
