import { Badge, statusTone } from "./Badge";

export function RecordCard({
  title,
  meta,
  badges = [],
  onEdit,
  onDelete,
  extra,
}: {
  title: string;
  meta: string[];
  badges?: string[];
  onEdit?: () => void;
  onDelete?: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-ink">{title}</h3>
          <div className="mt-2 space-y-1">
            {meta.filter(Boolean).map((line) => (
              <p key={line} className="text-sm text-muted">
                {line}
              </p>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {badges.map((badge) => (
            <Badge key={badge} tone={statusTone(badge)}>
              {badge}
            </Badge>
          ))}
        </div>
      </div>
      {(onEdit || onDelete || extra) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onEdit ? (
            <button className="rounded-xl bg-brand-soft px-3 py-2 text-sm font-semibold text-brand" onClick={onEdit}>
              Edit
            </button>
          ) : null}
          {onDelete ? (
            <button className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-danger" onClick={onDelete}>
              Delete
            </button>
          ) : null}
          {extra}
        </div>
      )}
    </article>
  );
}
