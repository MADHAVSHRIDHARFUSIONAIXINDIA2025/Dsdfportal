import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { ok, readJson } from "@/lib/http";
import { passwordUpdateSchema } from "@/lib/validations";
import { User } from "@/models";

export const PATCH = apiHandler("user", async (request, _ctx, user) => {
  const body = passwordUpdateSchema.parse(await readJson(request));
  const account = await User.findById(user?.id);
  if (!account) throw new AppError("Account not found", 404);
  if (!(await verifyPassword(body.currentPassword, account.passwordHash))) {
    throw new AppError("Current password is incorrect", 400);
  }
  account.passwordHash = await hashPassword(body.password);
  await account.save();
  return ok({ ok: true });
});
