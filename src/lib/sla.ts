export function computeSla(openTime?: string | null, closeTime?: string | null, slaHours?: number | null) {
  if (!openTime || !closeTime) {
    return { duration: null as string | null, slaResult: null as "MET" | "BREACHED" | null };
  }

  const open = new Date(openTime.replace(" ", "T"));
  const close = new Date(closeTime.replace(" ", "T"));
  if (Number.isNaN(open.getTime()) || Number.isNaN(close.getTime())) {
    return { duration: null, slaResult: null };
  }

  const minutes = Math.max(0, Math.round((close.getTime() - open.getTime()) / 60000));
  const duration = `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  const limit = (slaHours || 0) * 60;
  return {
    duration,
    slaResult: minutes > limit ? ("BREACHED" as const) : ("MET" as const),
  };
}
