import { connectDB } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/http";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { loginSchema } from "@/lib/validations";
import { User } from "@/models";
import { normalizePhone } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = loginSchema.parse(await readJson(request));
    const identifier = body.identifier.trim().toLowerCase();
    const phone = normalizePhone(body.identifier);
    const user = await User.findOne({
      status: "active",
      $or: [{ email: identifier }, { mobile: body.identifier }, { mobile: phone }],
    });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new AppError("Invalid login details", 401);
    }

    const session = {
      id: String(user._id),
      name: user.name,
      role: user.role,
      email: user.email,
      mobile: user.mobile,
      engineerId: user.engineerId ? String(user.engineerId) : undefined,
    };
    await setSessionCookie(session);
    return ok({ user: session });
  } catch (error) {
    return fail(error);
  }
}
