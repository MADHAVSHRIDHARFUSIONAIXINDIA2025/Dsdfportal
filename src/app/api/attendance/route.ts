import { apiHandler } from "@/lib/api-handler";
import { ok, readJson } from "@/lib/http";
import { attendanceSchema } from "@/lib/validations";
import { listAttendance, saveAttendance } from "@/lib/services/attendance";

export const GET = apiHandler("user", async (_request, _ctx, user) => {
  return ok(await listAttendance(user?.role === "engineer" ? user.engineerId : undefined));
});

export const POST = apiHandler("user", async (request, _ctx, user) => {
  const body = attendanceSchema.parse(await readJson(request));
  if (user?.role === "engineer") body.engineerId = user.engineerId!;
  return ok(await saveAttendance(body), 201);
});
