import { apiHandler } from "@/lib/api-handler";
import { ok, readJson } from "@/lib/http";
import { attendanceSchema } from "@/lib/validations";
import { deleteAttendance, saveAttendance } from "@/lib/services/attendance";

export const PATCH = apiHandler("user", async (request, ctx: { params: Promise<{ id: string }> }, user) => {
  const body = attendanceSchema.parse(await readJson(request));
  if (user?.role === "engineer") body.engineerId = user.engineerId!;
  return ok(await saveAttendance(body, (await ctx.params).id));
});

export const DELETE = apiHandler("admin", async (_request, ctx: { params: Promise<{ id: string }> }) => {
  await deleteAttendance((await ctx.params).id);
  return ok({ ok: true });
});
