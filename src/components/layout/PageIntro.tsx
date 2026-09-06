import { Button } from "@/components/ui/Button";

export function PageIntro({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action ? (
        <Button onClick={action.onClick} className="shrink-0">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
