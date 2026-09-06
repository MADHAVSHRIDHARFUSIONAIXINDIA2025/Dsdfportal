import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-3xl border border-line bg-white shadow-card", className)}>{children}</section>;
}

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "ok" | "warn" | "danger";
}) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold",
          tone === "ok" && "text-ok",
          tone === "warn" && "text-warn",
          tone === "danger" && "text-danger",
          tone === "default" && "text-ink"
        )}
      >
        {value}
      </p>
    </Card>
  );
}
