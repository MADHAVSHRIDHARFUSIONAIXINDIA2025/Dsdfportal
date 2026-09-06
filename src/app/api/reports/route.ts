import { apiHandler } from "@/lib/api-handler";
import { ok } from "@/lib/http";
import { attendanceReport } from "@/lib/services/attendance";
import { repeatLinks, ticketFlow } from "@/lib/services/dashboard";

export const GET = apiHandler("admin", async (request) => {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") || "flow";
  if (kind === "repeats") return ok(await repeatLinks());
  if (kind === "attendance") {
    const from = url.searchParams.get("from") || new Date().toISOString().slice(0, 10);
    const to = url.searchParams.get("to") || from;
    return ok(
      await attendanceReport({
        from,
        to,
        engineerId: url.searchParams.get("engineerId") || undefined,
        status: url.searchParams.get("status") || undefined,
      })
    );
  }
  return ok(await ticketFlow());
});
